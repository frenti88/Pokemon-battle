/* ============ registry.js — arquitectura extensible de contenidos ============
 * Proporciona registros desacoplados y orientados a datos para:
 *   1. G.PokemonRegistry   — registro, validación y consulta de Pokémon con fallbacks de sprites.
 *   2. G.MoveRegistry      — registro de movimientos y familias de combate reutilizables.
 *   3. G.StageRegistry     — registro de escenarios, biomas y arenas.
 *   4. G.ModeRegistry      — registro de modos de juego y contratos de ciclo de vida.
 *
 * Mantiene compatibilidad total con los catálogos y estructuras originales de PokéSurvivor.
 */
window.G = window.G || {};

// ============================================================================
// 1. REGISTRO DE POKÉMON
// ============================================================================
G.PokemonRegistry = (() => {
  const custom = new Map();
  const FALLBACK_DEFAULT_DEX = 25; // Pikachu como fallback universal por defecto

  /** Valida la definición de un Pokémon. Devuelve { ok, errors } */
  function validate(def) {
    const errs = [];
    if (!def) return { ok: false, errors: ['Definición nula o indefinida'] };
    if (!def.id && !def.dex) errs.push('Requiere identificador único (id o dex)');
    if (!def.name || typeof def.name !== 'string') errs.push('Requiere nombre visible (string)');
    if (!Array.isArray(def.types) || !def.types.length) errs.push('Requiere array de tipos con al menos un tipo');
    if (def.hp != null && (typeof def.hp !== 'number' || def.hp <= 0)) errs.push('HP debe ser un número positivo');
    if (def.spd != null && (typeof def.spd !== 'number' || def.spd <= 0)) errs.push('Velocidad (spd) debe ser un número positivo');
    if (def.atk != null && (typeof def.atk !== 'number' || def.atk <= 0)) errs.push('Ataque (atk) debe ser un número positivo');
    return { ok: errs.length === 0, errors: errs };
  }

  /**
   * Registra un Pokémon adicional o personalizado.
   * Si carece de recursos visuales completos, utiliza la política de fallback especificada.
   */
  function register(def) {
    const v = validate(def);
    if (!v.ok) {
      console.warn('[PokemonRegistry] Error al registrar Pokémon:', v.errors.join('; '));
      return false;
    }
    const dex = def.dex || def.id;
    const entry = {
      dex,
      id: def.id || dex,
      name: def.name,
      types: def.types.slice(),
      hp: def.hp || 90,
      spd: def.spd || 100,
      atk: def.atk || 1.0,
      rarity: def.rarity || 1,
      bst: def.bst || 300,
      starter: !!def.starter,
      gen: def.gen || 1,
      leg: !!def.leg,
      fallbackDex: def.fallbackDex || FALLBACK_DEFAULT_DEX,
      customSprites: def.sprites || null,
      startMove: def.startMove || null,
      traits: def.traits || ['valiente']
    };

    custom.set(dex, entry);
    if (typeof dex === 'string') custom.set(dex.toLowerCase(), entry);

    // Integrar en catálogos del juego
    if (window.G) {
      if (G.DEX && !G.DEX.some(p => p.dex === dex)) G.DEX.push(entry);
      if (G.DEX_BY) G.DEX_BY[dex] = entry;
      if (entry.starter && G.STARTERS && !G.STARTERS.some(s => s.dex === dex)) {
        const sEntry = { dex, start: entry.startMove || 'tackle', traits: entry.traits };
        G.STARTERS.push(sEntry);
        if (G.STARTER_BY) G.STARTER_BY[dex] = sEntry;
      }
    }

    // Adaptar metadatos de sprite con política de fallback si no existen
    if (window.G && G.SPRITE_META && !G.SPRITE_META[dex]) {
      const fbMeta = G.SPRITE_META[entry.fallbackDex] || G.SPRITE_META[FALLBACK_DEFAULT_DEX];
      if (fbMeta) {
        G.SPRITE_META[dex] = JSON.parse(JSON.stringify(fbMeta));
        // Marcar que usa fallback para reusar spritesheet
        G.SPRITE_META[dex]._fallbackDex = entry.fallbackDex;
      }
    }

    return true;
  }

  function get(idOrDex) {
    if (idOrDex == null) return null;
    if (custom.has(idOrDex)) return custom.get(idOrDex);
    if (typeof idOrDex === 'string' && custom.has(idOrDex.toLowerCase())) return custom.get(idOrDex.toLowerCase());
    if (window.G && G.DEX_BY && G.DEX_BY[idOrDex]) return G.DEX_BY[idOrDex];
    return null;
  }

  function has(idOrDex) {
    return get(idOrDex) !== null;
  }

  function getAll() {
    const list = window.G && G.DEX ? G.DEX.slice() : [];
    for (const [k, v] of custom.entries()) {
      if (typeof k === 'number' && !list.some(p => p.dex === v.dex)) list.push(v);
    }
    return list;
  }

  return {
    register,
    get,
    has,
    getAll,
    validate,
    FALLBACK_DEFAULT_DEX
  };
})();

// ============================================================================
// 2. REGISTRO DE MOVIMIENTOS
// ============================================================================
G.MoveRegistry = (() => {
  const customMoves = new Map();
  const familyExecutors = new Map();

  const VALID_FAMILIES = [
    'projectile', 'melee', 'beam', 'orbit', 'nova', 'aura', 'buff',
    'boomerang', 'chain', 'mine', 'meteor', 'turret', 'dash', 'trail', 'cone'
  ];

  function validate(def) {
    const errs = [];
    if (!def) return { ok: false, errors: ['Definición nula'] };
    if (!def.id || typeof def.id !== 'string') errs.push('Requiere id de texto único');
    if (!def.name || typeof def.name !== 'string') errs.push('Requiere nombre visible');
    if (!def.type || typeof def.type !== 'string') errs.push('Requiere tipo elemental');
    if (!def.kind || !VALID_FAMILIES.includes(def.kind)) {
      errs.push(`Familia (kind) inválida. Opciones: ${VALID_FAMILIES.join(', ')}`);
    }
    if (def.cd != null && (typeof def.cd !== 'number' || def.cd <= 0)) errs.push('Recarga (cd) debe ser número positivo');
    if (def.dmg != null && typeof def.dmg !== 'number') errs.push('Daño (dmg) debe ser número');
    return { ok: errs.length === 0, errors: errs };
  }

  function register(def) {
    const v = validate(def);
    if (!v.ok) {
      console.warn('[MoveRegistry] Error al registrar movimiento:', v.errors.join('; '));
      return false;
    }
    const move = Object.assign({
      cd: 1.0,
      dmg: 1.0,
      speed: 200,
      size: 10,
      radius: 60,
      life: 1.0,
      count: 1,
      spread: 0,
      desc: ''
    }, def);

    customMoves.set(move.id, move);

    // Integrar con G.Moves
    if (window.G && G.Moves) {
      if (G.Moves.BY_ID) G.Moves.BY_ID[move.id] = move;
      if (G.Moves.ALL && !G.Moves.ALL.some(m => m.id === move.id)) G.Moves.ALL.push(move);
    }
    return true;
  }

  function get(id) {
    if (customMoves.has(id)) return customMoves.get(id);
    if (window.G && G.Moves && G.Moves.BY_ID) return G.Moves.BY_ID[id] || null;
    return null;
  }

  function has(id) {
    return get(id) !== null;
  }

  function getAll() {
    if (window.G && G.Moves && G.Moves.ALL) return G.Moves.ALL.slice();
    return [...customMoves.values()];
  }

  /** Permite registrar un comportamiento personalizado para una familia de ataque */
  function registerFamily(kind, executor) {
    if (!kind || typeof executor !== 'function') return false;
    familyExecutors.set(kind, executor);
    return true;
  }

  function getFamily(kind) {
    return familyExecutors.get(kind) || null;
  }

  return {
    register,
    get,
    has,
    getAll,
    validate,
    registerFamily,
    getFamily,
    VALID_FAMILIES
  };
})();

// ============================================================================
// 3. REGISTRO DE ESCENARIOS
// ============================================================================
G.StageRegistry = (() => {
  const stages = new Map();

  function validate(def) {
    const errs = [];
    if (!def) return { ok: false, errors: ['Definición nula'] };
    if (!def.id) errs.push('Requiere identificador único');
    if (!def.name) errs.push('Requiere nombre visible');
    return { ok: errs.length === 0, errors: errs };
  }

  function register(def) {
    const v = validate(def);
    if (!v.ok) {
      console.warn('[StageRegistry] Error al registrar escenario:', v.errors.join('; '));
      return false;
    }
    const stage = Object.assign({
      type: 'procedural', // 'procedural' | 'arena' | 'fixed'
      music: 'village',
      weather: null,
      liquid: 'water',
      props: {},
      enemies: null,
      bossConfig: null
    }, def);

    stages.set(stage.id, stage);
    return true;
  }

  function get(id) {
    return stages.get(id) || null;
  }

  function getAll() {
    return [...stages.values()];
  }

  // Pre-registrar biomas existentes como escenarios estándar
  register({ id: 'forest', name: 'Bosque Umbrío', type: 'procedural', biomeIndex: 0, liquid: 'water', music: 'forest' });
  register({ id: 'crystal', name: 'Cueva Cristal', type: 'procedural', biomeIndex: 1, liquid: 'water', music: 'crystal' });
  register({ id: 'volcano', name: 'Volcán Ceniza', type: 'procedural', biomeIndex: 2, liquid: 'lava', music: 'volcano' });

  return {
    register,
    get,
    getAll,
    validate
  };
})();

// ============================================================================
// 4. REGISTRO DE MODOS DE JUEGO
// ============================================================================
G.ModeRegistry = (() => {
  const modes = new Map();
  let currentModeId = 'classic';

  function register(def) {
    if (!def || !def.id || !def.name) {
      console.warn('[ModeRegistry] Modo inválido:', def);
      return false;
    }
    const mode = Object.assign({
      desc: '',
      onInit() {},
      onStart(cfg) {},
      onUpdate(dt, pl, time) {},
      checkVictory(game) { return null; },
      checkDefeat(game) { return game.player && game.player.dead; },
      onEnd(summary) {}
    }, def);

    modes.set(mode.id, mode);
    return true;
  }

  function get(id) {
    return modes.get(id) || null;
  }

  function getAll() {
    return [...modes.values()];
  }

  function setActive(id) {
    if (modes.has(id)) {
      currentModeId = id;
      return true;
    }
    return false;
  }

  function active() {
    return modes.get(currentModeId) || modes.get('classic');
  }

  // Modo predeterminado: Supervivencia Clásica
  register({
    id: 'classic',
    name: 'Supervivencia Clásica',
    desc: 'Sobrevive a las hordas en la mazmorra infinita con jefes cada 3 minutos.',
    onInit() {},
    onStart(cfg) {},
    onUpdate(dt, pl, time) {},
    checkVictory(game) { return false; }, // Es infinito/sobrevivir lo máximo
    checkDefeat(game) { return game.player && game.player.dead; },
    onEnd(summary) {}
  });

  return {
    register,
    get,
    getAll,
    setActive,
    active
  };
})();

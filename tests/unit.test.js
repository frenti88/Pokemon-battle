/* ============ unit.test.js — suite de pruebas unitarias automatizadas ============ */
const assert = require('assert');
const { createEnvironment, loadScripts } = require('./test-env');

console.log('--- INICIANDO PRUEBAS UNITARIAS DE POKÉSURVIVOR ---');

createEnvironment();

// Carga ordenada de scripts requeridos
loadScripts([
  'js/core/util.js',
  'js/core/i18n.js',
  'js/core/settings.js',
  'js/data/music.js',
  'js/data/pokedex.js',
  'js/data/sprites-meta.js',
  'js/data/balance.js',
  'js/core/registry.js',
  'js/core/firebase-config.js',
  'js/core/db.js',
  'js/core/audio.js',
  'js/core/input.js',
  'js/core/touch.js',
  'js/core/pwa.js',
  'js/core/sprites.js',
  'js/core/camera.js',
  'js/core/guard.js',
  'js/data/moves.js',
  'js/data/types.js',
  'js/data/starters.js',
  'js/data/enemies.js',
  'js/data/upgrades.js',
  'js/data/items.js',
  'js/data/missions.js',
  'js/data/achievements.js',
  'js/world/tiles.js',
  'js/world/world.js',
  'js/entities/vfx.js',
  'js/entities/fx.js',
  'js/entities/projectile.js',
  'js/entities/enemy.js',
  'js/entities/pickup.js',
  'js/entities/player.js',
  'js/systems/combat.js',
  'js/systems/spawner.js',
  'js/systems/levelup.js',
  'js/systems/weather.js'
]);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// 1. Aislamiento de Firebase
test('Firebase está aislado en entorno local (G.FIREBASE_CONFIG es null)', () => {
  assert.strictEqual(G.FIREBASE_CONFIG, null, 'G.FIREBASE_CONFIG debe ser null en modo local');
  assert.strictEqual(G.DB.mode, 'local', 'G.DB.mode debe inicializarse en local');
});

// 2. Catálogo de Pokémon e Integridad (Restricción de 150 originales habilitados)
test('Catálogo de Pokédex contiene 966+ entradas y exactamente 150 originales habilitados', () => {
  assert.ok(Array.isArray(G.DEX), 'G.DEX debe ser un array');
  assert.ok(G.DEX.length >= 966, `G.DEX tiene ${G.DEX.length} entradas, se esperaban >= 966`);

  const enabled = G.DEX.filter(p => p.enabled && !p.disabled);
  const disabled = G.DEX.filter(p => p.disabled);

  assert.strictEqual(enabled.length, 150, `Se esperaban exactamente 150 Pokémon habilitados, encontrados: ${enabled.length}`);
  assert.strictEqual(disabled.length, G.DEX.length - 150, `El resto debe estar deshabilitado`);

  for (const mon of enabled) {
    assert.ok(mon.dex >= 1 && mon.dex <= 150, `Pokémon habilitado #${mon.dex} está fuera del rango 1..150`);
    assert.strictEqual(G.isPokemonEnabled(mon.dex), true);
  }

  for (const mon of G.DEX) {
    assert.ok(mon.dex > 0, `dex inválido: ${mon.dex}`);
    assert.ok(typeof mon.name === 'string' && mon.name.length > 0, `Nombre inválido en #${mon.dex}`);
    assert.ok(Array.isArray(mon.types) && mon.types.length >= 1, `Tipos inválidos en #${mon.dex}`);
    assert.ok(mon.hp > 0, `HP inválido en #${mon.dex}`);
    assert.ok(mon.spd > 0, `Velocidad inválida en #${mon.dex}`);
    assert.ok(mon.atk > 0, `Ataque inválido en #${mon.dex}`);
    assert.ok(mon.rarity >= 1 && mon.rarity <= 5, `Rareza inválida en #${mon.dex}`);
  }
});

// 3. Starters y Referencias
test('Starters válidos y referenciados en Pokédex (activos de 1ª temporada)', () => {
  assert.ok(Array.isArray(G.STARTERS), 'G.STARTERS debe ser un array');
  assert.ok(Array.isArray(G.STARTERS_ALL), 'G.STARTERS_ALL debe ser un array');
  assert.ok(G.STARTERS_ALL.length >= 29, `Esperados >= 29 starters totales, encontrados: ${G.STARTERS_ALL.length}`);
  assert.ok(G.STARTERS.length >= 7, `Esperados >= 7 starters activos, encontrados: ${G.STARTERS.length}`);

  for (const s of G.STARTERS) {
    assert.ok(s.dex <= 150, `Starter activo #${s.dex} debe ser <= 150 (1ª temporada)`);
    assert.strictEqual(G.isPokemonEnabled(s.dex), true, `Starter #${s.dex} debe estar habilitado`);
    const mon = G.DEX_BY[s.dex];
    assert.ok(mon, `Starter #${s.dex} no existe en DEX_BY`);
    assert.ok(s.start, `Starter #${s.dex} no tiene startMove`);
    assert.ok(G.Moves.BY_ID[s.start], `startMove ${s.start} de #${s.dex} no existe en Moves.BY_ID`);
  }
});

// 4. Efectividad de Tipos (Suavizada para formato Survivor)
test('Cálculo de efectividad de tipos elemental suavizada', () => {
  assert.ok(G.Types, 'G.Types debe existir');
  // Agua vs Fuego = 1.6 (super efectivo suavizado)
  assert.strictEqual(G.Types.mult('water', ['fire']), 1.6);
  assert.strictEqual(G.Types.label(1.6), 'super');
  // Fuego vs Agua = 0.6 (poco efectivo suavizado)
  assert.strictEqual(G.Types.mult('fire', ['water']), 0.6);
  assert.strictEqual(G.Types.label(0.6), 'weak');
  // Eléctrico vs Tierra = 0.3 (inmunidad convertida a resistencia fuerte)
  assert.strictEqual(G.Types.mult('electric', ['ground']), 0.3);
  // Planta vs Agua/Tierra = clamp 2.4 (doble debilidad)
  assert.strictEqual(G.Types.mult('grass', ['water', 'ground']), 2.4);
  // Normal vs Normal = 1.0 (neutro)
  assert.strictEqual(G.Types.mult('normal', ['normal']), 1.0);
  assert.strictEqual(G.Types.label(1.0), null);
});

// 5. Matemáticas, Distancias y Colisiones
test('Operaciones vectoriales y distancias en G.U', () => {
  assert.strictEqual(G.U.dist(0, 0, 3, 4), 5);
  assert.strictEqual(G.U.dist2(0, 0, 3, 4), 25);

  const [nx, ny] = G.U.norm(10, 0);
  assert.strictEqual(nx, 1);
  assert.strictEqual(ny, 0);

  const [dx, dy] = G.U.norm(3, 3);
  assert.ok(Math.abs(Math.hypot(dx, dy) - 1.0) < 1e-5, 'El vector normalizado diagonal debe tener longitud 1');

  const [zx, zy] = G.U.norm(0, 0);
  assert.strictEqual(zx, 0);
  assert.strictEqual(zy, 0);

  assert.strictEqual(G.U.clamp(15, 0, 10), 10);
  assert.strictEqual(G.U.clamp(-5, 0, 10), 0);
  assert.strictEqual(G.U.clamp(5, 0, 10), 5);
});

// 6. Configuración de Movimientos y Familias
test('Catálogo de movimientos contiene las 15 familias requeridas', () => {
  const families = new Set(G.Moves.ALL.map(m => m.kind));
  const expected = [
    'projectile', 'melee', 'beam', 'orbit', 'nova', 'aura', 'buff',
    'boomerang', 'chain', 'mine', 'meteor', 'turret', 'dash', 'trail', 'cone'
  ];
  for (const fam of expected) {
    assert.ok(families.has(fam), `Falta la familia de movimiento: ${fam}`);
  }
});

// 7. Instanciación y Escalado de Movimientos
test('Instanciación de movimientos y mejora de niveles', () => {
  const m = G.Moves.instance('vine-whip', 1);
  assert.strictEqual(m.id, 'vine-whip');
  assert.strictEqual(m.lvl, 1);
  const dmg1 = m.dmg;

  G.Moves.levelUp(m);
  assert.strictEqual(m.lvl, 2);
  assert.ok(m.dmg >= dmg1, 'El daño debe aumentar o mantenerse al subir de nivel');
});

// 8. Fórmulas de Experiencia y Progresión
test('Curva de experiencia del jugador e incremento monótono', () => {
  let prevXp = 0;
  for (let lvl = 1; lvl <= 50; lvl++) {
    const xp = G.Player.xpFor(lvl);
    assert.ok(typeof xp === 'number' && !isNaN(xp) && isFinite(xp), `xp inválido en nivel ${lvl}`);
    assert.ok(xp > prevXp, `La experiencia requerida en nivel ${lvl} (${xp}) debe ser mayor que en ${lvl-1} (${prevXp})`);
    prevXp = xp;
  }
});

// 9. Persistencia Local (LocalStorage y Serialización)
test('Serialización y migración de partidas en DB', () => {
  G.DB.playAsGuest();
  assert.ok(G.DB.save, 'G.DB.save debe existir');
  assert.strictEqual(G.DB.save.name, 'Invitado');
  assert.strictEqual(G.DB.save.coins, 500);

  const save = G.DB.save;
  save.partner = 25;
  save.owned[25] = { at: Date.now(), from: 'starter' };

  assert.ok(G.DB.owns(25), 'Debe poseer a Pikachu (25)');
  assert.ok(!G.DB.owns(9999), 'No debe poseer id inexistente');
});

// 10. Desacoplamiento de Dificultad (G.Balance)
test('G.Balance contiene parámetros configurables y métodos de exportación', () => {
  assert.ok(G.Balance, 'G.Balance debe estar definido');
  assert.strictEqual(G.Balance.get('maxEnemies'), 64);
  assert.strictEqual(G.Balance.get('spawnDensity'), 0.24);

  // Modificación y lectura
  G.Balance.set('maxEnemies', 80);
  assert.strictEqual(G.Balance.get('maxEnemies'), 80);
  assert.strictEqual(G.Spawner.CAP, 80, 'G.Spawner.CAP debe reflejar el valor dinámico de G.Balance');

  // Restaurar
  G.Balance.reset();
  assert.strictEqual(G.Balance.get('maxEnemies'), 64);
  assert.strictEqual(G.Spawner.CAP, 64);
});

// 11. Extensibilidad: Registro de nuevo Pokémon con política de Fallback
test('PokemonRegistry: registrar personaje custom y aplicar fallback si carece de sprites propios', () => {
  assert.ok(G.PokemonRegistry, 'PokemonRegistry debe estar definido');
  const customId = 9999;

  const res = G.PokemonRegistry.register({
    id: customId,
    name: 'Glitchmon',
    types: ['electric', 'psychic'],
    hp: 120,
    spd: 110,
    atk: 1.25,
    fallbackDex: 25 // Usa a Pikachu como fallback gráfico
  });

  assert.strictEqual(res, true, 'El registro de Pokémon debe ser exitoso');
  assert.ok(G.PokemonRegistry.has(customId), 'PokemonRegistry debe contener al Pokémon registrado');

  const mon = G.PokemonRegistry.get(customId);
  assert.strictEqual(mon.name, 'Glitchmon');
  assert.strictEqual(mon.fallbackDex, 25);

  // Verificación de fallback de sprite sin lanzar excepciones
  const m = G.Sprites.animMeta(customId, 'Idle');
  assert.ok(m, 'animMeta debe devolver la geometría del fallback');
  const sheet = G.Sprites.sheet(customId, 'Idle');
  assert.ok(sheet, 'sheet debe devolver la instancia del fallback');
});

// 12. Extensibilidad: Registro de nuevo Movimiento y Familia de Ataque
test('MoveRegistry: registrar movimiento custom y verificar integración', () => {
  assert.ok(G.MoveRegistry, 'MoveRegistry debe estar definido');

  const res = G.MoveRegistry.register({
    id: 'cyber-beam',
    name: 'Rayo Cibernético',
    type: 'electric',
    kind: 'beam',
    cd: 1.2,
    dmg: 2.5,
    desc: 'Dispara un potente haz de energía binaria.'
  });

  assert.strictEqual(res, true, 'El registro de movimiento debe ser exitoso');
  assert.ok(G.MoveRegistry.has('cyber-beam'));
  assert.ok(G.Moves.BY_ID['cyber-beam'], 'Debe integrarse en G.Moves.BY_ID');

  const inst = G.Moves.instance('cyber-beam', 1);
  assert.strictEqual(inst.id, 'cyber-beam');
  assert.strictEqual(inst.dmg, 2.5);
});

// 13. Extensibilidad: Registro de Escenario
test('StageRegistry: registrar escenario y bioma custom', () => {
  assert.ok(G.StageRegistry, 'StageRegistry debe estar definido');

  const res = G.StageRegistry.register({
    id: 'space-rift',
    name: 'Grieta Estelar',
    type: 'arena',
    liquid: 'spark',
    music: 'rift'
  });

  assert.strictEqual(res, true);
  assert.ok(G.StageRegistry.get('space-rift'));
  assert.strictEqual(G.StageRegistry.get('space-rift').name, 'Grieta Estelar');
});

// 13b. 5 Escenarios Elementales (Fuego, Agua, Tierra, Insecto, Aire) y biomas
test('Escenarios Elementales: 5 biomas únicos con tipos Fuego, Agua, Tierra, Insecto y Aire', () => {
  const fs = require('fs');
  const path = require('path');

  // 1. Validar G.Tiles.NORMAL y G.Tiles.ARENA
  assert.strictEqual(G.Tiles.NORMAL, 5, 'Deben existir al menos 5 biomas normales');
  assert.strictEqual(G.Tiles.ARENA, 5, 'Las arenas de grieta deben comenzar en el índice 5');

  // 2. Validar cada uno de los 5 biomas en G.Tiles.BIOMES
  const expectedTypes = ['fire', 'water', 'ground', 'bug', 'flying'];
  const expectedNames = ['Volcán Ígneo', 'Gruta Marina', 'Cañón Árido', 'Bosque Colmena', 'Pico Celeste'];

  for (let i = 0; i < 5; i++) {
    const b = G.Tiles.BIOMES[i];
    assert.ok(b, `Bioma #${i} debe existir`);
    assert.strictEqual(b.type, expectedTypes[i], `Tipo de bioma #${i} debe ser ${expectedTypes[i]}`);
    assert.strictEqual(b.name, expectedNames[i], `Nombre de bioma #${i} debe ser ${expectedNames[i]}`);
    assert.ok(Array.isArray(b.floor) && b.floor.length >= 3, `Paleta floor en bioma #${i}`);
    assert.ok(Array.isArray(b.dirt) && b.dirt.length >= 3, `Paleta dirt en bioma #${i}`);
    assert.ok(b.liquid, `Líquido definido en bioma #${i}`);
    assert.ok(['tree', 'crystal', 'dead'].includes(b.prop), `Prop válido en bioma #${i}`);
  }

  // 3. Validar StageRegistry con los 5 escenarios elementales
  for (const type of expectedTypes) {
    const stage = G.StageRegistry.get(type);
    assert.ok(stage, `Escenario para tipo ${type} debe estar registrado`);
    assert.strictEqual(stage.pokemonType, type);
    assert.ok(stage.name.length > 0);
  }

  // Validar getByType
  assert.strictEqual(G.StageRegistry.getByType('fire').id, 'fire');
  assert.strictEqual(G.StageRegistry.getByType('water').id, 'water');
  assert.strictEqual(G.StageRegistry.getByType('ground').id, 'ground');
  assert.strictEqual(G.StageRegistry.getByType('bug').id, 'bug');
  assert.strictEqual(G.StageRegistry.getByType('flying').id, 'flying');

  // Aliases de compatibilidad hacia atrás
  assert.ok(G.StageRegistry.get('volcano'), 'Alias volcano debe existir');
  assert.ok(G.StageRegistry.get('crystal'), 'Alias crystal debe existir');
  assert.ok(G.StageRegistry.get('forest'), 'Alias forest debe existir');

  // 4. Validar disponibilidad y desbloqueo de mundos
  assert.strictEqual(G.StageRegistry.isUnlocked('fire'), true, 'Volcán Ígneo debe estar disponible por defecto');
  assert.strictEqual(G.StageRegistry.isUnlocked('water'), true, 'Gruta Marina debe estar disponible por defecto');
  assert.strictEqual(G.StageRegistry.isUnlocked('flying'), false, 'Pico Celeste debe estar bloqueado inicialmente');

  const unlBefore = G.StageRegistry.getUnlocked();
  assert.ok(unlBefore.some(s => s.id === 'fire'), 'Volcán Ígneo en lista de disponibles');
  assert.ok(unlBefore.some(s => s.id === 'water'), 'Gruta Marina en lista de disponibles');

  const lckBefore = G.StageRegistry.getLocked();
  assert.ok(lckBefore.some(s => s.id === 'flying'), 'Pico Celeste en lista de bloqueados');
  assert.ok(lckBefore.some(s => s.id === 'ground'), 'Cañón Árido en lista de bloqueados');

  const progGround = G.StageRegistry.getUnlockProgress('ground');
  assert.ok(progGround && typeof progGround.desc === 'string' && progGround.desc.length > 0, 'Requisito de Cañón Árido');

  // Desbloquear manualmente y comprobar
  G.StageRegistry.unlock('flying');
  assert.strictEqual(G.StageRegistry.isUnlocked('flying'), true, 'Pico Celeste debe estar desbloqueado tras llamar unlock()');

  // 5. Validar assets de referencia descargados en disco
  const tilesetDir = path.join(__dirname, '..', 'assets', 'tilesets');
  assert.ok(fs.existsSync(tilesetDir), 'Carpeta assets/tilesets debe existir');
  assert.ok(fs.existsSync(path.join(tilesetDir, 'forest_plains.png')), 'forest_plains.png debe existir');
  for (let r = 1; r <= 5; r++) {
    assert.ok(fs.existsSync(path.join(tilesetDir, `biome_reference_${r}.png`)), `biome_reference_${r}.png debe existir`);
  }
});

// 14. Extensibilidad: Registro de Modo de Juego
test('ModeRegistry: registrar modo custom y ciclo de vida', () => {
  assert.ok(G.ModeRegistry, 'ModeRegistry debe estar definido');
  assert.strictEqual(G.ModeRegistry.active().id, 'classic');

  let started = false;
  G.ModeRegistry.register({
    id: 'boss-rush',
    name: 'Boss Rush Mode',
    desc: 'Combates consecutivos contra todos los jefes.',
    onStart() { started = true; }
  });

  assert.ok(G.ModeRegistry.get('boss-rush'));
  G.ModeRegistry.setActive('boss-rush');
  assert.strictEqual(G.ModeRegistry.active().id, 'boss-rush');
  G.ModeRegistry.active().onStart();
  assert.strictEqual(started, true);

  // Volver al modo classic
  G.ModeRegistry.setActive('classic');
  assert.strictEqual(G.ModeRegistry.active().id, 'classic');
});

// 15. Sistema de Selección Inicial del Profesor Oak (G.OakFlow)
test('G.OakFlow: configuración de preguntas, caminos y afinidades', () => {
  assert.ok(G.OakFlow, 'G.OakFlow debe estar definido');
  assert.ok(typeof G.OakFlow.introText === 'string' && G.OakFlow.introText.length > 0);
  assert.ok(typeof G.OakFlow.pathIntro === 'string' && G.OakFlow.pathIntro.length > 0);
  assert.ok(typeof G.OakFlow.pokeballsIntro === 'string' && G.OakFlow.pokeballsIntro.length > 0);

  // Verificación de preguntas
  assert.strictEqual(G.OakFlow.questions.length, 3, 'Debe haber exactamente 3 preguntas');
  const validTraits = new Set(['audaz', 'protector', 'curioso']);
  for (const q of G.OakFlow.questions) {
    assert.ok(q.id && q.text, 'Pregunta debe tener id y text');
    assert.strictEqual(q.options.length, 3, 'Cada pregunta debe tener 3 opciones');
    for (const opt of q.options) {
      assert.ok(validTraits.has(opt.trait), `Rasgo desconocido: ${opt.trait}`);
    }
  }

  // Verificación de caminos
  assert.strictEqual(G.OakFlow.paths.length, 4, 'Debe haber 4 caminos (bosque, montaña, lago, caverna)');
  const pathIds = G.OakFlow.paths.map(p => p.id);
  assert.deepStrictEqual(pathIds.sort(), ['cave', 'forest', 'lake', 'mountain'].sort());

  for (const p of G.OakFlow.paths) {
    assert.ok(p.candidates.length >= 3, `Camino ${p.id} debe tener al menos 3 candidatos`);
    for (const c of p.candidates) {
      assert.ok(c.dex >= 1 && c.dex <= 150, `Candidato #${c.dex} en ${p.id} debe pertenecer a temporada 1`);
      assert.ok(validTraits.has(c.affinity), `Afinidad inválida en #${c.dex}: ${c.affinity}`);
      assert.strictEqual(G.isPokemonEnabled(c.dex), true, `Candidato #${c.dex} debe estar habilitado`);
    }
  }
});

test('G.OakFlow: generación de 3 Pokébolas ponderadas (70% afinidad, 30% sorpresa) sin duplicados', () => {
  const paths = ['forest', 'mountain', 'lake', 'cave'];
  const testAffinities = [
    ['audaz', 'audaz', 'audaz'],
    ['protector', 'curioso', 'audaz'],
    ['curioso', 'curioso', 'protector'],
    ['audaz', 'protector', 'curioso']
  ];

  for (const pathId of paths) {
    for (const aff of testAffinities) {
      for (let run = 0; run < 100; run++) {
        const balls = G.OakFlow.generatePokeballs(pathId, aff);
        assert.strictEqual(balls.length, 3, 'Debe generar exactamente 3 Pokébolas');

        const dexes = balls.map(b => b.dex);
        const uniqueDexes = new Set(dexes);
        assert.strictEqual(uniqueDexes.size, 3, `Pokébolas contienen duplicados en camino ${pathId}: ${dexes.join(',')}`);

        for (const mon of balls) {
          assert.ok(mon.dex >= 1 && mon.dex <= 150, `Pokémon #${mon.dex} está fuera del rango 1..150`);
          assert.strictEqual(G.isPokemonEnabled(mon.dex), true, `Pokémon #${mon.dex} debe estar habilitado`);
        }
      }
    }
  }

  // Explicación narrativa
  const bulba = G.DEX_BY[1];
  const expAudaz = G.OakFlow.getExplanation(bulba, 'audaz', 'forest');
  const expProt = G.OakFlow.getExplanation(bulba, 'protector', 'forest');
  assert.ok(expAudaz.includes('Bulbasaur'), 'Explicación debe incluir el nombre del Pokémon');
  assert.ok(expProt.includes('Bulbasaur'), 'Explicación debe incluir el nombre del Pokémon');
});

// 16. Configuración PWA (Manifest, Service Worker e Instalación)
test('PWA: validación de Manifest, Service Worker y módulo G.PWA', () => {
  const fs = require('fs');
  const path = require('path');

  // 1. Validar manifest.webmanifest
  const manifestPath = path.join(__dirname, '..', 'manifest.webmanifest');
  assert.ok(fs.existsSync(manifestPath), 'manifest.webmanifest debe existir');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.strictEqual(manifest.name, 'Super Batalla Pokémon', 'Nombre debe ser "Super Batalla Pokémon"');
  assert.strictEqual(manifest.short_name, 'Batalla Pokémon', 'Nombre corto debe ser "Batalla Pokémon"');
  assert.strictEqual(manifest.display, 'standalone', 'display debe ser "standalone"');
  assert.strictEqual(manifest.id, 'super-batalla-pokemon', 'id debe ser "super-batalla-pokemon"');
  assert.ok(manifest.start_url, 'start_url debe estar definida');
  assert.ok(manifest.scope, 'scope debe estar definido');

  // Validar iconos
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3, 'Debe haber al menos 3 iconos');
  for (const ic of manifest.icons) {
    const iconFile = path.join(__dirname, '..', ic.src);
    assert.ok(fs.existsSync(iconFile), `Icono no encontrado en disco: ${ic.src}`);
    const stat = fs.statSync(iconFile);
    assert.ok(stat.size > 0, `Icono vacío: ${ic.src}`);
  }

  // 2. Validar sw.js
  const swPath = path.join(__dirname, '..', 'sw.js');
  assert.ok(fs.existsSync(swPath), 'sw.js debe existir');
  const swContent = fs.readFileSync(swPath, 'utf8');
  assert.ok(swContent.includes('CODE_CACHE') && swContent.includes('ART_CACHE'), 'sw.js debe tener cachés separadas');
  assert.ok(swContent.includes('skipWaiting'), 'sw.js debe llamar a skipWaiting');

  // 3. Validar módulo G.PWA
  assert.ok(G.PWA, 'G.PWA debe estar definido');
  assert.strictEqual(typeof G.PWA.init, 'function', 'G.PWA.init debe ser función');
  assert.strictEqual(typeof G.PWA.isStandalone, 'function', 'G.PWA.isStandalone debe ser función');
  assert.strictEqual(typeof G.PWA.isIos, 'function', 'G.PWA.isIos debe ser función');
});

// 19. Primeras evoluciones de Kanto habilitadas por defecto
test('Colección Pokédex: Las 74 primeras evoluciones de Kanto están habilitadas en DB y Pokédex', () => {
  assert.ok(Array.isArray(G.BASE_STAGE_DEX_KANTO), 'G.BASE_STAGE_DEX_KANTO debe ser un array');
  assert.strictEqual(G.BASE_STAGE_DEX_KANTO.length, 74, `Se esperaban exactamente 74 primeras evoluciones, encontradas: ${G.BASE_STAGE_DEX_KANTO.length}`);

  for (const dex of G.BASE_STAGE_DEX_KANTO) {
    assert.ok(dex >= 1 && dex <= 150, `Dex ${dex} fuera del rango de Kanto`);
    const mon = G.DEX_BY[dex];
    assert.ok(mon, `Mon ${dex} no encontrado en G.DEX_BY`);
    assert.strictEqual(mon.enabled, true, `Mon ${mon.name} (#${dex}) debe estar habilitado`);
    assert.strictEqual(G.isBaseEvolution(dex), true, `Mon ${mon.name} (#${dex}) debe ser identificado como primera evolución`);
  }

  // Evoluciones y legendarios no deben estar en el array de primeras evoluciones
  const evolvedAndLegendaries = [2, 3, 5, 6, 8, 9, 26, 94, 130, 144, 145, 146, 149, 150];
  for (const dex of evolvedAndLegendaries) {
    assert.strictEqual(G.isBaseEvolution(dex), false, `Dex ${dex} no debe ser primera evolución`);
  }

  // Comprobar que en partida de invitado / nueva partida están en save.owned
  G.DB.playAsGuest();
  assert.ok(G.DB.save, 'G.DB.save debe existir');
  for (const dex of G.BASE_STAGE_DEX_KANTO) {
    assert.strictEqual(G.DB.owns(dex), true, `El jugador debe poseer al Pokémon #${dex} (${G.DEX_BY[dex].name})`);
  }

  // Los evolucionados y legendarios deben permanecer bloqueados hasta obtenerse
  for (const dex of evolvedAndLegendaries) {
    assert.strictEqual(G.DB.owns(dex), false, `El Pokémon evolucionado #${dex} debe estar bloqueado inicialmente`);
  }
});

console.log('\n===========================================');
console.log(`RESULTADOS: ${passed} pasadas, ${failed} falladas.`);
console.log('===========================================\n');

process.exit(failed > 0 ? 1 : 0);



/* ============ balance.js — configuración desacoplada de dificultad y balance ============
 * Centraliza los parámetros de dificultad, ritmo de oleadas y progresión para
 * permitir equilibrar y extender el juego sin alterar el código de los sistemas.
 *
 * Mantiene intactos los valores predeterminados originales del juego.
 */
window.G = window.G || {};

G.Balance = (() => {
  const DEFAULTS = {
    // Límites de horda
    maxEnemies: 64,
    eliteThreshold: 0.85,
    spawnDensity: 0.24,

    // Multiplicadores base
    enemyDmgMultiplier: 2.4,
    enemyXpMultiplier: 5.6,

    // Escala de vida según el tiempo transcurrido (t en segundos)
    hpScaleFormula(t) {
      return 3.3 + Math.min(1.7, t / 210);
    },

    // Ritmo de aparición base (enemigos por segundo)
    spawnRateFormula(t) {
      return (1.6 + t * 0.028 + Math.pow(t / 60, 1.6) * 0.5) * this.spawnDensity;
    },

    // Probabilidades y eventos
    shinyRate: 1 / 4096,
    surgeMinInterval: 38,
    surgeMaxInterval: 56,

    // Jefes (segundo de aparición, vida base, daño, xp, rango BST)
    bossSlots: [
      { at: 180, hp: 1400,  dmg: 34, xp: 220,  bst: [490, 545] },
      { at: 360, hp: 3200,  dmg: 42, xp: 420,  bst: [520, 580] },
      { at: 540, hp: 5600,  dmg: 48, xp: 680,  bst: [540, 600] },
      { at: 720, hp: 9000,  dmg: 56, xp: 1000, bst: [580, 700] },
      { at: 900, hp: 16000, dmg: 68, xp: 1800, bst: [600, 700] }
    ],

    // Grietas distorsión (legendarios)
    rift: {
      checkInterval: 30,
      chance: 0.14,
      ttl: 45,
      arenaDuration: 120,
      fromTime: 75
    },

    // Climas aleatorios
    weather: {
      checkInterval: 60,
      chance: 0.18,
      duration: 60,
      fromTime: 120
    },

    // Curva de experiencia del jugador por nivel
    playerXpFormula(level) {
      return Math.floor((8 + level * 6 + Math.pow(level, 1.75) * 1.6) * 2);
    }
  };

  // Estado mutable en tiempo de ejecución (permite presets / mods)
  let current = JSON.parse(JSON.stringify(DEFAULTS));
  // Restaurar funciones
  current.hpScaleFormula = DEFAULTS.hpScaleFormula;
  current.spawnRateFormula = DEFAULTS.spawnRateFormula;
  current.playerXpFormula = DEFAULTS.playerXpFormula;

  return {
    get(key) {
      return current[key] !== undefined ? current[key] : DEFAULTS[key];
    },

    set(key, val) {
      current[key] = val;
    },

    hpScale(t) {
      return typeof current.hpScaleFormula === 'function'
        ? current.hpScaleFormula(t)
        : DEFAULTS.hpScaleFormula(t);
    },

    spawnRate(t) {
      return typeof current.spawnRateFormula === 'function'
        ? current.spawnRateFormula(t)
        : DEFAULTS.spawnRateFormula(t);
    },

    playerXp(level) {
      return typeof current.playerXpFormula === 'function'
        ? current.playerXpFormula(level)
        : DEFAULTS.playerXpFormula(level);
    },

    reset() {
      current = JSON.parse(JSON.stringify(DEFAULTS));
      current.hpScaleFormula = DEFAULTS.hpScaleFormula;
      current.spawnRateFormula = DEFAULTS.spawnRateFormula;
      current.playerXpFormula = DEFAULTS.playerXpFormula;
    },

    exportConfig() {
      return JSON.parse(JSON.stringify(current));
    },

    importConfig(cfg) {
      if (!cfg || typeof cfg !== 'object') return;
      Object.assign(current, cfg);
    },

    DEFAULTS
  };
})();

/* ============ test-env.js — entorno virtual para tests en Node.js ============ */
const fs = require('fs');
const path = require('path');

function createEnvironment() {
  const storage = new Map();

  global.window = global;
  global.addEventListener = () => {};
  global.removeEventListener = () => {};
  global.dispatchEvent = () => true;

  global.location = {
    protocol: 'http:',
    hostname: 'localhost',
    pathname: '/dev.html',
    origin: 'http://localhost:8000'
  };

  global.navigator = {
    language: 'es-ES',
    languages: ['es-ES', 'es', 'en'],
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  };

  global.localStorage = {
    getItem(k) { return storage.has(k) ? storage.get(k) : null; },
    setItem(k, v) { storage.set(k, String(v)); },
    removeItem(k) { storage.delete(k); },
    clear() { storage.clear(); }
  };

  global.document = {
    readyState: 'complete',
    documentElement: { lang: 'es' },
    createElement(tag) {
      return {
        tag,
        width: 100,
        height: 100,
        style: { setProperty() {} },
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        getContext() {
          return {
            drawImage() {},
            fillRect() {},
            clearRect() {},
            beginPath() {},
            arc() {},
            fill() {},
            stroke() {},
            save() {},
            restore() {},
            setTransform() {},
            scale() {},
            createRadialGradient() { return { addColorStop() {} }; }
          };
        },
        addEventListener() {},
        removeEventListener() {}
      };
    },
    getElementById(id) {
      return this.createElement('div');
    },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {}
  };

  global.Image = class {
    constructor() {
      this.src = '';
      this.width = 32;
      this.height = 32;
      setTimeout(() => { if (this.onload) this.onload(); }, 0);
    }
  };

  global.performance = {
    now() { return Date.now(); }
  };

  global.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  global.AudioContext = class {
    constructor() { this.destination = {}; this.currentTime = 0; }
    createGain() { return { connect() {}, gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} } }; }
    createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {} } }; }
    createBufferSource() { return { connect() {}, start() {}, stop() {} }; }
    createConvolver() { return { connect() {} }; }
    createBuffer() { return {}; }
    decodeAudioData() { return Promise.resolve({}); }
    resume() { return Promise.resolve(); }
  };
  global.webkitAudioContext = global.AudioContext;

  global.G = {};

  return { storage };
}

function loadScripts(scriptPaths) {
  const ROOT = path.join(__dirname, '..');
  for (const sp of scriptPaths) {
    const full = path.join(ROOT, sp);
    const code = fs.readFileSync(full, 'utf8');
    try {
      eval(code);
    } catch (e) {
      console.error(`Error loading ${sp}:`, e);
      throw e;
    }
  }
}

module.exports = { createEnvironment, loadScripts };

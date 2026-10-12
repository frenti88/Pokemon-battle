/* ============ stage-ui.js — selector de escenarios elementales ============
 * Permite al jugador elegir entre los 5 escenarios principales basados en tipos Pokémon:
 *   1. Fuego: Volcán Ígneo (Caldera Magmática, lava ardiente)
 *   2. Agua: Gruta Marina (Arrecife Cristalino, lluvia oceánica)
 *   3. Tierra: Cañón Árido (Desierto Terráqueo, tormenta de arena)
 *   4. Insecto: Bosque Colmena (Selva Miriápoda, savia y vegetación de Rising Spire)
 *   5. Aire: Pico Celeste (Cumbre Ventosa, vientos y neblina alpina)
 */
G.StageUI = (() => {
  const $ = G.UI.$;

  const STAGE_ORDER = ['fire', 'water', 'ground', 'bug', 'flying'];

  function init() {
    const btnBack = $('stages-back');
    if (btnBack) btnBack.onclick = () => G.MenuUI.open();

    const btnRandom = $('stages-random');
    if (btnRandom) {
      btnRandom.onclick = () => {
        const randId = G.U.pick(STAGE_ORDER);
        G.Audio.sfx('confirm');
        G.Flow.play(randId);
      };
    }
  }

  function renderPreview(canvas, bi) {
    if (!canvas || !G.Tiles || !G.Tiles.paintChunk) return;
    try {
      const n = 5; // 5x5 tiles = 80x80 px
      const at = (tx, ty) => {
        if (tx === 0 || ty === 0 || (tx === 1 && ty === 1)) return 'wall';
        if (tx >= 3 && ty >= 3) return 'liquid';
        return 'floor';
      };
      const dirt = (x, y) => 0.5 + 0.25 * Math.sin(x * 0.15) * Math.cos(y * 0.15);
      const chunkCv = G.Tiles.paintChunk(0, 0, n, at, dirt, bi, 100 + bi * 17);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(chunkCv, 0, 0, canvas.width, canvas.height);
    } catch (err) {
      // Fallback silencioso si el contexto canvas no está listo
    }
  }

  function open() {
    G.UI.hideAll();
    G.UI.show('scr-stages');

    const grid = $('stages-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const stages = STAGE_ORDER.map(id => G.StageRegistry.get(id)).filter(Boolean);

    stages.forEach(st => {
      const card = document.createElement('div');
      card.className = `stage-card stage-${st.pokemonType}`;
      card.style.setProperty('--stage-accent', st.badgeColor || '#ffd23f');

      const weatherLabels = {
        sun: '☀️ Sol abrasador',
        rain: '🌧️ Lluvia torrencial',
        sand: '🌪️ Tormenta de arena',
        fog: '🌫️ Niebla densa',
        snow: '❄️ Vientos helados'
      };
      const weatherText = weatherLabels[st.weather] || '🌦️ Dinámico';

      const liquidLabels = {
        lava: '🔥 Lava fundida',
        water: '🌊 Manantiales puros',
        swamp: '🌱 Ciénaga de savia'
      };
      const liquidText = liquidLabels[st.liquid] || '💧 Agua';

      card.innerHTML = `
        <div class="stage-card-header">
          <div class="stage-card-badge" style="background:${st.badgeColor};">${st.icon} ${capitalize(st.pokemonType)}</div>
          <h3 class="stage-title">${st.name}</h3>
          <span class="stage-subtitle">${st.subtitle || ''}</span>
        </div>
        <div class="stage-card-preview-wrap">
          <canvas class="stage-preview-canvas" width="140" height="90"></canvas>
          <div class="stage-card-features">
            <span class="feature-tag"><b>Clima:</b> ${weatherText}</span>
            <span class="feature-tag"><b>Terreno:</b> ${liquidText}</span>
          </div>
        </div>
        <p class="stage-desc">${st.desc}</p>
        <button class="btn gold stage-play-btn" type="button" data-stage="${st.id}">
          Combatir aquí →
        </button>
      `;

      const playBtn = card.querySelector('.stage-play-btn');
      if (playBtn) {
        playBtn.onclick = () => {
          G.Audio.sfx('confirm');
          G.Flow.play(st.id);
        };
      }

      grid.appendChild(card);

      // Renderizar el lienzo de previsualización con píxel art
      const canvas = card.querySelector('.stage-preview-canvas');
      if (canvas && st.biomeIndex != null) {
        renderPreview(canvas, st.biomeIndex);
      }
    });
  }

  function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  return {
    init,
    open
  };
})();

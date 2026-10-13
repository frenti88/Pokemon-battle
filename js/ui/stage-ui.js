/* ============ stage-ui.js — apartado de mundos y escenarios elementales ============
 * Muestra el catálogo de los 5 mundos elementales del juego con:
 * - Estado: Disponibles (desbloqueados) y Bloqueados con sus requisitos
 * - Descripción completa, lore, clima, terreno y características notables
 * - Previsualización procedural en lienzo de píxel art
 * - Filtros rápidos: Todos / Disponibles / Bloqueados
 * - Elección interactiva para iniciar combate en el mundo seleccionado
 */
G.StageUI = (() => {
  const $ = G.UI.$;

  const STAGE_ORDER = ['fire', 'water', 'ground', 'bug', 'flying'];
  let currentFilter = 'all';

  function close() {
    const s = $('scr-stages');
    if (s) s.classList.add('hidden');
  }

  function init() {
    const btnBack = $('stages-back');
    if (btnBack) {
      btnBack.onclick = () => {
        close();
        G.MenuUI.open();
      };
    }

    const btnBackBottom = $('stages-back-bottom');
    if (btnBackBottom) {
      btnBackBottom.onclick = () => {
        close();
        G.MenuUI.open();
      };
    }

    const scr = $('scr-stages');
    if (scr) {
      scr.onclick = e => {
        if (e.target === scr) {
          close();
          G.MenuUI.open();
        }
      };
    }

    const btnRandom = $('stages-random');
    if (btnRandom) {
      btnRandom.onclick = () => {
        const unlocked = G.StageRegistry ? G.StageRegistry.getUnlocked() : [];
        const pool = unlocked.length ? unlocked.map(s => s.id) : STAGE_ORDER;
        const randId = G.U.pick(pool);
        G.Audio.sfx('confirm');
        close();
        G.Flow.play(randId);
      };
    }

    const tabs = document.querySelectorAll('#stage-tabs .stage-tab');
    tabs.forEach(tab => {
      tab.onclick = () => {
        const filter = tab.dataset.filter || 'all';
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        currentFilter = filter;
        G.Audio.sfx('click');
        renderGrid();
      };
    });
  }

  function renderPreview(canvas, bi, unlocked) {
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

      if (!unlocked) {
        // Overlay de bloqueo sombreado
        ctx.fillStyle = 'rgba(10, 10, 20, 0.65)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Icono de candado estilizado en el centro del canvas
        const cx = canvas.width / 2, cy = canvas.height / 2;
        ctx.fillStyle = '#ffb300';
        ctx.fillRect(cx - 10, cy - 6, 20, 16);
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy - 6, 6, Math.PI, 0, false);
        ctx.stroke();
        // Ojo de la cerradura
        ctx.fillStyle = '#1b1528';
        ctx.fillRect(cx - 2, cy - 1, 4, 6);
      }
    } catch (err) {
      // Fallback silencioso si el contexto canvas no está listo
    }
  }

  function open() {
    G.UI.hideAll();
    G.UI.show('scr-stages');

    // Resetear filtro a todos o mantener actual
    const tabs = document.querySelectorAll('#stage-tabs .stage-tab');
    tabs.forEach(t => t.classList.toggle('active', (t.dataset.filter || 'all') === currentFilter));

    renderGrid();
  }

  function renderGrid() {
    const grid = $('stages-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const allStages = STAGE_ORDER.map(id => G.StageRegistry.get(id)).filter(Boolean);
    const unlCount = allStages.filter(s => G.StageRegistry.isUnlocked(s.id)).length;
    const lckCount = allStages.length - unlCount;

    // Actualizar subtítulo con contadores
    const sub = $('stages-sub');
    if (sub) {
      sub.innerHTML = `Explora los biomas elementales: <b style="color:#5fe08a">${unlCount} disponibles</b> · <b style="color:#ffd23f">${lckCount} bloqueados</b>.`;
    }

    // Actualizar badges de tabs si existen
    const tabAll = document.querySelector('#stage-tabs [data-filter="all"]');
    if (tabAll) tabAll.textContent = `Todos (${allStages.length})`;
    const tabUnl = document.querySelector('#stage-tabs [data-filter="unlocked"]');
    if (tabUnl) tabUnl.textContent = `🔓 Disponibles (${unlCount})`;
    const tabLck = document.querySelector('#stage-tabs [data-filter="locked"]');
    if (tabLck) tabLck.textContent = `🔒 Bloqueados (${lckCount})`;

    // Filtrar lista
    const filtered = allStages.filter(st => {
      const isUnl = G.StageRegistry.isUnlocked(st.id);
      if (currentFilter === 'unlocked') return isUnl;
      if (currentFilter === 'locked') return !isUnl;
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="stages-empty center" style="grid-column:1/-1;padding:40px;color:var(--muted)">No hay mundos en esta categoría.</div>`;
      return;
    }

    filtered.forEach(st => {
      const unlocked = G.StageRegistry.isUnlocked(st.id);
      const prog = G.StageRegistry.getUnlockProgress(st.id);

      const card = document.createElement('div');
      card.className = `stage-card stage-${st.pokemonType} ${unlocked ? 'is-unlocked' : 'is-locked'}`;
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

      const statusBadge = unlocked
        ? `<span class="stage-status-badge unlocked">🔓 Disponible</span>`
        : `<span class="stage-status-badge locked">🔒 Bloqueado</span>`;

      const featuresHtml = (st.features || []).map(f => `<span class="stage-feat-item">✦ ${f}</span>`).join('');

      const unlockBoxHtml = unlocked
        ? `<div class="stage-unlocked-banner">
             <span class="unlocked-icon">✓</span> Mundo desbloqueado y listo para combatir
           </div>`
        : `<div class="stage-unlock-box">
             <div class="unlock-title">🔒 Desafío de desbloqueo:</div>
             <p class="unlock-desc">${st.unlockReq ? st.unlockReq.desc : 'Requisito pendiente'}</p>
             <div class="unlock-bar-wrap">
               <div class="unlock-bar-fill" style="width:${Math.round(prog.ratio * 100)}%"></div>
             </div>
             <div class="unlock-meta-row">
               <span>Progreso:</span>
               <b>${prog.currentText} / ${prog.targetText}</b>
             </div>
           </div>`;

      const actionButtonHtml = unlocked
        ? `<button class="btn gold stage-play-btn" type="button" data-stage="${st.id}">
             Combatir aquí →
           </button>`
        : `<button class="btn ghost stage-locked-btn" type="button" disabled title="Cumple el requisito de desbloqueo para jugar en este mundo">
             🔒 Bloqueado
           </button>`;

      card.innerHTML = `
        <div class="stage-card-header">
          <div class="row between items-center" style="margin-bottom:6px">
            <div class="stage-card-badge" style="background:${st.badgeColor};">${st.icon} ${capitalize(st.pokemonType)}</div>
            ${statusBadge}
          </div>
          <h3 class="stage-title">${st.name}</h3>
          <span class="stage-subtitle">${st.subtitle || ''}</span>
        </div>

        <div class="stage-card-preview-wrap">
          <canvas class="stage-preview-canvas" width="140" height="90"></canvas>
          <div class="stage-card-features">
            <span class="feature-tag"><b>Clima:</b> ${weatherText}</span>
            <span class="feature-tag"><b>Terreno:</b> ${liquidText}</span>
            <span class="feature-tag"><b>Música:</b> 🎵 ${st.music || 'ambiente'}</span>
          </div>
        </div>

        <p class="stage-desc">${st.desc}</p>

        ${featuresHtml ? `<div class="stage-feat-list">${featuresHtml}</div>` : ''}

        ${unlockBoxHtml}

        <div class="stage-actions">
          ${actionButtonHtml}
        </div>
      `;

      if (unlocked) {
        const playBtn = card.querySelector('.stage-play-btn');
        if (playBtn) {
          playBtn.onclick = () => {
            G.Audio.sfx('confirm');
            close();
            G.Flow.play(st.id);
          };
        }
      }

      grid.appendChild(card);

      // Renderizar el lienzo de previsualización con píxel art
      const canvas = card.querySelector('.stage-preview-canvas');
      if (canvas && st.biomeIndex != null) {
        renderPreview(canvas, st.biomeIndex, unlocked);
      }
    });
  }

  function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  return {
    init,
    open,
    close
  };
})();

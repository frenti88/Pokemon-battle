/* ============ test.js — Selección inicial del Profesor Oak ============
 * Flujo interactivo en 4 fases:
 * 1. El Profesor Oak: 2 preguntas situacionales (Afinidades: audaz, protector, curioso)
 * 2. La elección del camino: 3 escenarios (Bosque, Montaña, Lago)
 * 3. Las Pokébolas misteriosas: 3 Pokébolas (70% afinidad / 30% sorpresa sin duplicados)
 * 4. Pantalla de revelación: sprite animado, tipos, mensaje de Oak y "Comenzar batalla →"
 */
G.TestUI = (() => {
  const $ = G.UI.$;
  let qIdx = 0;
  let answers = [];
  let selectedPath = 'forest';
  let balls = [];
  let revealedMon = null;
  let picked = null;
  let isOpening = false;
  let dominantTrait = 'audaz';

  function init() {
    // Fase 4: Revelación y comienzo de combate
    const btnBattle = $('res-battle');
    if (btnBattle) {
      btnBattle.onclick = () => {
        if (revealedMon) chooseAndStartBattle(revealedMon.dex);
      };
    }

    const btnOk = $('res-ok');
    if (btnOk) {
      btnOk.onclick = () => {
        if (revealedMon) chooseAndStartBattle(revealedMon.dex);
      };
    }

    const btnOther = $('res-other');
    if (btnOther) btnOther.onclick = openStarters;

    // Navegación en rejilla alternativa de starters
    const sBack = $('starter-back');
    if (sBack) sBack.onclick = () => G.UI.show('scr-result');

    const sOk = $('starter-ok');
    if (sOk) {
      sOk.onclick = () => {
        if (picked) chooseAndStartBattle(picked);
      };
    }

    // Controles de navegación entre pasos
    const qPrev = $('oak-q-prev');
    if (qPrev) {
      qPrev.onclick = () => {
        if (qIdx > 0) goToQuestions(qIdx - 1);
      };
    }

    const pathPrev = $('oak-path-prev');
    if (pathPrev) {
      pathPrev.onclick = () => {
        goToQuestions(G.OakFlow.questions.length - 1);
      };
    }

    const pathNext = $('oak-path-next');
    if (pathNext) {
      pathNext.onclick = () => {
        if (selectedPath) goToBalls();
      };
    }

    const ballsPrev = $('oak-balls-prev');
    if (ballsPrev) {
      ballsPrev.onclick = () => {
        if (!isOpening) goToPath();
      };
    }
  }

  function start() {
    qIdx = 0;
    answers = [];
    selectedPath = 'forest';
    balls = [];
    revealedMon = null;
    isOpening = false;
    dominantTrait = 'audaz';

    G.UI.chrome(false);
    G.UI.show('scr-test');
    goToQuestions(0);
  }

  /** Fase 1: Preguntas situacionales */
  function goToQuestions(idx) {
    qIdx = idx;
    isOpening = false;

    // Visibilidad de fases
    $('oak-phase-questions').classList.remove('hidden');
    $('oak-phase-path').classList.add('hidden');
    $('oak-phase-balls').classList.add('hidden');

    // Indicador y barra de progreso
    const totalSteps = G.OakFlow.questions.length + 2; // 2 preguntas + camino + Pokébolas
    const currentStep = qIdx + 1;
    $('test-bar').style.width = ((currentStep / totalSteps) * 100) + '%';
    $('test-count').textContent = `Pregunta ${qIdx + 1} de ${G.OakFlow.questions.length}`;
    $('test-phase-badge').textContent = 'Fase 1: Personalidad';

    // Diálogo del Profesor Oak
    const oakSpeech = $('oak-speech');
    if (qIdx === 0) {
      oakSpeech.textContent = G.OakFlow.introText;
    } else if (qIdx === 1) {
      oakSpeech.textContent = 'Un buen entrenador sabe reflexionar antes del peligro. ¿Cómo responderías ante este nuevo desafío?';
    } else {
      oakSpeech.textContent = '¡Una última prueba de intuición! El modo en que abordas lo desconocido revelará a tu compañero ideal.';
    }

    // Pregunta actual
    const q = G.OakFlow.questions[qIdx];
    $('test-q').textContent = q.text;

    // Tarjetas de opciones
    const box = $('test-a');
    box.innerHTML = '';
    q.options.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'answer' + (answers[qIdx] === opt.trait ? ' on' : '');
      b.dataset.sfx = 'select';
      b.type = 'button';
      b.innerHTML = `<b>${opt.text}</b><span class="answer-sub">Afinidad: ${capitalize(opt.trait)} · ${opt.sub}</span>`;
      b.onclick = () => selectAnswer(opt.trait, b);
      box.appendChild(b);
    });

    // Botón volver
    const prevBtn = $('oak-q-prev');
    if (qIdx > 0) prevBtn.classList.remove('hidden');
    else prevBtn.classList.add('hidden');
  }

  function selectAnswer(trait, btnEl) {
    answers[qIdx] = trait;
    G.Audio.sfx('select');

    const box = $('test-a');
    box.querySelectorAll('.answer').forEach(b => b.classList.remove('on'));
    if (btnEl) btnEl.classList.add('on');

    setTimeout(() => {
      if (qIdx + 1 < G.OakFlow.questions.length) {
        goToQuestions(qIdx + 1);
      } else {
        goToPath();
      }
    }, 220);
  }

  /** Fase 2: La elección del camino */
  function goToPath() {
    isOpening = false;

    $('oak-phase-questions').classList.add('hidden');
    $('oak-phase-path').classList.remove('hidden');
    $('oak-phase-balls').classList.add('hidden');

    const totalSteps = G.OakFlow.questions.length + 2;
    $('test-bar').style.width = (((G.OakFlow.questions.length + 1) / totalSteps) * 100) + '%';
    $('test-count').textContent = 'Paso 2 de 3: Elige tu camino';
    $('test-phase-badge').textContent = 'Fase 2: Escenario';

    $('oak-speech').textContent = G.OakFlow.pathIntro;

    const container = $('oak-path-cards');
    container.innerHTML = '';

    const pathIcons = {
      forest: '🌲',
      mountain: '⛰️',
      lake: '🌊',
      cave: '💎'
    };

    G.OakFlow.paths.forEach(p => {
      const card = document.createElement('div');
      card.className = 'path-card' + (selectedPath === p.id ? ' on' : '');
      card.dataset.path = p.id;
      card.innerHTML = `
        <span class="path-icon">${pathIcons[p.id] || '🗺️'}</span>
        <div class="path-title">${p.title}</div>
        <div class="path-desc">${p.desc}</div>
      `;
      card.onclick = () => {
        container.querySelectorAll('.path-card').forEach(c => c.classList.remove('on'));
        card.classList.add('on');
        selectedPath = p.id;
        G.Audio.sfx('select');
        $('oak-path-next').disabled = false;
      };
      container.appendChild(card);
    });

    $('oak-path-next').disabled = !selectedPath;
  }

  /** Fase 3: Las Pokébolas misteriosas */
  function goToBalls() {
    isOpening = false;

    $('oak-phase-questions').classList.add('hidden');
    $('oak-phase-path').classList.add('hidden');
    $('oak-phase-balls').classList.remove('hidden');

    $('test-bar').style.width = '100%';
    $('test-count').textContent = 'Paso 3 de 3: Compañero misterioso';
    $('test-phase-badge').textContent = 'Fase 3: Pokébolas';

    $('oak-speech').textContent = G.OakFlow.pokeballsIntro;
    $('oak-balls-status').textContent = 'Toca una Pokébola para descubrir a tu compañero inicial';

    const bPrev = $('oak-balls-prev');
    if (bPrev) bPrev.classList.remove('hidden');

    // Generar las 3 Pokébolas con 70% afinidad y 30% sorpresa sin duplicados
    balls = G.OakFlow.generatePokeballs(selectedPath, answers);

    const stage = $('oak-balls-stage');
    stage.classList.remove('locked');
    stage.innerHTML = '';

    balls.forEach((ballMon, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'oak-ball-wrapper';
      wrap.dataset.index = String(i);
      wrap.innerHTML = `
        <div class="oak-ball" id="oak-ball-${i}"></div>
        <div class="oak-ball-label">Pokébola ${i + 1}</div>
      `;
      wrap.onclick = () => selectBall(i, ballMon, wrap);
      stage.appendChild(wrap);
    });
  }

  function selectBall(index, mon, wrapElement) {
    if (isOpening) return;
    isOpening = true;

    const stage = $('oak-balls-stage');
    stage.classList.add('locked');
    wrapElement.classList.add('selected');

    const bPrev = $('oak-balls-prev');
    if (bPrev) bPrev.classList.add('hidden');

    $('oak-balls-status').textContent = '¡La Pokébola está vibrando...! Elegiste a un nuevo compañero.';

    const ball = wrapElement.querySelector('.oak-ball');
    if (ball) ball.classList.add('shaking');
    G.Audio.sfx('shake');

    setTimeout(() => {
      G.Audio.sfx('shake');
    }, 400);

    setTimeout(() => {
      $('oak-balls-status').textContent = '¡Una luz resplandeciente emerge!';
      if (ball) {
        ball.classList.remove('shaking');
        ball.classList.add('bursting');
      }
      G.Audio.sfx('burst');
      G.Audio.sfx('reveal');
    }, 850);

    setTimeout(() => {
      showResult(mon);
    }, 1350);
  }

  /** Fase 4: Pantalla de revelación */
  function showResult(mon) {
    revealedMon = mon;

    // Calcular afinidad dominante
    const counts = { audaz: 0, protector: 0, curioso: 0 };
    answers.forEach(a => { if (counts[a] !== undefined) counts[a]++; });
    dominantTrait = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || 'audaz';

    const fullMon = G.DEX_BY[mon.dex] || mon;
    const explanation = G.OakFlow.getExplanation(fullMon, dominantTrait, selectedPath);

    // Diálogo personalizado del Profesor Oak
    $('res-explanation').textContent = explanation;

    // Información del Pokémon
    $('res-name').textContent = fullMon.name;
    $('res-trait-badge').textContent = 'Afinidad: ' + capitalize(dominantTrait);
    $('res-types').innerHTML = G.UI.typeChips(fullMon.types);

    // Compatibilidad con campos antiguos si son consultados
    if ($('res-trait')) $('res-trait').textContent = capitalize(dominantTrait);
    if ($('res-text')) $('res-text').textContent = G.TRAIT_TEXT[dominantTrait] || '';

    // Renderizado del sprite en escenario
    const stage = $('res-stage');
    G.UI.sprite(stage, fullMon.dex, { lively: true, scale: 4, hero: true });
    stage.style.setProperty('--stage-c', G.U.TYPE_COLOR[fullMon.types[0]] || '#ffd23f');
    stage.classList.remove('reveal-pop');
    void stage.offsetWidth; // Forzar reflow para reiniciar animación
    stage.classList.add('reveal-pop');

    G.Audio.sfx('shinyGet');
    G.UI.show('scr-result');
  }

  /** Abre la rejilla de selección alternativa de starters */
  function openStarters() {
    picked = null;
    $('starter-ok').disabled = true;
    $('starter-info').textContent = 'Selecciona un Pokémon';
    const grid = $('starter-grid');
    grid.innerHTML = '';
    for (const s of G.STARTERS) {
      const mon = G.DEX_BY[s.dex];
      const cell = document.createElement('div');
      cell.className = 'cell' + (revealedMon && s.dex === revealedMon.dex ? ' on' : '');
      cell.appendChild(G.UI.spriteCanvas(s.dex, 92, 80, { scale: 2 }));
      cell.insertAdjacentHTML('beforeend', `<b>${mon.name}</b>`);
      cell.onclick = () => {
        grid.querySelectorAll('.cell').forEach(c => c.classList.remove('on'));
        cell.classList.add('on');
        picked = s.dex;
        const mv = G.Moves.BY_ID[s.start];
        $('starter-info').innerHTML = `${G.UI.typeChips(mon.types)} ${G.Icons.html('move:' + s.start, 16)} ${mv.name} · ${s.traits.join(', ')}`;
        $('starter-ok').disabled = false;
      };
      if (revealedMon && s.dex === revealedMon.dex) {
        picked = s.dex;
        $('starter-ok').disabled = false;
      }
      grid.appendChild(cell);
    }
    G.UI.show('scr-starters');
  }

  /**
   * Asigna el Pokémon como compañero inicial, persiste los datos en local
   * e inicia la primera batalla directamente en el motor de combate actual.
   */
  function chooseAndStartBattle(dex) {
    const save = G.DB.save;
    save.starter = dex;
    save.partner = dex;
    save.personality = {
      trait: dominantTrait,
      affinities: answers.slice(),
      path: selectedPath
    };
    G.DB.grant(dex, 'starter');
    G.DB.commit();

    G.Audio.sfx('confirm');
    const monName = (G.DEX_BY[dex] || {}).name || 'Pokémon';
    G.UI.toast('¡' + monName + ' se une a tu equipo!');

    // Comenzar batalla directamente en el motor de combate
    G.Flow.play();
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return {
    init,
    start,
    chooseAndStartBattle,
    openStarters,
    getState: () => ({
      qIdx,
      answers,
      selectedPath,
      balls,
      revealedMon,
      dominantTrait,
      isOpening
    })
  };
})();

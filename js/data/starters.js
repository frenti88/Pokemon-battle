/* ============ starters.js — compañeros iniciales y test de personalidad ============
 * Como en Mundo Misterioso: unas preguntas deciden tu personalidad, y tu
 * personalidad decide tu compañero. Puedes rechazarlo y elegir otro.
 *
 * Los stats salen de G.DEX; aquí sólo van los rasgos y el movimiento inicial.
 */
G.STARTERS_ALL = [
  { dex: 1,   start: 'vine-whip',     traits: ['leal', 'paciente'] },
  { dex: 4,   start: 'ember',         traits: ['valiente', 'impulsivo'] },
  { dex: 7,   start: 'water-gun',     traits: ['prudente', 'leal'] },
  { dex: 152, start: 'vine-whip',     traits: ['dulce', 'paciente'] },
  { dex: 155, start: 'ember',         traits: ['tímido', 'impulsivo'] },
  { dex: 158, start: 'water-gun',     traits: ['travieso', 'valiente'] },
  { dex: 252, start: 'razor-leaf',    traits: ['sereno', 'astuto'] },
  { dex: 255, start: 'ember',         traits: ['alegre', 'valiente'] },
  { dex: 258, start: 'water-gun',     traits: ['tenaz', 'leal'] },
  { dex: 387, start: 'vine-whip',     traits: ['paciente', 'tenaz'] },
  { dex: 390, start: 'ember',         traits: ['travieso', 'alegre'] },
  { dex: 393, start: 'bubble',        traits: ['orgulloso', 'prudente'] },
  { dex: 495, start: 'razor-leaf',    traits: ['orgulloso', 'astuto'] },
  { dex: 498, start: 'ember',         traits: ['tenaz', 'alegre'] },
  { dex: 501, start: 'water-gun',     traits: ['valiente', 'travieso'] },
  { dex: 650, start: 'vine-whip',     traits: ['travieso', 'tenaz'] },
  { dex: 653, start: 'ember',         traits: ['astuto', 'sereno'] },
  { dex: 656, start: 'water-gun',     traits: ['sereno', 'astuto'] },
  { dex: 722, start: 'razor-leaf',    traits: ['sereno', 'dulce'] },
  { dex: 725, start: 'ember',         traits: ['solitario', 'orgulloso'] },
  { dex: 728, start: 'bubble',        traits: ['alegre', 'dulce'] },
  { dex: 810, start: 'vine-whip',     traits: ['alegre', 'travieso'] },
  { dex: 813, start: 'ember',         traits: ['impulsivo', 'alegre'] },
  { dex: 816, start: 'water-gun',     traits: ['tímido', 'astuto'] },
  { dex: 906, start: 'razor-leaf',    traits: ['solitario', 'astuto'] },
  { dex: 909, start: 'ember',         traits: ['tranquilo', 'tenaz'] },
  { dex: 912, start: 'water-gun',     traits: ['orgulloso', 'prudente'] },
  { dex: 54,  start: 'confusion',     traits: ['caótico', 'tímido'] },
  { dex: 79,  start: 'confusion',     traits: ['tranquilo', 'paciente'] }
];

// Starters activos: únicamente Pokémon originales de la primera temporada (dex <= 150)
G.STARTERS = [
  { dex: 1,   start: 'vine-whip',     traits: ['leal', 'paciente'] },
  { dex: 4,   start: 'ember',         traits: ['valiente', 'impulsivo'] },
  { dex: 7,   start: 'water-gun',     traits: ['prudente', 'leal'] },
  { dex: 25,  start: 'thunder-shock', traits: ['valiente', 'alegre'] },
  { dex: 39,  start: 'tackle',        traits: ['alegre', 'dulce'] },
  { dex: 52,  start: 'tackle',        traits: ['astuto', 'travieso'] },
  { dex: 54,  start: 'water-gun',     traits: ['caótico', 'tímido'] },
  { dex: 66,  start: 'karate-chop',   traits: ['tenaz', 'orgulloso'] },
  { dex: 79,  start: 'water-gun',     traits: ['tranquilo', 'paciente'] },
  { dex: 133, start: 'tackle',        traits: ['sereno', 'solitario'] }
];

G.STARTER_BY = {};
for (const s of G.STARTERS_ALL) G.STARTER_BY[s.dex] = s;
for (const s of G.STARTERS) G.STARTER_BY[s.dex] = s;

/** Movimiento inicial de cualquier Pokémon (starter o del gacha). */
G.startMoveOf = dex => {
  const s = G.STARTER_BY[dex];
  return s ? s.start : G.Moves.startFor(G.DEX_BY[dex]);
};

/** Descripción corta de cada rasgo, para la pantalla de resultado. */
G.TRAIT_TEXT = {
  valiente:  'No te lo piensas dos veces cuando alguien necesita ayuda.',
  impulsivo: 'Actúas primero y piensas después. ¡A veces sale bien!',
  prudente:  'Mides cada paso antes de darlo.',
  leal:      'Tus amigos saben que pueden contar contigo siempre.',
  paciente:  'Sabes esperar el momento justo.',
  dulce:     'Tu amabilidad tranquiliza a todos los que te rodean.',
  tímido:    'Te cuesta dar el primer paso, pero sientes mucho.',
  travieso:  'Siempre tienes una broma preparada.',
  sereno:    'Mantienes la calma cuando todo se complica.',
  astuto:    'Ves soluciones donde otros ven problemas.',
  alegre:    'Contagias energía allá donde vas.',
  tenaz:     'Rendirse no entra en tus planes.',
  orgulloso: 'Te exiges ser el mejor, y casi siempre lo consigues.',
  solitario: 'Vas a tu aire y no te importa.',
  tranquilo: 'Nada te altera. Nada.',
  caótico:   'Ni tú sabes qué vas a hacer después.'
};

G.PERSONALITY_TEST = [
  { q: '¡Hay una pelea en mitad del pueblo! ¿Qué haces?', a: [
    { t: 'Me meto a ayudar sin pensarlo.',          p: { valiente: 2, impulsivo: 1 } },
    { t: 'Busco a alguien que pueda pararla.',       p: { prudente: 2, leal: 1 } },
    { t: 'Lo observo todo desde lejos.',             p: { sereno: 1, tímido: 1, solitario: 1 } },
    { t: 'Me río y animo a los dos.',                p: { travieso: 2, caótico: 1 } } ] },
  { q: 'Te encuentras una cartera en el suelo.', a: [
    { t: 'La llevo enseguida a la policía.',         p: { leal: 2, dulce: 1 } },
    { t: 'Busco a su dueño aunque tarde horas.',     p: { tenaz: 2, paciente: 1 } },
    { t: 'Primero miro qué hay dentro…',            p: { astuto: 2, travieso: 1 } },
    { t: 'Ni la toco, no vaya a ser.',               p: { prudente: 1, tímido: 2 } } ] },
  { q: 'Tu día libre ideal es…', a: [
    { t: 'Una aventura sin ningún plan.',            p: { impulsivo: 2, alegre: 1 } },
    { t: 'Leer, pensar, estar tranquilo.',           p: { sereno: 2, tranquilo: 1 } },
    { t: 'Quedar con todos mis amigos.',             p: { alegre: 2, leal: 1 } },
    { t: 'Entrenar para ser mejor.',                 p: { tenaz: 2, orgulloso: 1 } } ] },
  { q: 'Mañana tienes un examen importante.', a: [
    { t: 'Estudio hasta las tantas.',                p: { tenaz: 2, prudente: 1 } },
    { t: 'Repaso lo justo: confío en mí.',           p: { orgulloso: 2, sereno: 1 } },
    { t: 'Me agobio muchísimo.',                     p: { tímido: 2, dulce: 1 } },
    { t: '¿Examen? Ya veré mañana.',                 p: { caótico: 2, tranquilo: 1 } } ] },
  { q: '¿Qué dicen de ti tus amigos?', a: [
    { t: 'Que soy lo más divertido del grupo.',      p: { alegre: 2, travieso: 1 } },
    { t: 'Que siempre pueden contar conmigo.',       p: { leal: 2, dulce: 1 } },
    { t: 'Que soy un poco misterioso.',              p: { solitario: 2, astuto: 1 } },
    { t: 'Que no me rindo nunca.',                   p: { valiente: 1, tenaz: 2 } } ] },
  { q: 'El camino se divide: uno oscuro y corto, otro largo y soleado.', a: [
    { t: 'El oscuro, ¡más emoción!',                 p: { valiente: 2, impulsivo: 1 } },
    { t: 'El largo, sin prisa.',                     p: { paciente: 2, prudente: 1 } },
    { t: 'Me siento a pensarlo un rato.',            p: { tranquilo: 2, sereno: 1 } },
    { t: 'Ninguno: abro un atajo nuevo.',            p: { astuto: 2, caótico: 1 } } ] },
  { q: 'Alguien se burla de ti delante de todos.', a: [
    { t: 'Le contesto en el acto.',                  p: { orgulloso: 2, impulsivo: 1 } },
    { t: 'Le ignoro por completo.',                  p: { sereno: 2, solitario: 1 } },
    { t: 'Me afecta, aunque no lo diga.',            p: { tímido: 2, dulce: 1 } },
    { t: 'Le devuelvo una broma mejor.',             p: { travieso: 2, astuto: 1 } } ] },
  { q: '¿Qué es lo más importante para ti?', a: [
    { t: 'La amistad.',                              p: { leal: 2, alegre: 1 } },
    { t: 'La libertad.',                             p: { solitario: 2, impulsivo: 1 } },
    { t: 'La calma.',                                p: { tranquilo: 2, paciente: 1 } },
    { t: 'Ser el mejor.',                            p: { orgulloso: 2, tenaz: 1 } } ] }
];

/** Puntuaciones de rasgos -> { trait, dex } con el compañero que mejor encaja. */
G.personalityResult = scores => {
  const trait = Object.keys(scores).sort((a, b) => scores[b] - scores[a])[0];
  let best = [], bestScore = -1;
  for (const s of G.STARTERS) {
    // El rasgo principal pesa el doble.
    const v = (scores[s.traits[0]] || 0) * 2 + (scores[s.traits[1]] || 0);
    if (v > bestScore) { bestScore = v; best = [s]; }
    else if (v === bestScore) best.push(s);
  }
  return { trait, dex: G.U.pick(best).dex };
};

// ============================================================================
// REDISEÑO: SISTEMA DE SELECCIÓN INICIAL DEL PROFESOR OAK
// ============================================================================
G.OakFlow = {
  introText: '¡Hola, entrenador! Antes de entregarte tu primer compañero, quiero descubrir cómo reaccionas ante una aventura.',

  // Fase 1: Preguntas situacionales
  questions: [
    {
      id: 'q1',
      text: 'Estás explorando un bosque y escuchas un ruido extraño. ¿Qué haces?',
      options: [
        { id: '1a', text: 'Voy directamente a descubrir qué ocurre.', trait: 'audaz', sub: 'Decisión impulsiva y valiente' },
        { id: '1b', text: 'Me acerco con cuidado, por si alguien necesita ayuda.', trait: 'protector', sub: 'Decisión empática y prudente' },
        { id: '1c', text: 'Observo las huellas para averiguar qué es.', trait: 'curioso', sub: 'Decisión analítica y observadora' }
      ]
    },
    {
      id: 'q2',
      text: 'Un Pokémon salvaje bloquea tu camino. ¿Cómo reaccionas?',
      options: [
        { id: '2a', text: 'Lo desafío. ¡Quiero demostrar mi fuerza!', trait: 'audaz', sub: 'Decisión competitiva y enérgica' },
        { id: '2b', text: 'Intento ganar su confianza.', trait: 'protector', sub: 'Decisión cercana y comprensiva' },
        { id: '2c', text: 'Estudio su comportamiento antes de actuar.', trait: 'curioso', sub: 'Decisión reflexiva y estratégica' }
      ]
    },
    {
      id: 'q3',
      text: 'Descubres una cueva secreta con una reliquia brillante en su interior. ¿Qué haces?',
      options: [
        { id: '3a', text: '¡Entro de inmediato a descubrir su poder sin vacilar!', trait: 'audaz', sub: 'Decisión decidida e intrépida' },
        { id: '3b', text: 'Avanzo con cautela asegurándome de que el camino sea seguro.', trait: 'protector', sub: 'Decisión prudente y protectora' },
        { id: '3c', text: 'Examino las inscripciones y gemas antes de tocarla.', trait: 'curioso', sub: 'Decisión analítica y observadora' }
      ]
    }
  ],

  // Fase 2: Escenarios y caminos
  pathIntro: '¡Interesante! Tus decisiones dicen bastante sobre ti. Ahora debes elegir dónde comenzará tu aventura.',
  paths: [
    {
      id: 'forest',
      name: 'Bosque',
      title: 'Bosque Frondoso',
      desc: 'Senderos ocultos, naturaleza y Pokémon misteriosos.',
      theme: 'forest',
      color: '#1b5e20',
      candidates: [
        { dex: 1, affinity: 'protector', name: 'Bulbasaur' },
        { dex: 25, affinity: 'audaz', name: 'Pikachu' },
        { dex: 133, affinity: 'curioso', name: 'Eevee' },
        { dex: 10, affinity: 'curioso', name: 'Caterpie' },
        { dex: 12, affinity: 'protector', name: 'Butterfree' },
        { dex: 43, affinity: 'protector', name: 'Oddish' },
        { dex: 69, affinity: 'curioso', name: 'Bellsprout' },
        { dex: 123, affinity: 'audaz', name: 'Scyther' },
        { dex: 127, affinity: 'audaz', name: 'Pinsir' }
      ]
    },
    {
      id: 'mountain',
      name: 'Montaña',
      title: 'Montaña Rocosa',
      desc: 'Terrenos difíciles, rocas y aventuras intensas.',
      theme: 'mountain',
      color: '#bf360c',
      candidates: [
        { dex: 4, affinity: 'audaz', name: 'Charmander' },
        { dex: 37, affinity: 'curioso', name: 'Vulpix' },
        { dex: 56, affinity: 'audaz', name: 'Mankey' },
        { dex: 58, affinity: 'protector', name: 'Growlithe' },
        { dex: 66, affinity: 'audaz', name: 'Machop' },
        { dex: 74, affinity: 'protector', name: 'Geodude' },
        { dex: 77, affinity: 'curioso', name: 'Ponyta' },
        { dex: 95, affinity: 'curioso', name: 'Onix' }
      ]
    },
    {
      id: 'lake',
      name: 'Lago',
      title: 'Lago Cristalino',
      desc: 'Aguas profundas, calma y criaturas sorprendentes.',
      theme: 'lake',
      color: '#0d47a1',
      candidates: [
        { dex: 7, affinity: 'protector', name: 'Squirtle' },
        { dex: 54, affinity: 'curioso', name: 'Psyduck' },
        { dex: 60, affinity: 'audaz', name: 'Poliwag' },
        { dex: 79, affinity: 'curioso', name: 'Slowpoke' },
        { dex: 116, affinity: 'audaz', name: 'Horsea' },
        { dex: 120, affinity: 'curioso', name: 'Staryu' },
        { dex: 129, affinity: 'audaz', name: 'Magikarp' },
        { dex: 131, affinity: 'protector', name: 'Lapras' }
      ]
    },
    {
      id: 'cave',
      name: 'Caverna',
      title: 'Caverna Misteriosa',
      desc: 'Galerías subterráneas, cristales brillantes y Pokémon enigmáticos.',
      theme: 'cave',
      color: '#4a148c',
      candidates: [
        { dex: 92, affinity: 'curioso', name: 'Gastly' },
        { dex: 63, affinity: 'curioso', name: 'Abra' },
        { dex: 35, affinity: 'protector', name: 'Clefairy' },
        { dex: 39, affinity: 'protector', name: 'Jigglypuff' },
        { dex: 104, affinity: 'protector', name: 'Cubone' },
        { dex: 41, affinity: 'audaz', name: 'Zubat' },
        { dex: 81, affinity: 'audaz', name: 'Magnemite' },
        { dex: 125, affinity: 'audaz', name: 'Electabuzz' },
        { dex: 147, affinity: 'protector', name: 'Dratini' }
      ]
    }
  ],

  // Fase 3: Las Pokébolas misteriosas
  pokeballsIntro: 'En este lugar hay tres Pokémon que podrían acompañarte. Sus Pokébolas están preparadas, pero solo puedes elegir una.',

  // Configuración de pesos (70% afinidad, 30% sorpresa)
  config: {
    weightAffinity: 0.70,
    weightSurprise: 0.30
  },

  /**
   * Genera los 3 Pokémon asignados a las Pokébolas sin duplicados.
   * Aplica un 70% de peso a Pokémon con afinidad compatible con las respuestas
   * y un 30% a opciones alternativas de sorpresa dentro del camino.
   */
  generatePokeballs(pathId, userAffinities) {
    const path = this.paths.find(p => p.id === pathId) || this.paths[0];
    const pool = path.candidates.filter(c => {
      const p = G.DEX_BY && G.DEX_BY[c.dex];
      return p && (!p.disabled || p.enabled) && G.SPRITE_META && G.SPRITE_META[c.dex];
    });

    if (!pool.length) {
      return [
        { dex: 1, affinity: 'protector', name: 'Bulbasaur' },
        { dex: 4, affinity: 'audaz', name: 'Charmander' },
        { dex: 7, affinity: 'curioso', name: 'Squirtle' }
      ];
    }

    const affinities = Array.isArray(userAffinities) ? userAffinities : [];
    const wAff = this.config.weightAffinity;
    const wSur = this.config.weightSurprise;

    // Asignación de pesos según coincidencias de afinidad
    const scoredPool = pool.map(item => {
      const matches = affinities.filter(a => a === item.affinity).length;
      const weight = matches > 0 ? (wAff * (1 + (matches - 1) * 0.5)) : wSur;
      return { item, weight };
    });

    // Muestreo ponderado sin reemplazo
    const chosen = [];
    const remaining = scoredPool.slice();
    const countToPick = Math.min(3, remaining.length);

    while (chosen.length < countToPick && remaining.length > 0) {
      const totalWeight = remaining.reduce((acc, curr) => acc + curr.weight, 0);
      let r = Math.random() * totalWeight;
      let selectedIndex = 0;
      for (let i = 0; i < remaining.length; i++) {
        r -= remaining[i].weight;
        if (r <= 0) {
          selectedIndex = i;
          break;
        }
      }
      chosen.push(remaining[selectedIndex].item);
      remaining.splice(selectedIndex, 1);
    }

    // Relleno seguro sin duplicados si hiciera falta
    while (chosen.length < 3) {
      const fallbackList = G.STARTERS || [];
      const extra = fallbackList.find(s => !chosen.some(c => c.dex === s.dex));
      if (extra) {
        chosen.push({ dex: extra.dex, affinity: 'audaz', name: (G.DEX_BY[extra.dex] || {}).name || 'Pokémon' });
      } else {
        break;
      }
    }

    return chosen;
  },

  /**
   * Genera el mensaje personalizado del Profesor Oak para la pantalla de revelación.
   */
  getExplanation(mon, primaryTrait, pathId) {
    const path = this.paths.find(p => p.id === pathId) || this.paths[0];
    const pathName = path.name;
    const trait = (primaryTrait || 'audaz').toLowerCase();
    const loc = (path.id === 'mountain' || path.id === 'cave') ? `la ${pathName}` : `el ${pathName}`;

    const explanations = {
      audaz: [
        `Tu valentía y tu determinación conectaron profundamente con ${mon.name} en ${loc}. ¡Están listos para enfrentar cualquier desafío!`,
        `Ese espíritu intrépido y competitivo resonó con la energía de ${mon.name}. ¡Juntos serán una fuerza imparable!`,
        `No dudas ante el peligro, y ${mon.name} reconoció de inmediato tu coraje en ${loc}. ¡Una gran leyenda comienza aquí!`
      ],
      protector: [
        `Tu empatía y tu deseo de proteger a los demás tocaron el corazón de ${mon.name} en ${loc}. ¡Formarán un equipo inseparable!`,
        `La calma y lealtad que transmites hicieron que ${mon.name} confiara en ti sin dudarlo. ¡Cuidarán el uno del otro en cada combate!`,
        `Tu nobleza y sentido del compañerismo conectaron de inmediato con ${mon.name}. ¡Su vínculo será su mayor fortaleza!`
      ],
      curioso: [
        `Tu curiosidad aguda y tu mente estratégica fascinaron a ${mon.name} en ${loc}. ¡Descubrirán juntos todos los secretos del camino!`,
        `Observas los detalles donde otros no ven nada. ${mon.name} sintió esa inteligencia y decidió acompañarte.`,
        `Tu espíritu explorador y analítico encaja a la perfección con la naturaleza de ${mon.name}. ¡Aprenderán y evolucionarán juntos!`
      ]
    };

    const list = explanations[trait] || explanations.audaz;
    const idx = (mon.dex + (pathId ? pathId.length : 0)) % list.length;
    return list[idx];
  }
};

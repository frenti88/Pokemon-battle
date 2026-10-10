# Auditoría Inicial del Proyecto: PokéSurvivor Local Edition
**Fecha:** 10 de octubre de 2026  
**Rama:** `local-edition` (creada a partir de `main` en commit `3325e86`)  
**Repositorio original:** [JPTER78/pokesurvivor](https://github.com/JPTER78/pokesurvivor)

---

## 1. Estado Inicial e Inspección

### 1.1 Entorno y Estructura
- **Tecnologías centrales:** JavaScript Vanilla (ES2020), HTML5 Canvas 2D, CSS3 nativo.
- **Sin frameworks pesados:** La arquitectura es ligera, modular por namespaces globales (`window.G`).
- **Punto de entrada de desarrollo:** `dev.html` carga los ~55 scripts desglosados en orden (`<!-- scripts:begin -->` a `<!-- scripts:end -->`).
- **Punto de entrada de producción:** `index.html` carga `js/app.min.js`, generado con `tools/build.js` mediante Terser.
- **Recursos locales:**
  - `assets/pokemon/`: 966 carpetas de Pokémon locales con hojas de sprites PMD (Idle, Walk, Attack, Shoot, Charge, Hurt, Faint) y subcarpetas `s/` para shinies.
  - `assets/fonts/`: Fuente Pixelify Sans presente.
  - `assets/icons/`: Iconos PWA presentes.
  - `js/data/music.js`: Sintetizador Web Audio nativo y partituras en código, 100% offline.

### 1.2 Dependencias de Red y Firebase (Puntos Críticos Detectados)
1. **Configuración de Firebase en producción del autor:**
   - En `js/core/firebase-config.js`, `G.FIREBASE_CONFIG` contenía credenciales reales y activas del autor (`projectId: 'pokesurvivor-jpter'`).
   - Si `G.FIREBASE_CONFIG` está configurado y el juego se ejecuta en HTTP/HTTPS (incluyendo `localhost`), `js/core/db.js` intenta cargar dinámicamente SDKs remotos de Google (`https://www.gstatic.com/firebasejs/13.0.0/...`), iniciar Firebase Auth y conectarse a Firestore/RTDB del autor.
   - **Riesgo:** Violación de privacidad, fallo si no hay internet, contaminación de rankings/datos remotos del autor.
   - **Solución requerida:** Aislar configurando `G.FIREBASE_CONFIG = null` por defecto en local, permitiendo modo offline/guest/local 100% en `localStorage`.

2. **Registro de Service Worker (`sw.js`):**
   - `js/main.js` registra `sw.js` indiscriminadamente en cualquier protocolo `http(s)`.
   - `sw.js` cachea `index.html`, `css/style.css`, etc.
   - **Riesgo:** Durante desarrollo local en `http://localhost:8000/`, el SW almacena versiones viejas en caché e impide ver modificaciones en tiempo real.
   - **Solución requerida:** En entornos de desarrollo/localhost (`location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.pathname.includes('dev.html')`), desregistrar cualquier Service Worker y no registrar nuevos para evitar caché obsoleto.

3. **Herramienta de Build (`tools/build.js`):**
   - Requiere `npx terser@5`.
   - Lee `dev.html` entre marcas de scripts, concatena y genera `js/app.min.js` e `index.html`.
   - Debe asegurarse que el build conserve el aislamiento offline sin Firebase.

---

## 2. Diagnóstico de Subsistemas

| Subsistema | Estado Inicial | Riesgos / Necesidades | Prioridad |
|---|---|---|---|
| **Persistencia / Cuentas** | `db.js` soporta modo local (`ps.accounts`, `ps.save.<user>`), pero intentaba nube por `FIREBASE_CONFIG`. | Desactivar Firebase autor, validar flujo local de invitado y usuarios en `localStorage`. | **Alta (Fase 1)** |
| **Service Worker** | Activo en cualquier `http:` | Provoca stale cache en `localhost:8000`. Desactivar en local. | **Alta (Fase 1)** |
| **Movimiento y Controles** | WASD, flechas, normalización en `G.U.norm`, damping independiente de FPS. | Verificar colisiones continuas con objetos sólidos y agua/lava. | Media (Fase 2) |
| **Combate y Proyectiles** | 15 familias implementadas en `combat.js` y `moves.js`. Colisiones barridas en proyectiles (`segDist2`). | Validar auto-aim, prioridades, recargas y daño en partidas reales. | Media (Fase 2) |
| **Enemigos e IA** | Persecución, asalto, ataque a distancia, jefes con fases y telégrafos (`hazards.js`). | Evitar spawns en obstáculos y verificar el pathfinding. | Media (Fase 2) |
| **Jefes y Grietas** | `spawner.js` spawnea jefes cada 3 min; `rift.js` gestiona grietas y legendarios. | Verificar transiciones limpias y condiciones de victoria/derrota. | Media (Fase 2) |
| **Progresión / Gacha** | `levelup.js` (cartas), `gacha.js`, `progress.js` (misiones y logros). | Comprobar que no bloqueen la partida ni dependan de red. | Media (Fase 2) |
| **Extensibilidad** | Catálogo en `pokedex.js` acoplado; falta API declarativa para añadir nuevos Pokémon, movimientos, mapas y modos. | Diseñar registros desacoplados (`ContentRegistry`, `MoveRegistry`, etc.) con fallbacks. | **Alta (Fase 3)** |
| **Pruebas Automatizadas** | No existía suite de tests automatizados unitarios ni de gameplay en el repo. | Crear tests en Node.js (unitarios y simulación 10 min de gameplay) y verificar con Playwright si es posible. | **Alta (Fase 5)** |

---

## 3. Plan de Acción Inmediato
1. **Fase 1:** Configurar aislamiento de Firebase (`G.FIREBASE_CONFIG = null` en `firebase-config.js`), desactivar Service Worker en localhost/dev, y verificar arranque con servidor HTTP local en puerto 8000.
2. **Fase 2:** Verificar y asegurar todo el ciclo jugable: Inicio → Invitado/Login → Selección de personaje/Test → Partida → Combate → Subida de nivel → Jefes → Resultados → Menú.
3. **Fase 3:** Construir registros extensibles para Pokémon (con fallback de sprites), movimientos, escenarios y modos de juego, manteniendo 100% de retrocompatibilidad.
4. **Fase 4 & 5:** Implementar suite de tests automatizados (unitarios y simulación de 10 minutos con semillas deterministas para 3 iniciales distintos), medir rendimiento y validar ausencia de NaNs / infinitos.
5. **Fase 6 & 7:** Construir versión final con `tools/build.js`, validar `index.html` y generar documentación completa.

---

## 4. Estado Final y Resultados de la Auditoría Post-Implementación

- **Aislamiento Firebase:** Resuelto. `G.FIREBASE_CONFIG = null`, persistencia local `localStorage` 100% autónoma.
- **Service Worker en Local:** Resuelto. `main.js` desregistra automáticamente en `localhost` y `dev.html`, evitando caché obsoleto.
- **Suite de Pruebas Unitarias (`tests/unit.test.js`):** 14/14 pruebas superadas (Pokédex, tipos, matemáticas vectoriales, balance desacoplado, 4 registros extensibles, persistencia DB).
- **Simulación de 10 Minutos (`tests/gameplay-sim.test.js`):** 3/3 iniciales superados (Bulbasaur, Charmander, Squirtle) con 18,000 pasos de física cada uno, 0 NaNs, subida de niveles, aparición de jefes y transiciones de bioma.
- **Pruebas Visuales y E2E (`tests/browser.test.js`):** 7/7 pasos completados sin errores de consola en Chromium headless; capturas generadas en escritorio (1280x720) y móvil horizontal (844x390).
- **Empaquetado de Producción (`tools/build.js`):** Build generado con éxito (`js/app.min.js`, 934 KB), verificado contra `index.html` funcionando idénticamente a `dev.html`.


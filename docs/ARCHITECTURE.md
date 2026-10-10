# Arquitectura del Sistema: PokéSurvivor Local Edition

Este documento describe la arquitectura técnica, límites de subsistemas, flujo de datos y modelo de extensibilidad de **PokéSurvivor Local Edition**.

---

## 1. Principios de Diseño y Filosofía Arquitectónica

1. **Vanilla Web Nativo:**
   - Sin dependencias de frameworks pesados (React, Vue, Phaser o Unity). La arquitectura utiliza ES2020 puro, HTML5 Canvas 2D y CSS3 nativo.
2. **Namespace Global Modular (`window.G`):**
   - Todos los subsistemas se organizan bajo el objeto global `G`, encapsulando módulos mediante IIFE (*Immediately Invoked Function Expressions*) y clases estándar.
3. **Aislamiento Offline Total:**
   - 100% independiente de servicios en la nube externos. Las configuraciones remotas de Firebase se anulan en local (`G.FIREBASE_CONFIG = null`), apoyándose en un backend de persistencia puramente local sobre `localStorage`.
4. **Desacoplamiento Basado en Datos:**
   - La lógica del motor de combate, generación procedural y bucle de juego está desacoplada de los datos duros mediante una capa de registros declarativos (`G.PokemonRegistry`, `G.MoveRegistry`, `G.StageRegistry`, `G.ModeRegistry`, `G.Balance`).

---

## 2. Diagrama de Arquitectura de Capas

```
+-------------------------------------------------------------------------+
|                              CAPA DE ENTRADA                            |
|             dev.html (Desarrollo)   /   index.html (Producción)          |
+-------------------------------------------------------------------------+
                                     |
+------------------------------------+------------------------------------+
|                                    |                                    |
v                                    v                                    v
+------------------+       +-------------------+       +------------------+
|    CAPA UI       |       |  CAPA EXTENSIÓN   |       |    CAPA CORE     |
| - HUD (Canvas 2D)|       | - PokemonRegistry |       | - G.U (Math/Vec) |
| - Pantallas DOM  |       | - MoveRegistry    |       | - G.DB (Storage) |
| - Modales Menú   |       | - StageRegistry   |       | - G.Audio (Synth)|
| - Input & Touch  |       | - ModeRegistry    |       | - G.Sprites      |
| - G.I18n         |       | - G.Balance       |       | - G.Camera       |
+------------------+       +-------------------+       +------------------+
         |                           |                          |
         +---------------------------+--------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                            CAPA DE SISTEMAS                             |
|  - G.Combat (15 Familias)    - G.Spawner (Hordas & Jefes)                |
|  - G.EnemyMgr (Grid espacial)- G.LevelUp (Cartas & Evoluciones)         |
|  - G.World (Autotiling)      - G.Hazards & G.Rift (Eventos & Arenas)    |
|  - G.Path (Navegación)       - G.Weather (Climas & Multiplicadores)     |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                           CAPA DE ENTIDADES                             |
|  - G.Player       - G.Enemy       - G.Projectile (Swept Collision)      |
|  - G.Pickups      - G.FX / VFX    - G.Animator                          |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                             CAPA DE DATOS                               |
|  - Pokedex (966)   - Moves (15 Familias)  - Starters    - Enemies       |
|  - Upgrades        - Items                - Missions    - Types (Suave) |
+-------------------------------------------------------------------------+
```

---

## 3. Descripción de Capas y Subsistemas

### 3.1 Capa Core (`js/core/`)
- **`util.js` (`G.U`):** Operaciones vectoriales (`dist2`, `norm`, `clamp`, `lerp`, `damp`), generador pseudoaleatorio determinista (PRNG) y constantes de tipos elementales.
- **`firebase-config.js`:** En la edición local, define `G.FIREBASE_CONFIG = null` para garantizar el aislamiento absoluto del proyecto original del autor.
- **`db.js` (`G.DB`):** Abstracción de persistencia. En ausencia de Firebase, opera en `mode = 'local'`, guardando cuentas locales y estados en `localStorage` bajo claves `ps.accounts` y `ps.save.<user>`.
- **`audio.js` (`G.Audio`):** Motor de audio sintetizado procedural con la API Web Audio nativa y partituras en código (`music.js`), eliminando la necesidad de archivos MP3/OGG externos.
- **`sprites.js` (`G.Sprites`):** Cargador y animador de hojas de sprites PMD. Incorpora resolución tolerante a fallos (`resolveDex`): si faltan recursos para un Pokémon o su variante shiny, aplica fallback a Pikachu (#25) o a la versión no-shiny sin quebrar la ejecución.
- **`camera.js` (`G.Camera`):** Cámara 2D con seguimiento suave (*damped follow*), zoom dinámico y sacudida de impacto (*screen shake*).

### 3.2 Capa de Extensión (`js/core/registry.js` & `js/data/balance.js`)
- **`G.PokemonRegistry`:** Permite registrar, consultar y validar definiciones de Pokémon personalizadas, integrando metadatos y políticas de respaldo de recursos.
- **`G.MoveRegistry`:** Centraliza las 15 familias de combate existentes y permite inyectar nuevas mecánicas o ataques por configuración.
- **`G.StageRegistry`:** API declarativa para biomas y escenarios procedurales (tilesets, música, climas, pozas de enemigos).
- **`G.ModeRegistry`:** Ciclo de vida modular para modos de juego independientes (`classic`, `boss-rush`, `time-attack`).
- **`G.Balance`:** Parámetros desacoplados de dificultad, curvas de experiencia (`playerXp`), frecuencia de aparición de enemigos y factores de escala.

### 3.3 Capa de Sistemas y Combate (`js/systems/`)
- **`combat.js` (`G.Combat`):** Motor de combate en tiempo real. Gestiona auto-apuntado, recargas, efectividad de tipos elementales (tabla suavizada de PokéSurvivor: ×1.6 muy eficaz, ×0.6 poco eficaz, ×0.3 inmune) y resolución de daño.
- **Detección de Colisiones Swept:** En proyectiles de alta velocidad, se calcula la distancia continua entre el segmento recorrido durante el fotograma y la posición del enemigo (`segDist2`), impidiendo el fenómeno de *tunneling* (atravesar objetivos sin colisionar).
- **`spawner.js` (`G.Spawner`):** Gestión de hordas de enemigos, pozas dinámicas por tiempo y aparición de jefes cada 3 minutos.
- **`enemy.js` / `EnemyMgr`:** Malla espacial optimizada (*spatial hash grid*) para acelerar consultas de colisión entre proyectiles y cientos de enemigos simultáneos.
- **`world.js` (`G.World`):** Generador procedural infinito basado en ruido determinista con autotiling automático de bordes (hierba, tierra, agua, lava, hielo).

### 3.4 Capa de Renderizado e Interfaz (`js/ui/` & `js/game.js`)
- **Bucle de Juego:** Basado en `requestAnimationFrame` con paso de tiempo delta acotado (`Math.min(1/30, dt)`) para garantizar una física estable independiente de la tasa de refresco del monitor.
- **HUD Integrado en Canvas:** El renderizador de interfaz (`G.HUD.draw`) dibuja la barra de experiencia superior, salud, nivel, retratos y hotbar directamente sobre el canvas de 2D en espacio de pantalla, garantizando rendimiento de 60 FPS sin saturar el árbol DOM.
- **Modales HTML:** Pantallas de pausa, menú principal, selección de iniciales y gacha se superponen como capas CSS (`.scr.dim`) con transición suave.

---

## 4. Persistencia Local y Esquema de Datos

Todos los progresos se almacenan localmente en el navegador (`localStorage`):
- `ps.accounts`: Objeto con las credenciales locales de usuarios registrados (`{ username: { passHash, created } }`).
- `ps.save.<user>`: Estado serializado completo del usuario:
  - `coins`: Monedas acumuladas.
  - `tickets`: Tickets normales y tickets ×10 del gacha.
  - `starter`: Inicial seleccionado.
  - `partner`: Compañero activo.
  - `owned`: Diccionario de Pokémon desbloqueados y shinies (`{ dex: { count, shiny } }`).
  - `upgrades`: Mejoras permanentes adquiridas en el árbol pasivo.
  - `stats`: Récords históricos (mejor tiempo, nivel máximo, enemigos derrotados, partidas jugadas).

---

## 5. Proceso de Empaquetado y Distribución

El empaquetado se realiza con `tools/build.js`:
1. Lee `dev.html` y extrae la lista de scripts delimitada entre `<!-- scripts:begin -->` y `<!-- scripts:end -->` (65 archivos JavaScript en orden estricto de dependencias).
2. Concatena los scripts y aplica minificación mediante Terser (`terser.minify`).
3. Escribe el archivo comprimido `js/app.min.js`.
4. Genera `index.html`, sustituyendo la lista de scripts por un único tag `<script defer src="js/app.min.js"></script>`.

Ambas versiones (`dev.html` para desarrollo e `index.html` para producción) son 100% autónomas, locales y operan sin conexión.

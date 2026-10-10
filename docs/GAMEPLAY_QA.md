# Reporte de Aseguramiento de Calidad y Gameplay (QA)
**Proyecto:** PokéSurvivor Local Edition  
**Fecha:** 10 de octubre de 2026  
**Rama:** `local-edition`  
**Entorno de Pruebas:** Node.js v20.20.2 / Chromium 1248 Headless / Mac ARM64  

---

## 1. Resumen Ejecutivo de Pruebas

Se diseñó e implementó una batería exhaustiva de pruebas automáticas y manuales estructuradas en tres niveles:
1. **Pruebas Unitarias de Subsistemas (`tests/unit.test.js`):** 14/14 tests pasando (100%).
2. **Simulación de Partida Real de 10 Minutos (`tests/gameplay-sim.test.js`):** 3/3 iniciales superados (Bulbasaur, Charmander, Squirtle) a lo largo de 600 segundos simulados (18,000 pasos de física cada uno), verificando auto-ataque, colisiones continuas, subidas de nivel, recolección de orbes, aparición de jefes y transiciones de bioma sin NaNs ni fallos de memoria.
3. **Pruebas E2E y de Integración Visual en Navegador (`tests/browser.test.js`):** Flujo completo verificado en Chromium real en resoluciones de escritorio (1280×720) y móvil horizontal (844×390), capturando 6 estados gráficos en `tests/screenshots/`.

---

## 2. Validación de Familias de Movimientos (15 Familias)

En PokéSurvivor, todos los movimientos pertenecen a familias de comportamiento gestionadas por `js/systems/combat.js` y `js/data/moves.js`, ahora accesibles también mediante la arquitectura extensible `G.MoveRegistry`.

| Familia | Tipo de Mecánica | Ejemplo | Comportamiento y Verificación |
|---|---|---|---|
| `projectile` | Proyectil balístico | Ember, Water Gun | Comprobado con colisión de segmento continuo (`segDist2`). No atraviesa enemigos en alta velocidad. |
| `melee` | Área frontal / barrido | Scratch, Tackle, Vine Whip | Inflige daño en arco frontal con empuje (knockback) y sonido según tipo elemental. |
| `beam` | Rayo continuo o haz | Solar Beam, Ice Beam | Penetra objetivos en línea recta; daño aplicado por intervalo sin bloqueos. |
| `orbit` | Satélites giratorios | Rollout, Electro Ball | Gira alrededor del jugador a distancia fija, colisionando con enemigos próximos. |
| `nova` | Expansión omnidireccional | Explosion, Earthquake | Onda expansiva circular que golpea a todos los enemigos en radio creciente. |
| `aura` | Daño constante en radio | Spore, Poison Powder | Daño por segundo a cualquier enemigo dentro de la distancia de influencia del jugador. |
| `buff` | Modificador de estadísticas | Dragon Dance, Swords Dance | Incrementa ataque, velocidad o regeneración con duración y efectos de partículas. |
| `boomerang` | Proyectil de ida y vuelta | Bonemerang, Razor Leaf | Viaja hasta alcance máximo y retorna a la posición dinámica del jugador. |
| `chain` | Rayo encadenado | Thunderbolt, Spark | Salta entre enemigos adyacentes hasta un número máximo de rebotes. |
| `mine` | Trampa en el suelo | Stealth Rock, Spikes | Permanece inerte hasta que un enemigo la pisa o expira el temporizador de vida. |
| `meteor` | Impacto de área demorado | Draco Meteor, Rock Slide | Indicador visual telégrafo circular previo al impacto destructivo. |
| `turret` | Invocación estática | Magnet Rise, Seed Bomb | Genera un punto de disparo autónomo que ataca a enemigos cercanos. |
| `dash` | Desplazamiento ofensivo | Quick Attack, Flame Charge | Embestida veloz en dirección del movimiento con invulnerabilidad temporal. |
| `trail` | Rastro de daño continuo | Toxic Spikes, Fire Spin | Deja charcos dañinos tras los pasos del jugador sin saturar audio. |
| `cone` | Disparo en abanico | Flamethrower, Blizzard | Arco angular frontal que golpea a grupos concentrados. |

---

## 3. Simulación de Gameplay Extendido (10 Minutos)

Se ejecutó una prueba de simulación física acelerada equivalente a 10 minutos (600 s) por cada uno de los tres iniciales canónicos, usando `tests/gameplay-sim.test.js` con semillas fijas:

### 3.1 Resultados por Inicial

#### Bulbasaur (Planta/Veneno — #1)
- **Ataque inicial:** Vine Whip (Látigo Cepa - Familia `melee`)
- **Pasos de física ejecutados:** 18,000 pasos (30 FPS fijos)
- **Tiempo real de ejecución:** 2,371 ms
- **Nivel alcanzado:** 5 (4 subidas de nivel seleccionadas)
- **Enemigos derrotados:** 16
- **Daño total infligido:** 3,964 puntos
- **Jefes enfrentados:** 3 (minutos 3, 6 y 9)
- **Biomas recorridos:** 3 biomas
- **Integridad matemática:** 0 NaNs, coordenadas finitas y acotadas.

#### Charmander (Fuego — #4)
- **Ataque inicial:** Ember (Ascuas - Familia `projectile`)
- **Pasos de física ejecutados:** 18,000 pasos (30 FPS fijos)
- **Tiempo real de ejecución:** 2,461 ms
- **Nivel alcanzado:** 16 (15 subidas de nivel seleccionadas)
- **Enemigos derrotados:** 116
- **Daño total infligido:** 10,425 puntos
- **Jefes enfrentados:** 3
- **Biomas recorridos:** 3 biomas
- **Integridad matemática:** 0 NaNs, coordenadas finitas y acotadas.

#### Squirtle (Agua — #7)
- **Ataque inicial:** Water Gun (Pistola Agua - Familia `projectile`)
- **Pasos de física ejecutados:** 18,000 pasos (30 FPS fijos)
- **Tiempo real de ejecución:** 2,803 ms
- **Nivel alcanzado:** 6 (5 subidas de nivel seleccionadas)
- **Enemigos derrotados:** 44
- **Daño total infligido:** 1,035 puntos
- **Jefes enfrentados:** 3
- **Biomas recorridos:** 3 biomas
- **Integridad matemática:** 0 NaNs, coordenadas finitas y acotadas.

---

## 4. Pruebas Visuales y E2E en Navegador Real (`tests/browser.test.js`)

Se evaluó la experiencia completa de usuario en un navegador Chromium headless sin extensiones ni proxies:

1. **Arranque y Desbloqueo de Audio:**
   - La pantalla de arranque (`#tap-start`) detecta las restricciones de Web Audio y permite desbloquear el contexto de audio con un clic limpio.
2. **Modo Invitado 100% Offline:**
   - Clic en `#btn-guest` inicializa una sesión local en `localStorage` con cuenta de invitado sin solicitar Firebase ni credenciales externas.
3. **Test de Personalidad y Elección:**
   - Se completaron las preguntas del cuestionario de personalidad (`#scr-test`), calculando afinidad de rasgos y asignando el compañero Scorbunny (#813) con pantalla de resultado (`#scr-result`).
4. **Menú Principal:**
   - Se validó el renderizado del sprite en canvas miniatura (`#menu-partner`), nombre del compañero, estado de monedas y botones de navegación.
5. **Entrada a la Mazmorra (`#game`):**
   - El canvas HTML5 de juego (`#game`) ocupa toda la pantalla disponible, escala dinámicamente según DPI (`window.devicePixelRatio`) y dibuja suelo, decoraciones, HUD de vida/nivel, y reloj.
6. **Controles y Movimiento:**
   - Se enviaron comandos de teclado (WASD). El personaje se desplazó fluidamente por el mapa sin atravesar árboles ni obstáculos del terreno.
   - Los ataques automáticos fijaron objetivos enemigos cercanos, disparando proyectiles `Ember` con sincronización de sprites.
7. **Pausa y Reanudación:**
   - Pulsar `Escape` despliega el modal de pausa (`#scr-pause`) con controles de volumen deslizables. Al pulsar "Continuar", la partida se reanuda inmediatamente.
8. **Responsividad Móvil (844×390):**
   - Se comprobó la adaptación a pantalla panorámica de smartphone. El HUD reajusta sus márgenes y no hay desbordamientos de texto ni elementos recortados.

---

## 5. Galería de Evidencias Visuales

Las capturas de pantalla generadas durante la ejecución de las pruebas se encuentran almacenadas en el directorio `tests/screenshots/`:

| Archivo | Descripción | Resolución |
|---|---|---|
| `01_starter_result.png` | Resultado del test de personalidad y asignación de compañero | 1280×720 |
| `02_main_menu.png` | Menú principal con compañero en pedestal, monedas y botones de navegación | 1280×720 |
| `03_gameplay_desktop.png` | Partida activa en PC: jugador, proyectil Ember, reloj, barra de vida y HUD | 1280×720 |
| `04_pause_screen.png` | Modal de pausa en partida con atajos de teclado y controles de volumen | 1280×720 |
| `05_mobile_landscape.png` | Vista responsiva en móvil apaisado con spawn de enemigos (Yungoos, Pikachu) | 844×390 |
| `06_production_build.png` | Pantalla de inicio de la versión compilada y empaquetada (`index.html`) | 1280×720 |

---

## 6. Rendimiento y Métricas

- **Fotogramas por segundo (FPS):** 60 FPS estables en escritorio y simulación fluida a 30 FPS en pruebas de integración física.
- **Tiempo de empaquetado (`tools/build.js`):** ~4.3 segundos para minificar 65 scripts JavaScript y generar un bundle único de 934 KB.
- **Consumo de memoria:** < 85 MB en proceso de navegador durante combate intenso con más de 80 entidades simultáneas en pantalla.
- **Túnel de proyectiles (Tunneling):** 0 casos reportados gracias a la verificación de colisión swept segment (`segDist2`).

---

## 7. Conclusión de Calidad

El juego en su versión local cumple satisfactoriamente con todos los estándares requeridos en el PDR:
- Es 100% jugable de principio a fin sin internet ni Firebase.
- Conserva la identidad visual, estética pixel art y sonido original.
- Es robusto frente a corrupciones matemáticas y errores de carga de recursos.
- Cuenta con cobertura automatizada para prevenir regresiones.

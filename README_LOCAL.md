# PokéSurvivor — Local Edition

> Versión local, autónoma, extensible y 100% libre de dependencias externas en la nube de **PokéSurvivor: Mystery Dungeon**.

---

## 1. Características Principales

- **Ejecución Local Autónoma:** Funciona en `localhost` sin necesidad de Firebase, servidores remotos ni cuentas de terceros.
- **Persistencia en `localStorage`:** Todo el progreso (colección de Pokémon, shinies, monedas, tickets, mejoras y récords) se guarda localmente en el navegador.
- **Soporte de Modo Invitado:** Comienza a jugar al instante pulsando *"Jugar como invitado"* sin necesidad de registro.
- **Arquitectura Extensible por Datos:** Registros desacoplados (`G.PokemonRegistry`, `G.MoveRegistry`, `G.StageRegistry`, `G.ModeRegistry`, `G.Balance`) para añadir nuevos Pokémon, ataques, mapas y modos de juego sin modificar el motor principal.
- **Tolerancia a Fallos y Fallback:** Si un Pokémon no tiene sprites completos en disco, el motor aplica respaldo automático a Pikachu (#25) sin interrumpir la partida.
- **Suite de Pruebas Automatizadas:** Pruebas unitarias, simulación acelerada de 10 minutos de partida con 3 iniciales y pruebas E2E visuales en navegador con Playwright.

---

## 2. Requisitos Previos

- **Python 3:** Para levantar el servidor HTTP local (Python 3.8+ recomendado).
- **Node.js (opcional para desarrollo y pruebas):** Node.js v18+ para ejecutar la suite de pruebas y el proceso de build.

---

## 3. Instrucciones de Ejecución Rápida

### Paso 1: Iniciar el Servidor Local

Abre una terminal en el directorio del proyecto y ejecuta:

```bash
python3 -m http.server 8000
```

### Paso 2: Abrir el Juego en tu Navegador

- **Versión de Desarrollo (scripts modulares):**  
  [http://localhost:8000/dev.html](http://localhost:8000/dev.html)

- **Versión de Producción (bundle único minificado):**  
  [http://localhost:8000/index.html](http://localhost:8000/index.html)

---

## 4. Controles de Juego

| Acción | Control de Teclado | Control Táctil / Móvil |
|---|---|---|
| **Moverse** | `W`, `A`, `S`, `D` o Flechas | Arrastrar dedo / Joystick virtual |
| **Cambiar Movimiento Activo** | Teclas `1`, `2`, `3`, `4` | Tocar icono del movimiento en la barra |
| **Ciclar Movimiento** | `Q` (anterior) / `E` o `Tab` (siguiente) | — |
| **Menú de Pausa** | `Escape` o tecla `P` | Tocar botón de pausa superior |
| **Elegir Carta de Mejora** | Teclas `1`, `2`, `3` | Tocar la carta deseada |

---

## 5. Ejecución de Pruebas Automatizadas

El proyecto incluye 3 suites de pruebas para garantizar estabilidad y regresión cero:

### 1. Pruebas Unitarias
Valida la Pokédex, iniciales, tabla de tipos elementales suavizada, matemáticas vectoriales, balance numérico y los 4 registros de contenido:
```bash
node tests/unit.test.js
```

### 2. Simulación de Gameplay Extendido (10 Minutos)
Ejecuta 600 segundos de simulación acelerada (18,000 pasos de física cada una) con Bulbasaur, Charmander y Squirtle. Verifica colisiones continuas, daño, subidas de nivel, jefes y ausencia de NaNs:
```bash
node tests/gameplay-sim.test.js
```

### 3. Pruebas Visuales y E2E en Navegador (Playwright)
Ejecuta un navegador Chromium real, verifica el flujo desde el login hasta la partida, captura estados de pantalla en escritorio y móvil apaisado, y comprueba que no haya errores de consola:
```bash
node tests/browser.test.js
```
*(Las capturas generadas se guardan en `tests/screenshots/`)*.

---

## 6. Proceso de Compilación / Build

Para empaquetar los 65 scripts modulares de `dev.html` en el archivo de producción optimizado `js/app.min.js`:

```bash
node tools/build.js
```

---

## 7. Documentación Técnica

- [docs/LOCAL_AUDIT.md](docs/LOCAL_AUDIT.md): Diagnóstico inicial, riesgos detectados y estado post-implementación.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): Diagrama de capas, ciclo de vida, sistemas de combate y persistencia.
- [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md): Guía práctica con ejemplos de código para registrar nuevos Pokémon, movimientos, biomas y modos.
- [docs/GAMEPLAY_QA.md](docs/GAMEPLAY_QA.md): Reporte de aseguramiento de calidad, validación de las 15 familias de ataque y métricas de rendimiento.

---

## 8. Licencia y Créditos

- Proyecto fan sin ánimo de lucro basado en el universo Pokémon © Nintendo / Creatures Inc. / GAME FREAK inc.
- Sprites proporcionados por la comunidad de [SpriteCollab](https://github.com/PMDCollab/SpriteCollab) (CC BY-NC 4.0).
- Datos de Pokédex derivados de [PokeAPI](https://pokeapi.co/).
- Fuente pixel: Pixelify Sans (SIL Open Font License).

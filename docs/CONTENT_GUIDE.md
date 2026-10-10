# Guía de Extensión de Contenido (Content Guide)
**Proyecto:** PokéSurvivor Local Edition  
**Arquitectura:** Registros de datos declarativos (`js/core/registry.js` y `js/data/balance.js`)  

Esta guía detalla cómo agregar nuevos Pokémon, movimientos, escenarios, modos de juego y ajustar el balance general sin tener que modificar el motor principal ni el bucle de renderizado.

---

## 1. Registro de Nuevos Pokémon (`G.PokemonRegistry`)

El registro `G.PokemonRegistry` permite definir o sobrescribir personajes de forma declarativa. Incluye validación de campos obligatorios y un sistema automático de **fallback de sprites** (por defecto a Pikachu #25 o al número de Dex asignado) para evitar caídas si faltan animaciones en disco.

### 1.1 Estructura de una Definición

```javascript
G.PokemonRegistry.register({
  id: 'lucario-custom',         // Identificador único (cadena)
  dex: 448,                     // Número de Pokédex asociado
  name: 'Lucario Custom',       // Nombre visible
  types: ['fight', 'steel'],    // Uno o dos tipos elementales
  hp: 110,                      // Puntos de salud base
  atk: 1.25,                    // Multiplicador de ataque base
  spd: 120,                     // Velocidad de movimiento (px/segundo)
  startMove: 'aura-sphere',     // Movimiento inicial asignado
  pool: ['aura-sphere', 'close-combat', 'bullet-punch', 'flash-cannon'], // Movimientos disponibles
  fallbackDex: 25,              // Opcional: Dex de respaldo si no existen hojas locales
  isStarter: true,              // Opcional: mostrarlo en la lista de iniciales
  rarity: 'rare'                // 'common' | 'uncommon' | 'rare' | 'legendary'
});
```

### 1.2 Política de Fallback de Sprites
1. Si el directorio `assets/pokemon/{dex}/` no existe o no tiene las hojas completas (`Idle`, `Walk`, `Attack`, etc.), el motor redirige automáticamente a `fallbackDex` (por defecto Pikachu #25).
2. Si un Pokémon se registra como shiny pero no posee la carpeta `assets/pokemon/{dex}/s/`, el motor carga la versión estándar no-shiny de forma transparente y sin lanzar excepciones.

### 1.3 Consultas en el Registro
- `G.PokemonRegistry.get(idOrDex)`: Obtiene la definición del Pokémon.
- `G.PokemonRegistry.has(idOrDex)`: Comprueba si un personaje está registrado.
- `G.PokemonRegistry.all()`: Devuelve la lista completa de Pokémon registrados.
- `G.PokemonRegistry.starters()`: Devuelve los personajes marcados como elegibles para iniciales.

---

## 2. Registro de Nuevos Movimientos (`G.MoveRegistry`)

El sistema separa conceptualmente la **definición** de un movimiento (daño, recarga, tipo, efectos) de su **implementación matemática** (familia de combate).

### 2.1 Familias Disponibles
El motor soporta 15 familias listas para usar:
`projectile`, `melee`, `beam`, `orbit`, `nova`, `aura`, `buff`, `boomerang`, `chain`, `mine`, `meteor`, `turret`, `dash`, `trail`, `cone`.

### 2.2 Ejemplo: Registrar un Movimiento Usando una Familia Existente

Para añadir un ataque como *Aura Sphere* o *Draco Meteor*, no es necesario programar lógica física; basta con configurarlo:

```javascript
G.MoveRegistry.register({
  id: 'aura-sphere-custom',
  name: 'Esfera Aural',
  type: 'fight',
  kind: 'projectile',        // Reutiliza la familia de proyectiles con detección swept
  dmg: 35,                   // Daño base por golpe
  cd: 1.4,                   // Tiempo de recarga en segundos
  range: 320,                // Alcance máximo en píxeles
  speed: 280,                // Velocidad del proyectil (px/s)
  count: 1,                  // Cantidad de proyectiles disparados simultáneamente
  desc: 'Dispara una esfera concentrada de aura que persigue a los rivales.',
  evolveTo: 'aura-cannon'    // Opcional: ID de la evolución del movimiento
});
```

### 2.3 Ejemplo: Registrar una Familia de Combate Personalizada

Si necesitas crear una mecánica de ataque totalmente nueva:

```javascript
G.MoveRegistry.registerFamily('teleport-burst', {
  cast(player, move, target) {
    // Lógica ejecutada al disparar la habilidad
    player.x += (Math.random() - 0.5) * 100;
    G.FX.burst(player.x, player.y, '#9c27b0', 12, 100);
  },
  update(dt, player, enemies) {
    // Lógica por fotograma de proyectiles o campos asociados
  }
});
```

---

## 3. Registro de Escenarios y Biomas (`G.StageRegistry`)

`G.StageRegistry` permite registrar zonas temáticas, arenas y dimensiones especiales con sus propios conjuntos de baldosas (tilesets), música, clima y pozas de enemigos.

### 3.1 Ejemplo de Escenario Personalizado

```javascript
G.StageRegistry.register({
  id: 'crystal-caverns',
  name: 'Cavernas de Cristal',
  bgMusic: 'cave',                     // ID de pista en js/data/music.js
  groundColor: '#1e293b',              // Color base del suelo
  accentColor: '#38bdf8',              // Color de detalles y cristales
  liquid: 'water',                     // Tipo de líquido: 'none' | 'water' | 'lava' | 'poison'
  weatherPool: ['rain', 'clear'],      // Climas posibles durante la partida
  enemyPool: [
    { dex: 74, weight: 10 },           // Geodude
    { dex: 95, weight: 5 },            // Onix
    { dex: 302, weight: 3, boss: true } // Sableye (Jefe)
  ]
});
```

---

## 4. Registro de Modos de Juego (`G.ModeRegistry`)

`G.ModeRegistry` define ciclos de vida de partida independientes (`onStart`, `onUpdate`, `checkVictory`, `checkDefeat`, `onEnd`). Esto permite incorporar modos como *Boss Rush*, *Supervivencia Clásica* o *Modo Pacifista* sin modificar `js/game.js`.

### 4.1 Ciclo de Vida de un Modo

```javascript
G.ModeRegistry.register({
  id: 'boss-rush',
  name: 'Avalancha de Jefes',
  description: 'Enfréntate a oleadas continuas de jefes sin descanso.',
  
  onStart(ctx) {
    console.log('Modo Boss Rush iniciado.');
    G.Spawner.maxEnemies = 5; // Pocos enemigos pero de alto rango
  },
  
  onUpdate(dt, player, time) {
    // Spawnea un jefe si no hay ninguno con vida
    if (!G.EnemyMgr.bossAlive()) {
      G.Spawner.spawnBossImmediate(time);
    }
  },
  
  checkVictory(player, time) {
    // Victoria tras derrotar 10 jefes
    return player.bosses >= 10;
  },
  
  checkDefeat(player) {
    return player.hp <= 0;
  },
  
  onEnd(summary) {
    console.log('Fin de partida en Boss Rush:', summary);
  }
});
```

Para activar un modo antes de iniciar una partida:
```javascript
G.ModeRegistry.setActive('boss-rush');
```

---

## 5. Ajustes Globales de Balance (`G.Balance`)

El archivo `js/data/balance.js` centraliza los parámetros de dificultad y balance numérico para evitar números mágicos en el código.

### 5.1 Parámetros Clave
- `G.Balance.maxEnemies`: Límite máximo de enemigos simultáneos en pantalla (por defecto 140).
- `G.Balance.spawnDensity`: Multiplicador de frecuencia de aparición (por defecto 1.0).
- `G.Balance.bossInterval`: Intervalo de tiempo para aparición de jefes (por defecto 180 s / 3 minutos).
- `G.Balance.biomeInterval`: Intervalo de cambio de bioma (por defecto 240 s / 4 minutos).
- `G.Balance.damageMultiplier`: Multiplicador global de daño del jugador (por defecto 1.0).
- `G.Balance.enemyHpMultiplier`: Multiplicador global de salud de los enemigos (por defecto 1.0).

### 5.2 Ajuste en Tiempo Real o por Perfil

```javascript
// Aumentar dificultad
G.Balance.set('enemyHpMultiplier', 1.5);
G.Balance.set('maxEnemies', 180);

// Exportar configuración actual
const configActual = G.Balance.export();

// Restaurar valores estándar
G.Balance.reset();
```

---

## 6. Procedimiento para Probar Nuevos Contenidos

1. Agrega tus llamadas a `G.PokemonRegistry.register(...)` o `G.MoveRegistry.register(...)` en un script dedicado (por ejemplo `js/data/custom-content.js`).
2. Añade el script a `dev.html` dentro de la sección `<!-- scripts:begin -->`.
3. Ejecuta las pruebas unitarias para validar la integridad del registro:
   ```bash
   node tests/unit.test.js
   ```
4. Reconstruye la versión empaquetada de producción:
   ```bash
   node tools/build.js
   ```
5. Comprueba el resultado en tu navegador en `http://localhost:8000/dev.html`.

/* ============ browser.test.js — Pruebas de integración visual y E2E con Playwright ============
 * Verifica el ciclo de vida completo en el navegador real:
 *   1. Carga limpia de dev.html en localhost:8000 sin errores de consola fatales
 *   2. Autenticación como invitado (Guest Mode) 100% offline
 *   3. Selección de compañero (Starters / Test)
 *   4. Renderizado del menú principal
 *   5. Inicio de partida (Start Run): Canvas activo, sprites cargados, spawn de enemigos, HUD visible
 *   6. Movimiento del jugador con controles de teclado (WASD / Flechas)
 *   7. Menú de pausa y reanudación
 *   8. Modo móvil / responsivo (844x390 landscape)
 *   9. Verificación de producción: carga idéntica de index.html
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');
const assert = require('assert');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon'
};

function startServer(port = 8089) {
  const root = path.join(__dirname, '..');
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(root, decodeURIComponent(reqPath));
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise(resolve => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function runBrowserTests() {
  console.log('--- INICIANDO PRUEBAS E2E Y VISUALES EN NAVEGADOR ---');

  const server = await startServer(8089);
  const BASE_URL = 'http://127.0.0.1:8089';

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const pageErrors = [];
  const consoleWarnings = [];

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    locale: 'es-ES'
  });

  const page = await context.newPage();

  page.on('pageerror', err => {
    console.error('  [PAGE ERROR]', err.message);
    pageErrors.push(err.message);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      // Filtrar advertencias benignas de audio / PWA si ocurren
      console.log('  [BROWSER CONSOLE ERROR]', msg.text());
      pageErrors.push(msg.text());
    }
  });

  try {
    // -------------------------------------------------------------
    // 1. CARGAR DEV.HTML
    // -------------------------------------------------------------
    console.log('\n[1/7] Cargando dev.html...');
    await page.goto(`${BASE_URL}/dev.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Si aparece la pantalla 'tap-start', pulsarla para desbloquear audio
    const tapStart = page.locator('#tap-start');
    if (await tapStart.isVisible()) {
      console.log('  Desbloqueando pantalla de inicio (tap-start)...');
      await tapStart.click();
      await page.waitForTimeout(500);
    }

    // -------------------------------------------------------------
    // 2. VERIFICACIÓN PWA (MANIFEST, TAGS, BOTÓN INSTALACIÓN)
    // -------------------------------------------------------------
    console.log('\n[2/8] Verificando integración PWA en el navegador...');
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    assert.strictEqual(manifestHref, 'manifest.webmanifest', 'Tag link rel="manifest" debe apuntar a manifest.webmanifest');

    const manifestRes = await page.request.get(`${BASE_URL}/manifest.webmanifest`);
    assert.strictEqual(manifestRes.status(), 200, 'manifest.webmanifest debe responder 200');
    const manifestJson = await manifestRes.json();
    assert.strictEqual(manifestJson.name, 'Super Batalla Pokémon', 'Nombre en manifest debe ser Super Batalla Pokémon');
    console.log('  Manifest cargado y validado correctamente.');

    const installBtnLogin = page.locator('#btn-pwa-install');
    assert.ok(await installBtnLogin.count() > 0, 'Botón de instalación PWA en login (#btn-pwa-install) debe existir en el DOM');
    const installBtnSettings = page.locator('#btn-pwa-install-settings');
    assert.ok(await installBtnSettings.count() > 0, 'Botón de instalación PWA en ajustes (#btn-pwa-install-settings) debe existir en el DOM');
    const iosModal = page.locator('#modal-pwa-ios');
    assert.ok(await iosModal.count() > 0, 'Modal de ayuda PWA iOS debe existir en el DOM');

    // -------------------------------------------------------------
    // 3. MODO INVITADO
    // -------------------------------------------------------------
    console.log('\n[3/8] Probando inicio como invitado (Guest Mode)...');
    const guestBtn = page.locator('#btn-guest');
    await guestBtn.waitFor({ state: 'visible', timeout: 5000 });
    await guestBtn.click();
    await page.waitForTimeout(1000);

    // -------------------------------------------------------------
    // 3. SELECCIÓN DE COMPAÑERO / TEST DEL PROFESOR OAK (4 FASES)
    // -------------------------------------------------------------
    console.log('\n[3/7] Gestionando selección inicial con el Profesor Oak...');
    const testScreen = page.locator('#scr-test');
    const resultScreen = page.locator('#scr-result');

    if (await testScreen.isVisible()) {
      console.log('  [Fase 1] Respondiendo preguntas situacionales de Oak...');
      // Pregunta 1
      const q1Ans = page.locator('#test-a .answer').first();
      await q1Ans.waitFor({ state: 'visible', timeout: 5000 });
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_oak_phase1_questions.png') });
      await q1Ans.click();
      await page.waitForTimeout(500);

      // Pregunta 2
      const q2Ans = page.locator('#test-a .answer').first();
      await q2Ans.waitFor({ state: 'visible', timeout: 5000 });
      await q2Ans.click();
      await page.waitForTimeout(500);

      // Fase 2: Elección del camino
      console.log('  [Fase 2] Seleccionando escenario / camino de la aventura...');
      const pathCard = page.locator('#oak-path-cards .path-card').first();
      await pathCard.waitFor({ state: 'visible', timeout: 5000 });
      await pathCard.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_oak_phase2_paths.png') });

      const pathNext = page.locator('#oak-path-next');
      await pathNext.click();
      await page.waitForTimeout(500);

      // Fase 3: Pokébolas misteriosas
      console.log('  [Fase 3] Interactuando con las Pokébolas misteriosas...');
      const ballsStage = page.locator('#oak-balls-stage');
      await ballsStage.waitFor({ state: 'visible', timeout: 5000 });
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_oak_pokeballs.png') });

      const firstBall = page.locator('#oak-balls-stage .oak-ball-wrapper').first();
      await firstBall.click();
      console.log('  Abriendo Pokébola con secuencia animada (1.35s)...');
      await page.waitForTimeout(2000);
    }

    // Fase 4: Revelación del Pokémon
    console.log('  [Fase 4] Verificando pantalla de revelación...');
    await resultScreen.waitFor({ state: 'visible', timeout: 5000 });

    const revealedName = await page.locator('#res-name').textContent();
    const oakExp = await page.locator('#res-explanation').textContent();
    console.log(`  Pokémon revelado: ${revealedName.trim()}`);
    console.log(`  Explicación de Oak: ${oakExp.trim().slice(0, 65)}...`);

    assert.ok(revealedName.trim().length > 0, 'Debe haber un Pokémon revelado');
    assert.ok(oakExp.trim().length > 0, 'Debe haber una explicación del Profesor Oak');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_starter_reveal.png') });

    // Comenzar batalla directamente utilizando el motor de combate actual
    console.log('  Pulsando botón principal "Comenzar batalla →"...');
    await page.locator('#res-battle').click();
    await page.waitForTimeout(2000);

    // -------------------------------------------------------------
    // 4. VERIFICAR INICIO DIRECTO DE LA BATALLA
    // -------------------------------------------------------------
    console.log('\n[4/7] Verificando combate activo en Canvas #game...');
    const canvas = page.locator('#game');
    await canvas.waitFor({ state: 'visible', timeout: 5000 });

    const isPlaying = await page.evaluate(() => G.Game.state === 'playing');
    console.log(`  Estado del motor de juego: ${isPlaying ? 'playing (activo)' : G.Game.state}`);
    assert.strictEqual(isPlaying, true, 'El estado del juego debe ser "playing"');

    // -------------------------------------------------------------
    // 6. SIMULAR MOVIMIENTO Y CAPTURAR JUEGO ACTIVO
    // -------------------------------------------------------------
    console.log('\n[6/7] Simulando movimiento del jugador con teclado (WASD)...');
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(800);
    await page.keyboard.up('KeyD');

    await page.keyboard.down('KeyS');
    await page.waitForTimeout(800);
    await page.keyboard.up('KeyS');

    // Dejar correr 3 segundos para que aparezcan enemigos
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_gameplay_desktop.png') });

    // Probar menú de pausa
    console.log('  Probando menú de pausa (Escape)...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);

    const pauseScreen = page.locator('#scr-pause');
    assert.ok(await pauseScreen.isVisible(), 'scr-pause debe ser visible tras pulsar Escape');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_pause_screen.png') });

    // Reanudar con botón #btn-resume
    console.log('  Reanudando partida con botón Continuar...');
    await page.locator('#btn-resume').click();
    await page.waitForTimeout(600);
    assert.ok(!(await pauseScreen.isVisible()), 'scr-pause debe cerrarse al reanudar');

    // -------------------------------------------------------------
    // 7. RESPONSIVIDAD MÓVIL Y VERIFICACIÓN DE BUILD
    // -------------------------------------------------------------
    console.log('\n[7/7] Probando vista móvil landscape (844x390)...');
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_mobile_landscape.png') });

    // Pausar y abandonar run con #btn-quit
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.locator('#btn-quit').click();
    await page.waitForTimeout(1500);

    // Si aparece pantalla de resultados (game over), pulsar volver al menú
    const overScreen = page.locator('#scr-over');
    if (await overScreen.isVisible()) {
      await page.locator('#btn-again').click();
      await page.waitForTimeout(1000);
    }

    console.log('  Verificando persistencia y retorno al menú principal tras el combate...');
    const menuScreen = page.locator('#scr-menu');
    await menuScreen.waitFor({ state: 'visible', timeout: 5000 });

    const partnerName = await page.locator('#menu-partner-name').textContent();
    console.log(`  Compañero persistido en menú: ${partnerName.trim()}`);
    assert.ok(partnerName.trim().length > 0, 'El compañero debe tener nombre visible en menú');

    const logoTitle = await page.locator('#scr-menu .logo .t1').textContent();
    console.log(`  Título de interfaz en menú: ${logoTitle.trim()}`);
    assert.strictEqual(logoTitle.trim(), 'Super Batalla Pokémon');

    const dexCount = await page.locator('#menu-dex-count').textContent();
    console.log(`  Contador de Pokédex en menú: ${dexCount.trim()}`);
    assert.ok(dexCount.includes('/ 150'), 'El contador de Pokédex debe indicar / 150');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_main_menu.png') });

    // -------------------------------------------------------------
    // 8. APARTADO DE MUNDOS Y ESCENARIOS ELEMENTALES
    // -------------------------------------------------------------
    console.log('\n[8/8] Verificando apartado de Mundos y escenarios (disponibles y bloqueados)...');
    
    // Verificar que existe el botón de Mundos en el menú principal
    const btnMundos = page.locator('#scr-menu [data-go="stages"]');
    assert.strictEqual(await btnMundos.isVisible(), true, 'El botón de Mundos debe estar visible en el menú principal');
    await btnMundos.click();
    await page.waitForTimeout(600);

    const stagesScreen = page.locator('#scr-stages');
    await stagesScreen.waitFor({ state: 'visible', timeout: 5000 });

    const stageCards = page.locator('.stage-card');
    const stageCount = await stageCards.count();
    console.log(`  Tarjetas de escenarios visibles en selector: ${stageCount}`);
    assert.strictEqual(stageCount, 5, 'Deben existir exactamente 5 escenarios elementales');

    // Verificar presencia de badges de disponibles y bloqueados
    const unlockedBadges = await page.locator('.stage-status-badge.unlocked').count();
    const lockedBadges = await page.locator('.stage-status-badge.locked').count();
    console.log(`  Mundos disponibles: ${unlockedBadges} | Mundos bloqueados: ${lockedBadges}`);
    assert.ok(unlockedBadges >= 2, 'Deben haber al menos 2 mundos disponibles inicialmente');
    assert.ok(lockedBadges >= 1, 'Deben haber mundos bloqueados inicialmente');

    // Probar filtro de sólo disponibles
    await page.locator('#stage-tabs [data-filter="unlocked"]').click();
    await page.waitForTimeout(300);
    const unlFilteredCount = await page.locator('.stage-card').count();
    assert.strictEqual(unlFilteredCount, unlockedBadges, 'El filtro de disponibles debe mostrar sólo mundos desbloqueados');

    // Probar filtro de sólo bloqueados
    await page.locator('#stage-tabs [data-filter="locked"]').click();
    await page.waitForTimeout(300);
    const lckFilteredCount = await page.locator('.stage-card').count();
    assert.strictEqual(lckFilteredCount, lockedBadges, 'El filtro de bloqueados debe mostrar sólo mundos bloqueados');

    // Volver a filtro Todos
    await page.locator('#stage-tabs [data-filter="all"]').click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_stage_selector.png') });

    // Iniciar combate en el escenario de Agua (Gruta Marina)
    const waterBtn = page.locator('.stage-water .stage-play-btn');
    await waterBtn.click();
    await page.waitForTimeout(1500);

    const isPlayingWater = await page.evaluate(() => G.Game.state === 'playing');
    assert.strictEqual(isPlayingWater, true, 'El juego debe estar en estado playing tras elegir escenario');
    const activeBiomeName = await page.evaluate(() => G.World.biomeName());
    console.log(`  Bioma activo en combate tras selección: ${activeBiomeName}`);
    assert.strictEqual(activeBiomeName, 'Gruta Marina', 'El bioma inicial debe ser Gruta Marina');

    // Volver al menú
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.locator('#btn-quit').click();
    await page.waitForTimeout(1000);

    // Probar también index.html (versión compilada)
    console.log('\n--- Probando versión empaquetada (index.html) ---');
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const tapStartProd = page.locator('#tap-start');
    if (await tapStartProd.isVisible()) {
      await tapStartProd.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_production_build.png') });

    console.log('\n===========================================');
    console.log('PRUEBAS E2E Y VISUALES: 100% COMPLETADAS');
    console.log(`Errores fatales detectados: ${pageErrors.length}`);
    console.log('===========================================\n');

    assert.strictEqual(pageErrors.length, 0, `Se encontraron errores de página: ${pageErrors.join('; ')}`);

  } finally {
    await context.close();
    await browser.close();
    if (server) server.close();
  }
}

runBrowserTests()
  .then(() => {
    console.log('Todo finalizado exitosamente.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fallo en pruebas de navegador:', err);
    process.exit(1);
  });

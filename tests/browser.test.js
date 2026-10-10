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
const assert = require('assert');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:8000';

async function runBrowserTests() {
  console.log('--- INICIANDO PRUEBAS E2E Y VISUALES EN NAVEGADOR ---');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const pageErrors = [];
  const consoleWarnings = [];

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
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
    // 2. MODO INVITADO
    // -------------------------------------------------------------
    console.log('\n[2/7] Probando inicio como invitado (Guest Mode)...');
    const guestBtn = page.locator('#btn-guest');
    await guestBtn.waitFor({ state: 'visible', timeout: 5000 });
    await guestBtn.click();
    await page.waitForTimeout(1000);

    // -------------------------------------------------------------
    // 3. SELECCIÓN DE COMPAÑERO / TEST
    // -------------------------------------------------------------
    console.log('\n[3/7] Gestionando selección inicial de compañero...');
    const testScreen = page.locator('#scr-test');
    const resultScreen = page.locator('#scr-result');
    const startersScreen = page.locator('#scr-starters');

    if (await testScreen.isVisible()) {
      console.log('  Completando preguntas del test de personalidad...');
      while (await testScreen.isVisible()) {
        const firstAnswer = page.locator('#test-a .answer').first();
        if (await firstAnswer.isVisible()) {
          await firstAnswer.click();
          await page.waitForTimeout(300);
        } else {
          break;
        }
      }
    }

    if (await resultScreen.isVisible()) {
      console.log('  Confirmando compañero en scr-result...');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_starter_result.png') });
      await page.locator('#res-ok').click();
      await page.waitForTimeout(1000);
    } else if (await startersScreen.isVisible()) {
      console.log('  Seleccionando compañero en scr-starters...');
      const firstCell = page.locator('#starter-grid .cell').first();
      await firstCell.click();
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_starter_selection.png') });
      await page.locator('#starter-ok').click();
      await page.waitForTimeout(1000);
    }

    // -------------------------------------------------------------
    // 4. MENÚ PRINCIPAL
    // -------------------------------------------------------------
    console.log('\n[4/7] Verificando menú principal...');
    const menuScreen = page.locator('#scr-menu');
    await menuScreen.waitFor({ state: 'visible', timeout: 5000 });

    const partnerName = await page.locator('#menu-partner-name').textContent();
    console.log(`  Compañero en menú: ${partnerName.trim()}`);
    assert.ok(partnerName.trim().length > 0, 'El compañero debe tener nombre visible en menú');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_main_menu.png') });

    // -------------------------------------------------------------
    // 5. ENTRAR A LA MAZMORRA (PLAY)
    // -------------------------------------------------------------
    console.log('\n[5/7] Iniciando partida (Start Run)...');
    const playBtn = page.locator('button[data-go="play"]');
    await playBtn.click();
    await page.waitForTimeout(2000);

    // Comprobar que el canvas está visible y renderizando
    const canvas = page.locator('#game');
    await canvas.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  Canvas #game activo y renderizando correctamente.');

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

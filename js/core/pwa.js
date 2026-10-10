/* ============ pwa.js — Gestor de instalación PWA y compatibilidad móvil ============
 * Gestiona:
 * - Detección de modo standalone (pantalla de inicio en iOS y Android).
 * - Evento `beforeinstallprompt` en Android y Chromium.
 * - Guía modal de instalación para iOS Safari ("Añadir a pantalla de inicio").
 * - Visibilidad de botones discretos de instalación.
 */
G.PWA = (() => {
  let deferredPrompt = null;
  let isInstalled = false;

  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  function isIos() {
    const ua = (window.navigator.userAgent || '').toLowerCase();
    return /iphone|ipad|ipod/.test(ua) && !isStandalone();
  }

  function init() {
    const standalone = isStandalone();
    if (standalone) {
      document.body.classList.add('is-standalone');
      hideInstallButtons();
      return;
    }

    // Android & Chromium desktop: beforeinstallprompt
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallButtons();
    });

    // Evento tras completar instalación
    window.addEventListener('appinstalled', () => {
      isInstalled = true;
      deferredPrompt = null;
      hideInstallButtons();
      if (G.UI && G.UI.toast) {
        G.UI.toast('¡Super Batalla Pokémon instalada en tu dispositivo!');
      }
    });

    // En iOS, si no está en standalone, mostramos la opción de instalar para guiar con instrucciones
    if (isIos()) {
      showInstallButtons();
    }

    // Vinculación de botones
    wireButton('btn-pwa-install');
    wireButton('btn-pwa-install-settings');

    const iosModalClose = document.getElementById('modal-pwa-ios-close');
    if (iosModalClose) {
      iosModalClose.onclick = () => {
        const modal = document.getElementById('modal-pwa-ios');
        if (modal) modal.classList.add('hidden');
      };
    }
  }

  function wireButton(id) {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.onclick = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          hideInstallButtons();
        }
        deferredPrompt = null;
      } else if (isIos()) {
        const modal = document.getElementById('modal-pwa-ios');
        if (modal) modal.classList.remove('hidden');
      } else {
        // En navegadores que ya instalaron o no soportan el prompt programático
        if (G.UI && G.UI.toast) {
          G.UI.toast('Usa el menú de tu navegador para añadir a la pantalla de inicio');
        }
      }
    };
  }

  function showInstallButtons() {
    if (isStandalone() || isInstalled) return;
    const wrap = document.getElementById('pwa-install-wrap');
    if (wrap) wrap.classList.remove('hidden');

    const btnSet = document.getElementById('btn-pwa-install-settings');
    if (btnSet) btnSet.classList.remove('hidden');
  }

  function hideInstallButtons() {
    const wrap = document.getElementById('pwa-install-wrap');
    if (wrap) wrap.classList.add('hidden');

    const btnSet = document.getElementById('btn-pwa-install-settings');
    if (btnSet) btnSet.classList.add('hidden');
  }

  return {
    init,
    isStandalone,
    isIos,
    showInstallButtons,
    hideInstallButtons
  };
})();

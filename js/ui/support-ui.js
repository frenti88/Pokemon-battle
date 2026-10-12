/* ============ support-ui.js — donaciones retiradas ============
 * La opción de donaciones ha sido eliminada por completo.
 */
G.SupportUI = (() => {
  function init() {
    const b = document.getElementById('btn-support');
    if (b) b.remove();
    const scr = document.getElementById('scr-support');
    if (scr) scr.remove();
  }
  function open() {}
  function close() {}

  return { init, open, close };
})();

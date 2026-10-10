/* ============ firebase-config.js — conexión con tu proyecto de Firebase ============
 * Pega aquí la configuración de tu app web de Firebase (Consola de Firebase >
 * Configuración del proyecto > Tus apps > SDK setup and configuration > Config).
 * Los pasos completos están en docs/FIREBASE.md.
 *
 * Estos datos NO son secretos: Firebase los diseña para ir en la web. Lo que
 * protege las partidas son las reglas de Firestore (firestore.rules).
 *
 * Si se pone a null, el juego funciona en modo local (sólo en el navegador).
 */
// MODO LOCAL AISLADO: desactivado acceso a Firebase del autor.
// El juego opera 100% offline y en almacenamiento local (localStorage).
// Si en el futuro deseas conectar tu propio proyecto Firebase, configura las credenciales aquí.
G.FIREBASE_CONFIG = null;

/* Para conectar tu propio Firebase opcional:
G.FIREBASE_CONFIG = {
  apiKey: 'AIza...',
  authDomain: 'tu-proyecto.firebaseapp.com',
  projectId: 'tu-proyecto',
  storageBucket: 'tu-proyecto.firebasestorage.app',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abc123',
  databaseURL: 'https://tu-proyecto.europe-west1.firebasedatabase.app'
};
*/

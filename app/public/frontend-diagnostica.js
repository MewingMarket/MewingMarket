/**
 * FILE: app/public/frontend-diagnostica.js
 * Diagnostica frontend — scanner JS + test API reali
 */

(function () {
  console.log("🟦 [FRONTEND DIAGNOSTICA] Avviata");

  // Scanner sintassi JS
  const scripts = [...document.scripts].map(s => s.src).filter(Boolean);

  scripts.forEach(src => {
    fetch(src)
      .then(r => r.text())
      .then(code => {
        try {
          new Function(code);
        } catch (err) {
          console.error("🔥 ERRORE DI SINTASSI IN:", src, err);
        }
      })
      .catch(err => console.error("🔥 IMPOSSIBILE LEGGERE:", src, err));
  });

  // Test API reale
  fetch("/api/products")
    .then(r => {
      console.log("🟩 Test API /api/products →", r.status);
      return r.json().catch(() => null);
    })
    .then(data => {
      console.log("🟩 Risposta /api/products:", data);
    })
    .catch(err => console.error("🔥 ERRORE /api/products:", err));

  // Test API ordini utente
  fetch("/api/ordini/utente")
    .then(r => {
      console.log("🟩 Test API /api/ordini/utente →", r.status);
      return r.json().catch(() => null);
    })
    .then(data => {
      console.log("🟩 Risposta /api/ordini/utente:", data);
    })
    .catch(err => console.error("🔥 ERRORE /api/ordini/utente:", err));

  // Test API admin utenti
  fetch("/api/admin/utenti/lista")
    .then(r => {
      console.log("🟩 Test API /api/admin/utenti/lista →", r.status);
      return r.json().catch(() => null);
    })
    .then(data => {
      console.log("🟩 Risposta /api/admin/utenti/lista:", data);
    })
    .catch(err => console.error("🔥 ERRORE /api/admin/utenti/lista:", err));

})();

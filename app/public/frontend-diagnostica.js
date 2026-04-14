/**
 * FILE: app/public/frontend-diagnostica.js
 * Diagnostica frontend — scanner JS + test API
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

  // Test API
  fetch("https://mewingmarket.onrender.com/api/products", { method: "OPTIONS" })
    .then(r => {
      console.log("🟩 CORS:", r.headers.get("Access-Control-Allow-Origin"));
    })
    .catch(err => console.error("🔥 ERRORE TEST API:", err));
})();

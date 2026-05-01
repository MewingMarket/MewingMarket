// =========================================================
// DIAGNOSTICA FETCH — Versione 2027.970
// Compatibile con universal-json + router universale
// Intercetta SOLO /api/, non tocca file statici
// Non modifica il comportamento di fetch()
// =========================================================

(function() {
  const originalFetch = window.fetch;

  window.fetch = async function(url, options = {}) {
    const isApi = typeof url === "string" && url.startsWith("/api/");
    const start = performance.now();

    try {
      const res = await originalFetch(url, options);

      // Se NON è un'API → non toccare nulla
      if (!isApi) return res;

      const clone = res.clone();
      const text = await clone.text();

      let json = null;
      let valid = true;

      try {
        json = JSON.parse(text);
      } catch (e) {
        valid = false;
      }

      if (!valid) {
        console.error("❌ [DIAG] API NON JSON:", {
          url,
          status: res.status,
          contentType: res.headers.get("Content-Type"),
          body: text.slice(0, 300)
        });
      } else {
        console.log("🟩 [DIAG] API JSON OK:", url, json);
      }

      return res;

    } catch (err) {
      console.error("🔥 [DIAG] FETCH ERROR:", url, err);
      throw err;
    }
  };
})();

// =========================================================
// DIAGNOSTICA FETCH — intercetta tutte le fetch del frontend
// =========================================================

(function() {
  const originalFetch = window.fetch;

  window.fetch = async function(url, options = {}) {
    const start = performance.now();

    try {
      const res = await originalFetch(url, options);
      const text = await res.text();

      let json = null;
      let valid = true;

      try {
        json = JSON.parse(text);
      } catch (e) {
        valid = false;
      }

      if (!valid) {
        console.error("❌ FETCH NON JSON:", {
          url,
          status: res.status,
          contentType: res.headers.get("Content-Type"),
          body: text.slice(0, 300)
        });

        return {
          ok: false,
          status: res.status,
          json: async () => ({
            success: false,
            error: "Formato non valido dal server",
            raw: text.slice(0, 500)
          })
        };
      }

      return {
        ok: res.ok,
        status: res.status,
        json: async () => json
      };

    } catch (err) {
      console.error("❌ FETCH ERROR:", url, err);
      return {
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: "Errore di rete",
          details: err.message
        })
      };
    }
  };
})();

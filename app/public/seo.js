/* =========================================================
   SEO STATIC MODE — PATCH 2058 (A2)
   - Nessun dynamic title
   - Nessuna description dinamica
   - Nessun canonical dinamico
   - Aggiorna SOLO OpenGraph + Twitter per pagina prodotto
========================================================= */

(function () {

  setTimeout(() => {

    const clean = (t) =>
      typeof t === "string"
        ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
        : "";

    const safeURL = (url) =>
      typeof url === "string" && url.startsWith("http")
        ? url
        : "";

    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const id = clean(params.get("id") || "");

    /* =========================================================
       SOLO PAGINA PRODOTTO
       (il resto è statico negli HTML)
    ========================================================== */
    if (!id) return;

    fetch("/api/prodotti-new", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    })
      .then(r => r.json().catch(() => null))
      .then(json => {
        if (!json || !json.success || !Array.isArray(json.prodotti)) return;

        const p = json.prodotti.find(pr => String(pr.id) === String(id));
        if (!p) return;

        const title = clean(p.titolo);
        const description = clean(
          p.descrizioneEmail ||
          p.descrizioneBreve ||
          p.descrizioneLunga ||
          ""
        );

        const canonical = `https://www.mewingmarket.it/prodotto.html?id=${id}`;
        const img = safeURL(p.immagine_url || p.immagine);

        /* =====================================================
           OPEN GRAPH (solo se presenti in head.html)
        ====================================================== */
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDesc = document.querySelector('meta[property="og:description"]');
        const ogUrl = document.querySelector('meta[property="og:url"]');
        const ogImg = document.querySelector('meta[property="og:image"]');

        if (ogTitle) ogTitle.setAttribute("content", title);
        if (ogDesc) ogDesc.setAttribute("content", description);
        if (ogUrl) ogUrl.setAttribute("content", canonical);
        if (ogImg && img) ogImg.setAttribute("content", img);

        /* =====================================================
           TWITTER
        ====================================================== */
        const twTitle = document.querySelector('meta[name="twitter:title"]');
        const twDesc = document.querySelector('meta[name="twitter:description"]');
        const twImg = document.querySelector('meta[name="twitter:image"]');

        if (twTitle) twTitle.setAttribute("content", title);
        if (twDesc) twDesc.setAttribute("content", description);
        if (twImg && img) twImg.setAttribute("content", img);

      })
      .catch(err => console.error("Errore SEO prodotti:", err));

  }, 0);

})();

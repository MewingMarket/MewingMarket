// =========================================================
// SEO ADMIN — PATCH 2058 (A2 STATIC TITLE MODE)
// Nessun dynamic title, nessuna description dinamica,
// nessun canonical dinamico. Solo OG/Twitter se presenti.
// =========================================================

(function () {

  /* =========================================================
     SANITIZZAZIONE
  ========================================================== */
  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  /* =========================================================
     META STATICI (NON MODIFICHIAMO TITLE!)
  ========================================================== */
  const title = "Admin – MewingMarket";
  const description = "Pannello amministrativo MewingMarket.";
  const canonical = window.location.href;

  /* =========================================================
     OPEN GRAPH (solo se presenti)
  ========================================================== */
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  const ogImg = document.querySelector('meta[property="og:image"]');

  if (ogTitle) ogTitle.setAttribute("content", title);
  if (ogDesc) ogDesc.setAttribute("content", description);
  if (ogUrl) ogUrl.setAttribute("content", canonical);
  if (ogImg) ogImg.setAttribute("content", "/admin/admin-og.jpg");

  /* =========================================================
     TWITTER (solo se presenti)
  ========================================================== */
  const twTitle = document.querySelector('meta[name="twitter:title"]');
  const twDesc = document.querySelector('meta[name="twitter:description"]');
  const twImg = document.querySelector('meta[name="twitter:image"]');

  if (twTitle) twTitle.setAttribute("content", title);
  if (twDesc) twDesc.setAttribute("content", description);
  if (twImg) twImg.setAttribute("content", "/admin/admin-og.jpg");

})();

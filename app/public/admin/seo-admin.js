// =========================================================
// SEO DINAMICO – AREA ADMIN (versione blindata)
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
     META DI DEFAULT (admin)
  ========================================================== */
  let title = "Admin – MewingMarket";
  let description = "Pannello amministrativo MewingMarket.";
  let canonical = window.location.href;

  /* =========================================================
     LETTURA META DINAMICI DALLA PAGINA
  ========================================================== */
  const elTitle = document.getElementById("dynamic-title");
  const elDesc = document.getElementById("dynamic-description");
  const elCanonical = document.getElementById("dynamic-canonical");

  if (elTitle && elTitle.content) title = clean(elTitle.content);
  if (elDesc && elDesc.content) description = clean(elDesc.content);
  if (elCanonical && elCanonical.href) canonical = elCanonical.href;

  /* =========================================================
     APPLICA TITOLO DINAMICO
  ========================================================== */
  document.title = title;

  /* =========================================================
     OPEN GRAPH (solo per coerenza interna)
  ========================================================== */
  const ogTitle = document.getElementById("og-title");
  const ogDesc = document.getElementById("og-description");
  const ogUrl = document.getElementById("og-url");
  const ogImg = document.getElementById("og-image");

  if (ogTitle) ogTitle.setAttribute("content", title);
  if (ogDesc) ogDesc.setAttribute("content", description);
  if (ogUrl) ogUrl.setAttribute("content", canonical);
  if (ogImg) ogImg.setAttribute("content", "/admin/admin-og.jpg");

  /* =========================================================
     TWITTER (coerenza interna)
  ========================================================== */
  const twTitle = document.getElementById("twitter-title");
  const twDesc = document.getElementById("twitter-description");
  const twImg = document.getElementById("twitter-image");

  if (twTitle) twTitle.setAttribute("content", title);
  if (twDesc) twDesc.setAttribute("content", description);
  if (twImg) twImg.setAttribute("content", "/admin/admin-og.jpg");

})();

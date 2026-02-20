/**
 * premium/richMessages.cjs
 * Modulo per messaggi ricchi in stile WhatsApp.
 */

function escapeHTML(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ------------------------------------------
   BLOCCO SEZIONATO — stile WhatsApp Business
------------------------------------------ */
function sectionedMessage({ title = "", sections = [] }) {
  let html = `
<div class="mm-rich">
  <div class="mm-rich-title">${escapeHTML(title)}</div>
`;

  for (const sec of sections) {
    html += `
    <div class="mm-rich-section">
      <div class="mm-rich-section-title">${escapeHTML(sec.title || "")}</div>
      <div class="mm-rich-section-body">${escapeHTML(sec.body || "")}</div>
    </div>
    `;
  }

  html += `</div>`;
  return html;
}

/* ------------------------------------------
   INFO CARD — messaggio informativo elegante
------------------------------------------ */
function infoMessage({ title = "", body = "" }) {
  return `
<div class="mm-info">
  <div class="mm-info-title">ℹ️ ${escapeHTML(title)}</div>
  <div class="mm-info-body">${escapeHTML(body)}</div>
</div>
`;
}

/* ------------------------------------------
   ALERT / WARNING — messaggio di avviso
------------------------------------------ */
function warningMessage({ title = "", body = "" }) {
  return `
<div class="mm-warning">
  <div class="mm-warning-title">⚠️ ${escapeHTML(title)}</div>
  <div class="mm-warning-body">${escapeHTML(body)}</div>
</div>
`;
}

/* ------------------------------------------
   SUCCESS / CONFERMA — messaggio positivo
------------------------------------------ */
function successMessage({ title = "", body = "" }) {
  return `
<div class="mm-success">
  <div class="mm-success-title">✅ ${escapeHTML(title)}</div>
  <div class="mm-success-body">${escapeHTML(body)}</div>
</div>
`;
}

/* ------------------------------------------
   HERO MESSAGE — titolo grande + descrizione
------------------------------------------ */
function heroMessage({ title = "", subtitle = "", body = "" }) {
  return `
<div class="mm-hero">
  <div class="mm-hero-title">${escapeHTML(title)}</div>
  <div class="mm-hero-subtitle">${escapeHTML(subtitle)}</div>
  <div class="mm-hero-body">${escapeHTML(body)}</div>
</div>
`;
}

/* ------------------------------------------
   BULLET LIST — lista elegante
------------------------------------------ */
function bulletList({ title = "", items = [] }) {
  let html = `
<div class="mm-bullet">
  <div class="mm-bullet-title">${escapeHTML(title)}</div>
  <ul class="mm-bullet-list">
`;

  for (const item of items) {
    html += `<li>${escapeHTML(item)}</li>`;
  }

  html += `
  </ul>
</div>
`;

  return html;
}

/* ------------------------------------------
   FEATURE LIST — icona + testo
------------------------------------------ */
function featureList({ title = "", features = [] }) {
  let html = `
<div class="mm-features">
  <div class="mm-features-title">${escapeHTML(title)}</div>
`;

  for (const f of features) {
    html += `
    <div class="mm-feature-row">
      <div class="mm-feature-icon">${escapeHTML(f.icon || "•")}</div>
      <div class="mm-feature-text">${escapeHTML(f.text || "")}</div>
    </div>
    `;
  }

  html += `</div>`;
  return html;
}

/* ------------------------------------------
   EXPORT UNICO
------------------------------------------ */
module.exports = {
  sectionedMessage,
  infoMessage,
  warningMessage,
  successMessage,
  heroMessage,
  bulletList,
  featureList
};

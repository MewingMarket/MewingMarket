/**
 * premium/quickReplies.cjs
 * Modulo per suggerimenti rapidi (quick replies) in stile WhatsApp.
 */

function escapeHTML(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ------------------------------------------
   QUICK REPLIES — base
------------------------------------------ */
function quickReplies(options = []) {
  if (!Array.isArray(options) || !options.length) return "";

  let html = `<div class="mm-quick-container">`;

  for (const opt of options) {
    const label = escapeHTML(opt.label || "");
    const value = escapeHTML(opt.value || label);

    html += `
      <button class="mm-quick" data-value="${value}">
        ${label}
      </button>
    `;
  }

  html += `</div>`;
  return html;
}

/* ------------------------------------------
   QUICK REPLIES — per prodotto
------------------------------------------ */
function productQuickReplies(product) {
  if (!product) return "";

  return quickReplies([
    { label: "📄 Dettagli", value: "dettagli" },
    { label: "🎥 Video", value: "video" },
    { label: "💰 Prezzo", value: "prezzo" },
    { label: "🛒 Acquista", value: "acquista" },
    { label: "🔍 Confronta", value: "confronto" }
  ]);
}

/* ------------------------------------------
   QUICK REPLIES — per catalogo
------------------------------------------ */
function catalogQuickReplies() {
  return quickReplies([
    { label: "📘 Ecosistema Digitale", value: "ecosistema" },
    { label: "💼 Business Digitale AI", value: "business" },
    { label: "🧠 Produttività AI", value: "produttività" },
    { label: "🔍 Consigliami", value: "consiglio" }
  ]);
}

/* ------------------------------------------
   QUICK REPLIES — per supporto
------------------------------------------ */
function supportQuickReplies() {
  return quickReplies([
    { label: "⬇️ Download", value: "download" },
    { label: "💳 Payhip", value: "payhip" },
    { label: "💸 Rimborso", value: "rimborso" },
    { label: "📞 Contatto", value: "contatto" }
  ]);
}

/* ------------------------------------------
   EXPORT UNICO
------------------------------------------ */
module.exports = {
  quickReplies,
  productQuickReplies,
  catalogQuickReplies,
  supportQuickReplies
};

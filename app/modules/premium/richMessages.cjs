/**
 * premium/richMessages.cjs — VERSIONE VIDEOGIOCO 2027
 * Modulo JSON UI per messaggi ricchi WhatsApp-style.
 * Nessun HTML, solo JSON compatibile con Game Engine.
 */

/* ============================================================
   BLOCCO SEZIONATO — stile WhatsApp Business
============================================================ */
function sectionedMessage({ title = "", sections = [], avatar = "assistant" }) {
  return {
    type: "sectioned",
    avatar,
    title,
    sections: sections.map(sec => ({
      title: sec.title || "",
      body: sec.body || ""
    }))
  };
}

/* ============================================================
   INFO CARD — messaggio informativo elegante
============================================================ */
function infoMessage({ title = "", body = "", avatar = "assistant" }) {
  return {
    type: "card",
    avatar,
    layout: "info",
    title: `ℹ️ ${title}`,
    text: body
  };
}

/* ============================================================
   ALERT / WARNING — messaggio di avviso
============================================================ */
function warningMessage({ title = "", body = "", avatar = "assistant" }) {
  return {
    type: "card",
    avatar,
    layout: "warning",
    title: `⚠️ ${title}`,
    text: body
  };
}

/* ============================================================
   SUCCESS / CONFERMA — messaggio positivo
============================================================ */
function successMessage({ title = "", body = "", avatar = "assistant" }) {
  return {
    type: "card",
    avatar,
    layout: "success",
    title: `✅ ${title}`,
    text: body
  };
}

/* ============================================================
   HERO MESSAGE — titolo grande + descrizione
============================================================ */
function heroMessage({ title = "", subtitle = "", body = "", avatar = "assistant" }) {
  return {
    type: "hero",
    avatar,
    title,
    subtitle,
    body
  };
}

/* ============================================================
   BULLET LIST — lista elegante
============================================================ */
function bulletList({ title = "", items = [], avatar = "assistant" }) {
  return {
    type: "list_bullet",
    avatar,
    title,
    items
  };
}

/* ============================================================
   FEATURE LIST — icona + testo
============================================================ */
function featureList({ title = "", features = [], avatar = "assistant" }) {
  return {
    type: "features",
    avatar,
    title,
    features: features.map(f => ({
      icon: f.icon || "•",
      text: f.text || ""
    }))
  };
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  sectionedMessage,
  infoMessage,
  warningMessage,
  successMessage,
  heroMessage,
  bulletList,
  featureList
};

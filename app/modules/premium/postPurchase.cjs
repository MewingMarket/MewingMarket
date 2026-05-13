/**
 * premium/postPurchase.cjs — VERSIONE VIDEOGIOCO 2027
 * Modulo JSON UI per messaggi premium post-acquisto.
 * Compatibile con Game Engine WhatsApp-style.
 */

/* ============================================================
   MESSAGGIO POST-ACQUISTO — principale
============================================================ */
function postPurchaseMessage(product) {
  if (!product) {
    return {
      type: "text",
      avatar: "vendor",
      text: "Acquisto completato! Puoi accedere ai tuoi prodotti dalla Dashboard."
    };
  }

  return {
    type: "card",
    avatar: "vendor",
    layout: "success",
    title: "🎉 Acquisto completato!",
    text: `Hai acquistato *${product.titolo_breve}*. Puoi accedere subito al materiale dalla tua Dashboard.`,
    actions: [
      { label: "Come iniziare", intent: "post_acquisto_start", productId: product.id },
      { label: "Mostra risorse", intent: "post_acquisto_risorse", productId: product.id }
    ]
  };
}

/* ============================================================
   COME INIZIARE — guida rapida post-acquisto
============================================================ */
function gettingStartedMessage(product) {
  return {
    type: "guide",
    avatar: "vendor",
    title: `🚀 Come iniziare con ${product?.titolo_breve || "il tuo prodotto"}`,
    steps: [
      "Accedi alla Dashboard",
      "Apri la sezione *I miei download*",
      "Troverai tutti i file organizzati nella cartella principale",
      "Parti dal file *LEGGIMI* o dalla guida introduttiva"
    ],
    actions: [
      { label: "Mostra risorse", intent: "post_acquisto_risorse", productId: product?.id }
    ]
  };
}

/* ============================================================
   RISORSE UTILI — materiali extra
============================================================ */
function usefulResourcesMessage(product) {
  return {
    type: "list",
    avatar: "vendor",
    title: `📚 Risorse utili per ${product?.titolo_breve || "il tuo prodotto"}`,
    items: [
      { label: "Video introduttivo", intent: "video_prodotto", productId: product?.id },
      { label: "Guida rapida PDF", intent: "guida_pdf", productId: product?.id },
      { label: "Template inclusi", intent: "template_prodotto", productId: product?.id },
      { label: "Accesso ai file", intent: "download" }
    ],
    actions: [
      { label: "Serve aiuto?", intent: "post_acquisto_help" }
    ]
  };
}

/* ============================================================
   SERVE AIUTO? — supporto post-acquisto
============================================================ */
function needHelpMessage() {
  return {
    type: "quick_replies",
    avatar: "professor",
    text: "Hai bisogno di aiuto con download, file o istruzioni?",
    options: [
      { label: "Download", intent: "download" },
      { label: "Accesso ai file", intent: "supporto" },
      { label: "Problemi tecnici", intent: "spiega" }
    ]
  };
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  postPurchaseMessage,
  gettingStartedMessage,
  usefulResourcesMessage,
  needHelpMessage
};

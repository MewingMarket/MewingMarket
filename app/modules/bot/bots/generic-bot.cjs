/**
 * Avatar Generico — Onboarding, smistamento, intent base
 * Path: app/modules/bot/bots/generic-bot.cjs
 */

function match(message) {
  if (!message) return false;
  const m = message.toLowerCase();

  // L’avatar generico interviene quando:
  // - il messaggio è troppo generico
  // - non è chiaro l’intento
  // - è un saluto
  // - è onboarding
  // - è una richiesta vaga
  return (
    m.includes("ciao") ||
    m.includes("hey") ||
    m.includes("buongiorno") ||
    m.includes("buonasera") ||
    m.includes("aiutami") ||
    m.includes("non so") ||
    m.includes("che puoi fare") ||
    m.includes("menu") ||
    m.includes("inizia") ||
    m.includes("start") ||
    m.includes("help") ||
    m.length < 5
  );
}

async function run(message, context = {}) {
  const m = message.toLowerCase();

  /* =========================================================
     SALUTI / ONBOARDING
  ========================================================== */
  if (
    m.includes("ciao") ||
    m.includes("hey") ||
    m.includes("buongiorno") ||
    m.includes("buonasera") ||
    m.includes("inizia") ||
    m.includes("start")
  ) {
    return {
      avatar: "assistant",
      type: "quick_replies",
      text: "Ciao! Sono qui per aiutarti. Da dove vuoi iniziare?",
      options: [
        { label: "🛒 Prodotti", value: "mostra prodotti" },
        { label: "📦 Assistenza ordini", value: "ordini" },
        { label: "🎥 Video e motivazione", value: "video motivazionale" },
        { label: "📧 Newsletter", value: "newsletter" }
      ]
    };
  }

  /* =========================================================
     RICHIESTE VAGHE / SMISTAMENTO
  ========================================================== */
  if (m.includes("aiutami") || m.includes("non so") || m.includes("help")) {
    return {
      avatar: "assistant",
      type: "quick_replies",
      text: "Nessun problema, dimmi cosa ti serve:",
      options: [
        { label: "Voglio comprare qualcosa", value: "prodotti" },
        { label: "Ho un problema con un ordine", value: "assistenza" },
        { label: "Voglio un video", value: "video" },
        { label: "Spiegami qualcosa", value: "spiega" }
      ]
    };
  }

  /* =========================================================
     COSA PUOI FARE?
  ========================================================== */
  if (m.includes("che puoi fare") || m.includes("cosa puoi fare")) {
    return {
      avatar: "assistant",
      type: "quick_replies",
      text: "Posso aiutarti in tante cose! Scegli una categoria:",
      options: [
        { label: "Prodotti e consigli", value: "prodotti" },
        { label: "Assistenza tecnica", value: "assistenza" },
        { label: "Video e motivazione", value: "video" },
        { label: "Newsletter e aggiornamenti", value: "newsletter" }
      ]
    };
  }

  /* =========================================================
     FALLBACK GENERICO
  ========================================================== */
  return {
    avatar: "assistant",
    type: "quick_replies",
    text: "Non ho capito bene, ma posso aiutarti in queste aree:",
    options: [
      { label: "Prodotti", value: "prodotti" },
      { label: "Assistenza", value: "assistenza" },
      { label: "Video", value: "video" },
      { label: "Newsletter", value: "newsletter" }
    ]
  };
}

module.exports = {
  name: "Avatar Generico",
  avatar: "assistant",
  match,
  run
};

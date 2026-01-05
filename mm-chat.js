  (function () {
  const btn = document.getElementById("mm-chat-btn");
  const box = document.getElementById("mm-chatbox");
  const messages = document.getElementById("mm-chat-messages");
  const input = document.getElementById("mm-text");
  const sendBtn = document.getElementById("mm-send");

  let context = "menu"; // stato conversazione

  function addMsg(text, type = "bot") {
    const div = document.createElement("div");
    div.className = `mm-msg mm-${type}`;
    div.innerHTML = text.replace(/\n/g, "<br>");
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function bot(text, delay = 400) {
    setTimeout(() => addMsg(text, "bot"), delay);
  }

  function user(text) {
    addMsg(text, "user");
  }

  function menu() {
    context = "menu";
    bot(
      "👋 Posso aiutarti con:\n" +
      "• HERO (prezzo, contenuto, acquisto)\n" +
      "• Supporto e problemi di download\n" +
      "• Newsletter\n\n" +
      "Scrivimi cosa ti serve 👇"
    );
  }

  function normalize(text) {
    return text.toLowerCase();
  }

  function includesAny(text, arr) {
    return arr.some(k => text.includes(k));
  }

  function handleMessage(msg) {
    const text = normalize(msg);

    /* ===== MENU / RESET ===== */
    if (includesAny(text, ["menu", "inizio", "start", "opzioni", "help", "info"])) {
      menu();
      return;
    }

    /* ===== BLOCCO HERO COMMERCIALE ===== */
    if (includesAny(text, [
      "hero", "prodotto", "comprare hero", "acquistare hero",
      "prezzo hero", "cosa include hero", "template",
      "contenuto hero", "download hero"
    ])) {
      context = "hero";
      bot(
        "🔥 **HERO** è il nostro prodotto digitale di punta.\n\n" +
        "Include:\n" +
        "• Template pronti\n" +
        "• Struttura guidata\n" +
        "• Accesso immediato\n\n" +
        "🛒 Store: https://payhip.com/b/LhqQT\n" +
        "🎥 Video: https://youtube.com/shorts/YoOXWUajbQc?feature=shared\n\n" +
        "Vuoi **vedere il video** o **acquistarlo**?"
      );
      return;
    }

    /* ===== VIDEO HERO ===== */
    if (includesAny(text, ["video hero", "vedere hero", "anteprima", "presentazione", "video"])) {
      context = "video";
      bot(
        "🎥 Ecco il video di presentazione di **HERO**:\n" +
        "https://youtube.com/shorts/YoOXWUajbQc?feature=shared\n\n" +
        "Vuoi **acquistarlo** o **tornare al menu**?"
      );
      return;
    }

    /* ===== ACQUISTO ===== */
    if (includesAny(text, ["acquista", "compra", "acquistarlo"])) {
      bot(
        "🛒 Puoi acquistare HERO qui:\n" +
        "https://payhip.com/b/LhqQT\n\n" +
        "Dopo l’acquisto ricevi subito il link di download via email.\n\n" +
        "Vuoi altro aiuto o torniamo al menu?"
      );
      return;
    }

    /* ===== SUPPORTO ===== */
    if (includesAny(text, [
      "supporto", "assistenza", "problema", "errore",
      "download non funziona", "payhip"
    ])) {
      context = "supporto";
      bot(
        "🛠 **Supporto HERO**\n\n" +
        "Se non riesci a scaricare HERO:\n" +
        "1️⃣ Controlla l’email post-acquisto\n" +
        "2️⃣ Verifica spam/promozioni\n" +
        "3️⃣ Recupera il link da Payhip\n" +
        "4️⃣ Prova un altro browser\n\n" +
        "Se il problema continua:\n" +
        "📧 supporto@mewingmarket.it\n" +
        "📱 WhatsApp: 352 026 6660\n\n" +
        "Vuoi tornare al menu?"
      );
      return;
    }

    /* ===== NEWSLETTER ===== */
    if (includesAny(text, ["newsletter", "iscrizione", "email", "aggiornamenti", "news"])) {
      bot(
        "📩 Iscriviti alla newsletter MewingMarket:\n" +
        "https://mewingmarket.it/iscrizione.html\n\n" +
        "Riceverai contenuti utili e aggiornamenti.\n" +
        "Puoi disiscriverti quando vuoi.\n\n" +
        "Vuoi tornare al menu?"
      );
      return;
    }

    /* ===== CATALOGO ===== */
    if (includesAny(text, ["catalogo", "prodotti", "store"])) {
      bot(
        "🛒 Puoi vedere tutti i prodotti qui:\n" +
        "https://payhip.com/MewingMarket\n\n" +
        "Seguici anche sui social per novità e offerte.\n\n" +
        "Vuoi tornare al menu?"
      );
      return;
    }

    /* ===== CHIUSURA ===== */
    if (includesAny(text, ["grazie", "ok", "perfetto", "ciao", "fine"])) {
      menu();
      return;
    }

    /* ===== FALLBACK INTELLIGENTE ===== */
    bot(
      "🤔 Posso aiutarti su:\n" +
      "• HERO (prezzo, contenuti, video)\n" +
      "• Supporto e download\n" +
      "• Newsletter\n\n" +
      "Scrivi cosa ti serve oppure digita **menu**."
    );
  }

  btn.onclick = () => {
    box.style.display = box.style.display === "flex" ? "none" : "flex";
    if (!messages.innerHTML) menu();
  };

  sendBtn.onclick = () => {
    const msg = input.value.trim();
    if (!msg) return;
    user(msg);
    input.value = "";
    setTimeout(() => handleMessage(msg), 300);
  };
})();

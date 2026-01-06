

import express from "express";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors({ origin: ["https://mewingmarket.it", "https://www.mewingmarket.it"] }));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

app.post("/chat", (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === "") {
    return res.status(400).json({ reply: "❌ Messaggio vuoto, scrivi qualcosa." });
  }

  const text = message.toLowerCase();

  // Intenti principali
  const intents = {
    benvenuto: ["menu", "inizio", "start", "opzioni", "help", "informazioni"],
    hero: ["hero", "prodotto", "comprare hero", "acquistare", "prezzo hero", "cosa include hero", "template"],
    video: ["video hero", "vedere hero", "anteprima", "presentazione"],
    supporto: ["supporto", "assistenza", "problema", "errore", "download non funziona", "payhip", "scaricare", "non riesco", "email", "rimborso", "pagamento", "faq"],
    newsletter: ["newsletter", "iscrizione", "email", "aggiornamenti", "news", "annullare", "disiscrizione"],
    social: ["social", "instagram", "tiktok", "youtube", "x", "twitter", "facebook"],
    fallback: ["non so", "boh", "cosa", "aiuto", "domanda generica", "info"]
  };

  // Risposte
  const replies = {
    benvenuto: "👋 Ciao! Sono qui per aiutarti con HERO, supporto, newsletter e altro.",
    hero: "🔥 HERO è il nostro prodotto digitale più richiesto. Include template pronti, struttura guidata e accesso immediato. Vuoi vedere il video o acquistarlo?",
    video: `🎥 Ecco il video di presentazione di HERO:<br><a href="https://mewingmarket.payhip.com/b/hero-video" target="_blank">Guarda ora</a><br>Vuoi acquistarlo? Scrivi “acquista HERO”`,
    acquisto: `🛒 Puoi acquistare HERO da qui:<br><a href="https://mewingmarket.payhip.com/b/hero" target="_blank">Acquista HERO</a><br>Vuoi iscriverti alla newsletter o seguire i nostri social per non perdere altri prodotti?`,
    newsletter: `✉️ Vuoi iscriverti alla newsletter?<br><a href="https://mewingmarket.payhip.com/newsletter" target="_blank">Iscriviti ora</a><br>Per annullare l’iscrizione:<br><a href="https://mewingmarket.it/disiscriviti.html" target="_blank">Disiscriviti</a>`,
    social: `📲 Ecco i nostri social ufficiali:<br>
- <a href="https://www.instagram.com/mewingmarket" target="_blank">Instagram</a><br>
- <a href="https://tiktok.com/@mewingmarket" target="_blank">TikTok</a><br>
- <a href="https://www.youtube.com/@mewingmarket2" target="_blank">YouTube</a><br>
- <a href="https://x.com/mewingm8" target="_blank">X / Twitter</a><br>
- <a href="https://www.facebook.com/profile.php?id=61584779793628" target="_blank">Facebook</a>`,
    fallback: "🤖 Non ho capito bene la tua richiesta, ma posso aiutarti! Vuoi tornare al menu?",
    invito: "Perfetto! Se ti serve altro sono qui 😊<br>Puoi tornare al menu quando vuoi.",
    faq: {
      download: `📥 Se non riesci a scaricare HERO, segui questi passaggi:<br>
1. Controlla la tua email (anche spam).<br>
2. Recupera il link da Payhip con la stessa email.<br>
3. Prova da un altro browser o dispositivo.<br>
Se hai ancora problemi, contattaci:<br>📧 support@mewingmarket.it<br>📱 WhatsApp: +39 352 026 6660`,
      payhip: `💡 Payhip è la piattaforma che gestisce pagamenti e download.<br>
- Dopo il pagamento ricevi un’email con il link.<br>
- Il link è personale e sicuro.<br>
- Puoi accedere anche dalla tua area Payhip.<br>
Se hai problemi, scrivici in chat.`,
      rimborso: `🔁 I prodotti digitali non prevedono rimborso una volta scaricati.<br>
Se hai problemi tecnici, contattaci e ti aiutiamo subito.`,
      contatto: `📞 Puoi contattare il supporto direttamente dalla chat.<br>
Siamo disponibili per:<br>- download<br>- acquisti<br>- domande tecniche<br>📧 support@mewingmarket.it<br>📱 WhatsApp: +39 352 026 6660`,
      newsletter: `📰 La newsletter ti aggiorna su contenuti e novità.<br>
Iscriviti dalla chat, dal sito o dai link nei contenuti.<br>L’iscrizione è gratuita e puoi annullarla quando vuoi.`
    }
  };

  // Matching
  let reply = replies.fallback;

  if (intents.benvenuto.some(k => text.includes(k))) reply = replies.benvenuto;
  else if (intents.hero.some(k => text.includes(k))) reply = replies.hero;
  else if (intents.video.some(k => text.includes(k))) reply = replies.video;
  else if (text.includes("acquista") || text.includes("comprare")) reply = replies.acquisto;
  else if (intents.newsletter.some(k => text.includes(k))) reply = replies.newsletter;
  else if (intents.social.some(k => text.includes(k))) reply = replies.social;
  else if (intents.supporto.some(k => text.includes(k))) {
    if (text.includes("scaricare") || text.includes("download")) reply = replies.faq.download;
    else if (text.includes("payhip")) reply = replies.faq.payhip;
    else if (text.includes("rimborso")) reply = replies.faq.rimborso;
    else if (text.includes("contattare") || text.includes("supporto")) reply = replies.faq.contatto;
    else if (text.includes("faq") || text.includes("domande")) reply = replies.faq.newsletter;
    else reply = "💬 Scegli il tipo di supporto:\n- download\n- pagamento\n- tecnico\n- rimborso\n- contatto";
  }

  res.json({ reply });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server attivo su porta ${PORT}`));

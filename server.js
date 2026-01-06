import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

const app = express();

// =========================
// CONFIGURAZIONE BASE
// =========================
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));

// =========================
// MEMORIA RAM PER UTENTI
// =========================
const userStates = {}; 
// struttura: { mm_uid: { state: "menu", lastIntent: null, data: {} } }

// =========================
// GENERATORE ID UTENTE
// =========================
function generateUID() {
  return "mm_" + Math.random().toString(36).substring(2, 12);
}

// =========================
// MIDDLEWARE COOKIE + STATO
// =========================
app.use((req, res, next) => {
  let uid = req.cookies.mm_uid;

  if (!uid) {
    uid = generateUID();
    res.cookie("mm_uid", uid, {
      httpOnly: false,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24 * 30
    });
  }

  if (!userStates[uid]) {
    userStates[uid] = {
      state: "menu",
      lastIntent: null,
      data: {}
    };
  }

  req.uid = uid;
  req.userState = userStates[uid];
  next();
});

// =========================
// FUNZIONI DI SUPPORTO
// =========================
function setState(uid, newState) {
  userStates[uid].state = newState;
}

function reply(res, text) {
  res.json({ reply: text });
}

// =========================
// NORMALIZZAZIONE TESTO
// =========================
function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// =========================
// INTENT MATCHER ULTRA 3.0
// =========================
function detectIntent(rawText) {
  const t = normalize(rawText);

  // PRIORITÀ ASSOLUTA SOCIAL
  if (
    t.includes("instagram") ||
    t.includes("tiktok") ||
    t.includes("tik tok") ||
    t.includes("youtube") ||
    t.includes("you tube") ||
    t.includes("facebook") ||
    t.includes("threads") ||
    t.includes("linkedin") ||
    t === "x" ||
    t.includes("twitter") ||
    t.includes("social")
  ) {
    return { intent: "social", sub: null };
  }

  // ACQUISTO — sotto-intenti
  if (t.includes("quanto costa") || t.includes("prezzo") || t.includes("costo") || t.includes("costa")) {
    return { intent: "acquisto", sub: "prezzo" };
  }
  if (t.includes("come pago") || t.includes("pagamento") || t.includes("pago") || t.includes("pagare")) {
    return { intent: "acquisto", sub: "pagamento" };
  }
  if (t.includes("paypal")) {
    return { intent: "acquisto", sub: "paypal" };
  }
  if (t.includes("carta")) {
    return { intent: "acquisto", sub: "carta" };
  }
  if (t.includes("acquista") || t.includes("comprare") || t.includes("compra") || t.includes("checkout")) {
    return { intent: "acquisto", sub: "checkout" };
  }
  if (t.includes("hero")) {
    return { intent: "acquisto", sub: "hero" };
  }

  // SUPPORTO — sotto-intenti
  if (t.includes("download") || t.includes("scaricare") || t.includes("file") || t.includes("zip")) {
    return { intent: "supporto", sub: "download" };
  }
  if (t.includes("errore") || t.includes("non funziona") || t.includes("problema") || t.includes("bug") || t.includes("crash")) {
    return { intent: "supporto", sub: "errore" };
  }
  if (t.includes("pagamento fallito") || t.includes("transazione") || t.includes("rifiutata") || t.includes("rifiutato")) {
    return { intent: "supporto", sub: "pagamento_fallito" };
  }
  if (t.includes("rimborso") || t.includes("refund")) {
    return { intent: "supporto", sub: "rimborso" };
  }
  if (t.includes("email") || t.includes("mail") || t.includes("ricevuta") || t.includes("conferma")) {
    return { intent: "supporto", sub: "email" };
  }
  if (t.includes("file danneggiato") || t.includes("corrotto") || t.includes("zip non si apre")) {
    return { intent: "supporto", sub: "file_danneggiato" };
  }
  if (t.includes("supporto") || t.includes("assistenza") || t.includes("aiuto") || t.includes("help")) {
    return { intent: "supporto", sub: "generale" };
  }

  // NEWSLETTER
  if (t.includes("newsletter") || t.includes("iscrizione") || t.includes("iscrivermi")) {
    return { intent: "newsletter", sub: "iscrizione" };
  }
  if (t.includes("disiscrizione") || t.includes("annulla") || t.includes("cancellami")) {
    return { intent: "newsletter", sub: "disiscrizione" };
  }

  // SITO
  if (t.includes("sito") || t.includes("website") || t.includes("home")) {
    return { intent: "sito", sub: null };
  }

  // VIDEO
  if (t.includes("video") || t.includes("anteprima")) {
    return { intent: "video", sub: null };
  }

  // HERO (informazioni generali)
  if (t.includes("hero")) {
    return { intent: "hero", sub: null };
  }

  // FALLBACK
  return { intent: "fallback", sub: null };
}

// =========================
// ROUTER PRINCIPALE
// =========================
app.post("/chat", (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === "") {
    return reply(res, "Scrivi un messaggio così posso aiutarti.");
  }

  const uid = req.uid;
  const { intent, sub } = detectIntent(message);

  setState(uid, intent);

  return handleConversation(req, res, intent, sub);
});

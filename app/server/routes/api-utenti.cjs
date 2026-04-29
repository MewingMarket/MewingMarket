/* =========================================================
   FILE: app/server/routes/api-utenti.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Sistema utenti completo — Registrazione, Login,
                Cambio email, Cambio password, Eliminazione,
                Reset email/password, /me
========================================================= */

const crypto = require("crypto");
const path = require("path");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const jsonGen = R("modules/generatore-json.cjs");

const { inviaEmailRegistrazione } = R("modules/email-registrazione.cjs");
const { inviaEmailCambioEmail } = R("modules/email-cambio-email.cjs");
const { inviaEmailCambioPassword } = R("modules/email-cambio-password.cjs");
const { inviaEmailEliminazione } = R("modules/email-eliminazione.cjs");
const { inviaEmailNewsletterUnsubscribe } = R("modules/email-newsletter-unsubscribe.cjs");

const { syncBrevoUtenteStatoReale, LISTA_BACKUP } = R("modules/liste-brevo.cjs");
const { inviaEmailLista } = R("modules/invia-email-lista.cjs");

/* =========================================================
   UTILS
========================================================= */
function normalizePassword(p) {
  return String(p || "").trim();
}

function hash(p) {
  return crypto.createHash("sha256").update(String(p)).digest("hex");
}

function genToken(prefix) {
  return prefix + "_" + crypto.randomBytes(16).toString("hex");
}

function getSessionToken(req) {
  const h = req.headers["authorization"];
  if (!h || !h.startsWith("Bearer ")) return "";
  return h.replace("Bearer ", "").trim();
}

function logUserEvent(email, evento, note = null) {
  try {
    db.prepare(`
      INSERT INTO utenti_eventi (email, evento, ip, user_agent, note)
      VALUES (?, ?, NULL, NULL, ?)
    `).run(email, evento, note);
  } catch (err) {
    console.error("❌ Errore salvataggio utenti_eventi:", err);
  }
}

/* =========================================================
   1) REGISTRAZIONE
========================================================= */
async function registrazione(req) {
  console.log("[DEBUG utenti] registrazione()");

  try {
    let { email, password, codice_fiscale } = req.body || {};

    email = (email || "").trim().toLowerCase();
    password = normalizePassword(password);
    codice_fiscale = (codice_fiscale || "").trim().toUpperCase();

    if (!email || !password || !codice_fiscale) {
      return { success: false, error: "Dati mancanti" };
    }

    const esiste = db.prepare("SELECT id FROM utenti WHERE email = ?").get(email);
    if (esiste) return { success: false, error: "Email gia registrata" };

    const sessione = genToken("tok");
    const passwordHash = hash(password);

    let ruolo = "user";
    if (codice_fiscale === "GRSSMN92H25I138W") ruolo = "admin";

    db.prepare(`
      INSERT INTO utenti (email, password_hash, sessione, codice_fiscale, ruolo)
      VALUES (?, ?, ?, ?, ?)
    `).run(email, passwordHash, sessione, codice_fiscale, ruolo);

    logUserEvent(email, "registrato");

    inviaEmailRegistrazione({ email });

    try {
      await syncBrevoUtenteStatoReale({ email, registrato: true });
    } catch {}

    try {
      await inviaEmailLista({
        email: "mewingmarket2@gmail.com",
        listId: LISTA_BACKUP,
        subject: "Backup attivo",
        html: "<p>Registrazione backup attiva.</p>",
        tipo: "transazionale",
        modalita: "backup"
      });
    } catch {}

    await jsonGen.exportUsers();

    return { success: true, token: sessione, email };

  } catch (err) {
    console.error("Registrazione:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   2) LOGIN
========================================================= */
async function login(req) {
  console.log("[DEBUG utenti] login()");

  try {
    let { email, password } = req.body || {};

    email = (email || "").trim().toLowerCase();
    password = normalizePassword(password);

    if (!email || !password) {
      return { success: false, error: "Dati mancanti" };
    }

    const user = db.prepare("SELECT * FROM utenti WHERE email = ?").get(email);
    if (!user) return { success: false, error: "Utente non trovato" };

    const passwordHash = hash(password);
    if (normalizePassword(user.password_hash) !== passwordHash) {
      return { success: false, error: "Password errata" };
    }

    let sessione = user.sessione;
    if (!sessione || sessione.length < 10) {
      sessione = genToken("tok");
      db.prepare("UPDATE utenti SET sessione = ? WHERE id = ?").run(sessione, user.id);
    }

    logUserEvent(email, "login");

    return {
      success: true,
      token: sessione,
      email,
      ruolo: user.ruolo || "user"
    };

  } catch (err) {
    console.error("Login:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   3) CAMBIO EMAIL
========================================================= */
async function cambiaEmail(req) {
  console.log("[DEBUG utenti] cambiaEmail()");

  try {
    const sessione = getSessionToken(req);
    let { nuova_email, password } = req.body || {};

    nuova_email = (nuova_email || "").trim().toLowerCase();
    password = normalizePassword(password);

    if (!sessione || !nuova_email || !password) {
      return { success: false, error: "Dati mancanti" };
    }

    const user = db.prepare("SELECT * FROM utenti WHERE sessione = ?").get(sessione);
    if (!user) return { success: false, error: "Sessione non valida" };

    const passwordHash = hash(password);
    if (normalizePassword(user.password_hash) !== passwordHash) {
      return { success: false, error: "Password errata" };
    }

    const esiste = db.prepare("SELECT id FROM utenti WHERE email = ?").get(nuova_email);
    if (esiste) return { success: false, error: "Email gia in uso" };

    db.prepare("UPDATE utenti SET email = ? WHERE id = ?").run(nuova_email, user.id);

    inviaEmailCambioEmail({ email: nuova_email });

    try {
      await syncBrevoUtenteStatoReale({
        email: nuova_email,
        emailVecchia: user.email,
        credenzialiModificate: true
      });
    } catch {}

    await jsonGen.exportUsers();

    return { success: true };

  } catch (err) {
    console.error("Cambio email:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   4) CAMBIO PASSWORD
========================================================= */
async function cambiaPassword(req) {
  console.log("[DEBUG utenti] cambiaPassword()");

  try {
    const sessione = getSessionToken(req);
    let { vecchia_password, nuova_password } = req.body || {};

    vecchia_password = normalizePassword(vecchia_password);
    nuova_password = normalizePassword(nuova_password);

    if (!sessione || !vecchia_password || !nuova_password) {
      return { success: false, error: "Dati mancanti" };
    }

    const user = db.prepare("SELECT * FROM utenti WHERE sessione = ?").get(sessione);
    if (!user) return { success: false, error: "Sessione non valida" };

    const oldHash = hash(vecchia_password);
    if (normalizePassword(user.password_hash) !== oldHash) {
      return { success: false, error: "La password attuale non è corretta" };
    }

    const newHash = hash(nuova_password);
    db.prepare("UPDATE utenti SET password_hash = ? WHERE id = ?").run(newHash, user.id);

    inviaEmailCambioPassword({ email: user.email });

    try {
      await syncBrevoUtenteStatoReale({
        email: user.email,
        credenzialiModificate: true
      });
    } catch {}

    return { success: true };

  } catch (err) {
    console.error("Cambio password:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   5) ELIMINA ACCOUNT
========================================================= */
async function eliminaAccount(req) {
  console.log("[DEBUG utenti] eliminaAccount()");

  try {
    const sessione = getSessionToken(req);
    let { password } = req.body || {};

    password = normalizePassword(password);

    if (!sessione || !password) {
      return { success: false, error: "Dati mancanti" };
    }

    const user = db.prepare("SELECT * FROM utenti WHERE sessione = ?").get(sessione);
    if (!user) return { success: false, error: "Sessione non valida" };

    const passwordHash = hash(password);
    if (normalizePassword(user.password_hash) !== passwordHash) {
      return { success: false, error: "Password errata" };
    }

    logUserEvent(user.email, "eliminato");

    try { db.prepare("DELETE FROM ordini WHERE utente_id = ?").run(user.id); } catch {}
    try { db.prepare("DELETE FROM utenti_eventi WHERE email = ?").run(user.email); } catch {}
    try { db.prepare("DELETE FROM feedback WHERE utente_id = ?").run(user.id); } catch {}
    try { db.prepare("DELETE FROM newsletter_log WHERE email = ?").run(user.email); } catch {}

    try { await syncBrevoUtenteStatoReale({ email: user.email, elimina: true }); } catch {}
    try { await inviaEmailNewsletterUnsubscribe({ email: user.email }); } catch {}

    db.prepare("DELETE FROM utenti WHERE id = ?").run(user.id);

    inviaEmailEliminazione({ email: user.email });

    await jsonGen.exportUsers();

    return { success: true };

  } catch (err) {
    console.error("Eliminazione account:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   6) RESET PASSWORD REQUEST
========================================================= */
async function resetPasswordRequest(req) {
  console.log("[DEBUG utenti] resetPasswordRequest()");

  try {
    let { codice_fiscale } = req.body || {};
    codice_fiscale = (codice_fiscale || "").trim().toUpperCase();

    if (!codice_fiscale || codice_fiscale.length !== 16) {
      return { success: false, error: "Codice fiscale non valido" };
    }

    const user = db.prepare(
      "SELECT * FROM utenti WHERE codice_fiscale = ? LIMIT 1"
    ).get(codice_fiscale);

    if (!user) return { success: false, error: "Utente non trovato" };

    db.prepare("UPDATE utenti SET password_hash = '' WHERE id = ?").run(user.id);

    return { success: true };

  } catch (err) {
    console.error("Reset password request:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   7) RESET PASSWORD CONFIRM
========================================================= */
async function resetPasswordConfirm(req) {
  console.log("[DEBUG utenti] resetPasswordConfirm()");

  try {
    let { nuova_password, codice_fiscale } = req.body || {};

    nuova_password = normalizePassword(nuova_password);
    codice_fiscale = (codice_fiscale || "").trim().toUpperCase();

    if (!nuova_password || !codice_fiscale) {
      return { success: false, error: "Dati mancanti" };
    }

    const user = db.prepare(
      "SELECT * FROM utenti WHERE codice_fiscale = ? LIMIT 1"
    ).get(codice_fiscale);

    if (!user) return { success: false, error: "Utente non trovato" };

    const newHash = hash(nuova_password);
    const newSession = genToken("tok");

    db.prepare("UPDATE utenti SET password_hash = ?, sessione = ? WHERE id = ?")
      .run(newHash, newSession, user.id);

    inviaEmailCambioPassword({ email: user.email });

    try {
      syncBrevoUtenteStatoReale({
        email: user.email,
        credenzialiModificate: true
      });
    } catch {}

    return { success: true, token: newSession, email: user.email };

  } catch (err) {
    console.error("Reset password confirm:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   8) RESET EMAIL REQUEST
========================================================= */
async function resetEmailRequest(req) {
  console.log("[DEBUG utenti] resetEmailRequest()");

  try {
    let { codice_fiscale } = req.body || {};
    codice_fiscale = (codice_fiscale || "").trim().toUpperCase();

    if (!codice_fiscale || codice_fiscale.length !== 16) {
      return { success: false, error: "Codice fiscale non valido" };
    }

    const user = db.prepare(
      "SELECT * FROM utenti WHERE codice_fiscale = ? LIMIT 1"
    ).get(codice_fiscale);

    if (!user) return { success: false, error: "Utente non trovato" };

    db.prepare("UPDATE utenti SET email = '' WHERE id = ?").run(user.id);

    return { success: true };

  } catch (err) {
    console.error("Reset email request:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   9) RESET EMAIL CONFIRM
========================================================= */
async function resetEmailConfirm(req) {
  console.log("[DEBUG utenti] resetEmailConfirm()");

  try {
    let { nuova_email, codice_fiscale } = req.body || {};

    nuova_email = (nuova_email || "").trim().toLowerCase();
    codice_fiscale = (codice_fiscale || "").trim().toUpperCase();

    if (!nuova_email || !codice_fiscale) {
      return { success: false, error: "Dati mancanti" };
    }

    const user = db.prepare(
      "SELECT * FROM utenti WHERE codice_fiscale = ? LIMIT 1"
    ).get(codice_fiscale);

    if (!user) return { success: false, error: "Utente non trovato" };

    const esiste = db.prepare("SELECT id FROM utenti WHERE email = ?").get(nuova_email);
    if (esiste) return { success: false, error: "Email gia in uso" };

    const newSession = genToken("tok");

    db.prepare("UPDATE utenti SET email = ?, sessione = ? WHERE id = ?")
      .run(nuova_email, newSession, user.id);

    inviaEmailCambioEmail({ email: nuova_email });

    try {
      await syncBrevoUtenteStatoReale({
        email: nuova_email,
        emailVecchia: user.email,
        credenzialiModificate: true
      });
    } catch {}

    return { success: true, token: newSession, email: nuova_email };

  } catch (err) {
    console.error("Reset email confirm:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   10) /me
========================================================= */
async function me(req) {
  console.log("[DEBUG utenti] me()");

  try {
    const sessione = getSessionToken(req);
    if (!sessione) {
      return { success: false, error: "Non loggato" };
    }

    const user = db.prepare(`
      SELECT id, email, ruolo, codice_fiscale, created_at
      FROM utenti
      WHERE sessione = ?
      LIMIT 1
    `).get(sessione);

    if (!user) {
      return { success: false, error: "Sessione non valida" };
    }

    return { success: true, utente: user };

  } catch (err) {
    console.error("/me:", err);
    return { success: false, error: "Errore server" };
  }
}
/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
========================================================= */

async function registrazioneUtente(req) {
  console.log("[DEBUG utenti] alias registrazioneUtente() → registrazione()");
  return registrazione(req);
}

async function loginUtente(req) {
  console.log("[DEBUG utenti] alias loginUtente() → login()");
  return login(req);
}

async function cambiaEmailUtente(req) {
  console.log("[DEBUG utenti] alias cambiaEmailUtente() → cambiaEmail()");
  return cambiaEmail(req);
}

async function cambiaPasswordUtente(req) {
  console.log("[DEBUG utenti] alias cambiaPasswordUtente() → cambiaPassword()");
  return cambiaPassword(req);
}

async function eliminaAccountUtente(req) {
  console.log("[DEBUG utenti] alias eliminaAccountUtente() → eliminaAccount()");
  return eliminaAccount(req);
}

async function resetPasswordRequestUtente(req) {
  console.log("[DEBUG utenti] alias resetPasswordRequestUtente() → resetPasswordRequest()");
  return resetPasswordRequest(req);
}

async function resetPasswordConfirmUtente(req) {
  console.log("[DEBUG utenti] alias resetPasswordConfirmUtente() → resetPasswordConfirm()");
  return resetPasswordConfirm(req);
}

async function resetEmailRequestUtente(req) {
  console.log("[DEBUG utenti] alias resetEmailRequestUtente() → resetEmailRequest()");
  return resetEmailRequest(req);
}

async function resetEmailConfirmUtente(req) {
  console.log("[DEBUG utenti] alias resetEmailConfirmUtente() → resetEmailConfirm()");
  return resetEmailConfirm(req);
}

async function meUtente(req) {
  console.log("[DEBUG utenti] alias meUtente() → me()");
  return me(req);
}

/* =========================================================
   EXPORT — stile Java (funzioni + alias)
========================================================= */

module.exports = {
  // funzioni principali
  registrazione,
  login,
  cambiaEmail,
  cambiaPassword,
  eliminaAccount,
  resetPasswordRequest,
  resetPasswordConfirm,
  resetEmailRequest,
  resetEmailConfirm,
  me,

  // alias compatibilità frontend
  registrazioneUtente,
  loginUtente,
  cambiaEmailUtente,
  cambiaPasswordUtente,
  eliminaAccountUtente,
  resetPasswordRequestUtente,
  resetPasswordConfirmUtente,
  resetEmailRequestUtente,
  resetEmailConfirmUtente,
  meUtente
};

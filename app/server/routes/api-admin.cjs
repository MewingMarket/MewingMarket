/* =========================================================
   FILE: app/server/routes/api-admin.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Gestione credenziali Admin
   ORIGINALE: ex router Express /admin/cambia-email, /cambia-password, /me
========================================================= */

const path = require("path");
const crypto = require("crypto");

const R = (p) => require(path.join(process.cwd(), "app/server", p));
const db = R("db/database.cjs");

const CF_ADMIN = "GRSSMN92H25I138W";

/* =========================================================
   UTILS
========================================================= */
function hash(p) {
  return crypto.createHash("sha256").update(String(p)).digest("hex");
}

function normalize(p) {
  return String(p || "").trim();
}

function getAdmin() {
  return db.prepare(`
    SELECT id, email, password_hash, codice_fiscale
    FROM utenti
    WHERE codice_fiscale = ?
    LIMIT 1
  `).get(CF_ADMIN);
}

/* =========================================================
   FUNZIONE 1 — cambiaEmail
   (ex POST /admin/cambia-email)
========================================================= */
async function cambiaEmail(req) {
  try {
    let { nuova, pass } = req.body || {};
    nuova = normalize(nuova).toLowerCase();
    pass = normalize(pass);

    if (!nuova || !pass) {
      return { success: false, error: "Dati mancanti" };
    }

    const admin = getAdmin();
    if (!admin || hash(pass) !== admin.password_hash) {
      return { success: false, error: "Password errata" };
    }

    const esiste = db.prepare("SELECT id FROM utenti WHERE email = ?").get(nuova);
    if (esiste) {
      return { success: false, error: "Email già in uso" };
    }

    db.prepare(`UPDATE utenti SET email = ? WHERE id = ?`).run(nuova, admin.id);

    return {
      success: true,
      message: "Email aggiornata correttamente"
    };

  } catch (err) {
    console.error("❌ Errore cambiaEmail:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   FUNZIONE 2 — cambiaPassword
   (ex POST /admin/cambia-password)
========================================================= */
async function cambiaPassword(req) {
  try {
    let { oldP, newP } = req.body || {};
    oldP = normalize(oldP);
    newP = normalize(newP);

    if (!oldP || !newP) {
      return { success: false, error: "Dati mancanti" };
    }

    const admin = getAdmin();
    if (!admin || hash(oldP) !== admin.password_hash) {
      return { success: false, error: "Password errata" };
    }

    db.prepare(`UPDATE utenti SET password_hash = ? WHERE id = ?`)
      .run(hash(newP), admin.id);

    return {
      success: true,
      message: "Password aggiornata correttamente"
    };

  } catch (err) {
    console.error("❌ Errore cambiaPassword:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   FUNZIONE 3 — adminMe
   (ex GET /admin/me)
========================================================= */
async function adminMe(req) {
  try {
    const admin = getAdmin();
    if (!admin) {
      return { success: false, error: "Admin non trovato" };
    }

    return {
      success: true,
      admin: {
        email: admin.email,
        codice_fiscale: admin.codice_fiscale,
        ruolo: "admin"
      }
    };

  } catch (err) {
    console.error("❌ Errore adminMe:", err);
    return { success: false, error: "Errore server" };
  }
}

/* =========================================================
   EXPORT — stile Java (metodi della classe Admin)
========================================================= */
module.exports = {
  cambiaEmail,
  cambiaPassword,
  adminMe
};

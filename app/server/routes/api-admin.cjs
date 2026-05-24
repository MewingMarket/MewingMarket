/* =========================================================
   FILE: app/server/routes/api-admin.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE: Gestione credenziali Admin
   Versione 2027.503 — compatibile router universale + auth-admin
========================================================= */

const path = require("path");
const crypto = require("crypto");

const R = (p) => require(path.join(process.cwd(), "app/server", p));
const db = R("db/database.cjs");

/* =========================================================
   UTILS
========================================================= */
function hash(p) {
  return crypto.createHash("sha256").update(String(p)).digest("hex");
}

function normalize(p) {
  return String(p || "").trim();
}

function getAdminByCF(cf) {
  return db.prepare(`
    SELECT id, email, password_hash, codice_fiscale
    FROM utenti
    WHERE codice_fiscale = ?
    LIMIT 1
  `).get(cf);
}

function getAdminById(id) {
  return db.prepare(`
    SELECT id, email, password_hash, codice_fiscale
    FROM utenti
    WHERE id = ?
    LIMIT 1
  `).get(id);
}

/* =========================================================
   FUNZIONE 1 — cambiaEmail
========================================================= */
async function cambiaEmail(req) {
  console.log("[DEBUG api-admin] cambiaEmail()");

  try {
    // req.admin è garantito da auth-admin 2027.503
    if (!req.admin || !req.admin.id) {
      return { success: false, error: "Non autorizzato" };
    }

    let { nuova, pass } = req.body || {};
    nuova = normalize(nuova).toLowerCase();
    pass = normalize(pass);

    if (!nuova || !pass) {
      return { success: false, error: "Dati mancanti" };
    }

    const admin = getAdminById(req.admin.id);
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
========================================================= */
async function cambiaPassword(req) {
  console.log("[DEBUG api-admin] cambiaPassword()");

  try {
    if (!req.admin || !req.admin.id) {
      return { success: false, error: "Non autorizzato" };
    }

    let { oldP, newP } = req.body || {};
    oldP = normalize(oldP);
    newP = normalize(newP);

    if (!oldP || !newP) {
      return { success: false, error: "Dati mancanti" };
    }

    const admin = getAdminById(req.admin.id);
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
========================================================= */
async function adminMe(req) {
  console.log("[DEBUG api-admin] adminMe()");

  try {
    // req.admin è impostato da auth-admin
    if (!req.admin || !req.admin.id) {
      return { success: false, error: "Non autorizzato" };
    }

    const admin = getAdminById(req.admin.id);
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
   ALIAS COMPATIBILITÀ FRONTEND
========================================================= */
async function cambia_email(req) {
  console.log("[DEBUG api-admin] alias cambia_email() → cambiaEmail()");
  return cambiaEmail(req);
}

async function cambia_password(req) {
  console.log("[DEBUG api-admin] alias cambia_password() → cambiaPassword()");
  return cambiaPassword(req);
}

async function me(req) {
  console.log("[DEBUG api-admin] alias me() → adminMe()");
  return adminMe(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  cambiaEmail,
  cambiaPassword,
  adminMe,

  // alias compatibilità
  cambia_email,
  cambia_password,
  me
};

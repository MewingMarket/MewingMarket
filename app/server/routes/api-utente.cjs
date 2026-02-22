// =========================================================
// File: app/server/routes/api-utente.cjs
// Registrazione, login, sessione, reset, cambio credenziali
// =========================================================

const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const {
  findUserByEmail,
  createUser,
  updateUser,
  generateSessionToken
} = require("../../modules/user-auth.cjs");

const {
  sendWelcomeEmail,
  sendCredentialsChangedEmail
} = require("../../modules/email-user.cjs");

// Hash password (SHA256 come già usi altrove)
function hashPassword(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// =========================================================
// POST /api/utente/register
// =========================================================
router.post("/utente/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.json({ success: false, error: "Email già registrata" });
    }

    const passwordHash = hashPassword(password);

    const user = await createUser({ email, passwordHash });

    // Email benvenuto
    try {
      await sendWelcomeEmail({ email: user.email });
    } catch (err) {
      console.error("❌ Errore invio email benvenuto:", err);
      // non blocchiamo la registrazione
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore /utente/register:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// POST /api/utente/login
// =========================================================
router.post("/utente/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.json({ success: false, error: "Credenziali non valide" });
    }

    const passwordHash = hashPassword(password);
    if (passwordHash !== user.passwordHash) {
      return res.json({ success: false, error: "Credenziali non valide" });
    }

    const token = generateSessionToken();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 giorni

    await updateUser(user.id, {
      SessionToken: token,
      SessionExpires: expires.toISOString()
    });

    return res.json({
      success: true,
      token,
      email: user.email
    });

  } catch (err) {
    console.error("❌ Errore /utente/login:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// POST /api/utente/validate-token
// =========================================================
router.post("/utente/validate-token", async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.json({ success: false });
    }

    const user = await findUserByEmail(email);
    if (!user) return res.json({ success: false });

    if (user.sessionToken !== token) {
      return res.json({ success: false });
    }

    // opzionale: controllare scadenza
    if (user.sessionExpires) {
      const exp = new Date(user.sessionExpires).getTime();
      if (Date.now() > exp) {
        return res.json({ success: false });
      }
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore /utente/validate-token:", err);
    return res.json({ success: false });
  }
});

// =========================================================
// POST /api/utente/reset-password
// (nessuna email, reset diretto da form)
// =========================================================
router.post("/utente/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    const newHash = hashPassword(newPassword);

    await updateUser(user.id, {
      PasswordHash: newHash
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore /utente/reset-password:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// POST /api/utente/cambia-email
// =========================================================
router.post("/utente/cambia-email", async (req, res) => {
  try {
    const { oldEmail, newEmail, token } = req.body;

    if (!oldEmail || !newEmail || !token) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    const user = await findUserByEmail(oldEmail);
    if (!user || user.sessionToken !== token) {
      return res.json({ success: false, error: "Non autorizzato" });
    }

    // controlla che la nuova email non esista già
    const existing = await findUserByEmail(newEmail);
    if (existing) {
      return res.json({ success: false, error: "Nuova email già in uso" });
    }

    await updateUser(user.id, {
      Email: newEmail
    });

    try {
      await sendCredentialsChangedEmail({ email: newEmail });
    } catch (err) {
      console.error("❌ Errore email cambio credenziali:", err);
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore /utente/cambia-email:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// POST /api/utente/cambia-password
// =========================================================
router.post("/utente/cambia-password", async (req, res) => {
  try {
    const { email, oldPassword, newPassword, token } = req.body;

    if (!email || !oldPassword || !newPassword || !token) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    const user = await findUserByEmail(email);
    if (!user || user.sessionToken !== token) {
      return res.json({ success: false, error: "Non autorizzato" });
    }

    const oldHash = hashPassword(oldPassword);
    if (oldHash !== user.passwordHash) {
      return res.json({ success: false, error: "Password attuale errata" });
    }

    const newHash = hashPassword(newPassword);

    await updateUser(user.id, {
      PasswordHash: newHash
    });

    try {
      await sendCredentialsChangedEmail({ email });
    } catch (err) {
      console.error("❌ Errore email cambio credenziali:", err);
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore /utente/cambia-password:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;

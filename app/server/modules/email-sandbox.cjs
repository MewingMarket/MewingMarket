// =====================================================
// FILE: app/server/modules/email-sandbox.cjs
// SCOPO: Simulatore invio email locale (senza Brevo)
// CREA FILE HTML + JSON PER OGNI EMAIL
// =====================================================

const fs = require("fs");
const path = require("path");

const BASE = path.join(process.cwd(), "email-test");

// Assicurati che la cartella esista
if (!fs.existsSync(BASE)) {
  fs.mkdirSync(BASE, { recursive: true });
}

function timestamp() {
  const d = new Date();
  return d.toISOString().replace(/[:.]/g, "-");
}

/**
 * Simula l'invio email salvando file locali
 */
async function sandboxSend({ email, subject, html, tipo, sender }) {
  const folder = path.join(BASE, timestamp());
  fs.mkdirSync(folder);

  // Salva HTML
  fs.writeFileSync(
    path.join(folder, "email.html"),
    html,
    "utf8"
  );

  // Salva metadati
  fs.writeFileSync(
    path.join(folder, "meta.json"),
    JSON.stringify(
      {
        email,
        subject,
        tipo,
        sender,
        timestamp: new Date().toISOString()
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`📨 [SANDBOX] Email salvata in: ${folder}`);
  return "SANDBOX_OK";
}

module.exports = { sandboxSend };

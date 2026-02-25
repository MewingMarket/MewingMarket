// =========================================================
// API: Elimina Account Utente (CJS COMPATIBILE)
// =========================================================

module.exports = async function eliminaAccount(req, res, db) {
  try {
    const token = req.headers["x-token"];
    const { password } = req.body;

    if (!token || !password) {
      return res.json({ success: false, error: "Token o password mancanti" });
    }

    // 1) Verifica token
    const utente = await db.get(`
      SELECT id, password FROM utenti WHERE token = ?
    `, [token]);

    if (!utente) {
      return res.json({ success: false, error: "Token non valido" });
    }

    // 2) Verifica password
    if (utente.password !== password) {
      return res.json({ success: false, error: "Password errata" });
    }

    const userId = utente.id;

    // 3) Elimina dati collegati
    await db.run(`DELETE FROM ordini WHERE utente_id = ?`, [userId]);
    await db.run(`DELETE FROM recensioni WHERE utente_id = ?`, [userId]);

    // 4) Elimina l’utente
    await db.run(`DELETE FROM utenti WHERE id = ?`, [userId]);

    return res.json({ success: true });

  } catch (err) {
    console.error("Errore elimina account:", err);
    return res.json({ success: false, error: "Errore del server" });
  }
};

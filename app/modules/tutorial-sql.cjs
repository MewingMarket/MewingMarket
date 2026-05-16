/**
 * FILE: tutorial-sql.cjs
 * PATH: /app/modules/tutorial/tutorial-sql.cjs
 * DESC: Query SQL per Tutorial AI (Professore Bot)
 */

const db = require("../db.cjs");

module.exports = {
  async getBySlug(slug) {
    const [rows] = await db.query(
      "SELECT * FROM tutorial WHERE slug = ? LIMIT 1",
      [slug]
    );
    return rows[0] || null;
  },

  async listAll() {
    const [rows] = await db.query(
      "SELECT * FROM tutorial ORDER BY created_at DESC"
    );
    return rows;
  }
};

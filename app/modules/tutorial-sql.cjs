/**
 * FILE: tutorial-sql.cjs
 * PATH: /app/modules/tutorial/tutorial-sql.cjs
 * DESC: Query SQL per Tutorial AI (Professore Bot)
 * FIX: Usa database ufficiale SQLite + query corrette
 */

const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

module.exports = {
  /* ============================================================
     GET BY SLUG
  ============================================================ */
  getBySlug(slug) {
    try {
      return db.prepare(
        `SELECT *
         FROM tutorial
         WHERE slug = ?
         LIMIT 1`
      ).get(slug) || null;
    } catch (err) {
      console.error("tutorial-sql.getBySlug ERROR:", err);
      return null;
    }
  },

  /* ============================================================
     LIST ALL
  ============================================================ */
  listAll() {
    try {
      return db.prepare(
        `SELECT *
         FROM tutorial
         ORDER BY created_at DESC`
      ).all();
    } catch (err) {
      console.error("tutorial-sql.listAll ERROR:", err);
      return [];
    }
  },

  /* ============================================================
     SAVE (INSERT OR UPDATE)
  ============================================================ */
  save({ slug, testo, video_url }) {
    try {
      if (!slug || !video_url) return false;

      const existing = this.getBySlug(slug);

      if (existing) {
        db.prepare(
          `UPDATE tutorial
           SET testo = ?, video_url = ?, updated_at = CURRENT_TIMESTAMP
           WHERE slug = ?`
        ).run(testo || existing.testo, video_url, slug);

        return true;
      }

      db.prepare(
        `INSERT INTO tutorial (slug, testo, video_url, created_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      ).run(slug, testo || "", video_url);

      return true;

    } catch (err) {
      console.error("tutorial-sql.save ERROR:", err);
      return false;
    }
  }
};

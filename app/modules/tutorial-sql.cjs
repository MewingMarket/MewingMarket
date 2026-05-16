/**
 * FILE: tutorial-sql.cjs
 * PATH: /app/modules/tutorial/tutorial-sql.cjs
 * DESC: Query SQL per Tutorial AI (Professore Bot)
 */

const db = require("../db.cjs");

module.exports = {
  /* ============================================================
     GET BY SLUG
  ============================================================ */
  async getBySlug(slug) {
    const [rows] = await db.query(
      "SELECT * FROM tutorial WHERE slug = ? LIMIT 1",
      [slug]
    );
    return rows[0] || null;
  },

  /* ============================================================
     LIST ALL
  ============================================================ */
  async listAll() {
    const [rows] = await db.query(
      "SELECT * FROM tutorial ORDER BY created_at DESC"
    );
    return rows;
  },

  /* ============================================================
     SAVE (INSERT OR UPDATE)
     - slug: string
     - testo: testo guida
     - video_url: percorso pubblico video
  ============================================================ */
  async save({ slug, testo, video_url }) {
    if (!slug || !video_url) return false;

    // Se esiste → update
    const existing = await this.getBySlug(slug);

    if (existing) {
      await db.query(
        "UPDATE tutorial SET testo = ?, video_url = ?, updated_at = NOW() WHERE slug = ?",
        [testo || existing.testo, video_url, slug]
      );
      return true;
    }

    // Se non esiste → insert
    await db.query(
      "INSERT INTO tutorial (slug, testo, video_url, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
      [slug, testo || "", video_url]
    );

    return true;
  }
};

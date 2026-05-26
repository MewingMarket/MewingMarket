/**
 * FILE: social-sql.cjs
 * PATH: /app/modules/social/social-sql.cjs
 * DESC: Query SQL per Social AI (Influencer Bot)
 * FIX: Usa database ufficiale SQLite + query corrette
 */

const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

module.exports = {
  /**
   * Lista tutti i post per piattaforma
   * Ordine: data_pubblicazione DESC
   */
  list(platform) {
    try {
      return db.prepare(
        `SELECT *
         FROM social_posts
         WHERE piattaforma = ?
         ORDER BY data_pubblicazione DESC`
      ).all(platform);
    } catch (err) {
      console.error("social-sql.list ERROR:", err);
      return [];
    }
  },

  /**
   * Ritorna un post casuale per piattaforma
   */
  getRandom(platform) {
    try {
      return db.prepare(
        `SELECT *
         FROM social_posts
         WHERE piattaforma = ?
         ORDER BY RANDOM()
         LIMIT 1`
      ).get(platform) || null;
    } catch (err) {
      console.error("social-sql.getRandom ERROR:", err);
      return null;
    }
  }
};

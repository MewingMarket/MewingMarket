/**
 * FILE: social-sql.cjs
 * PATH: /app/modules/social/social-sql.cjs
 * DESC: Query SQL per Social AI (Influencer Bot)
 */

const db = require("../db.cjs");

module.exports = {
  async list(platform) {
    const [rows] = await db.query(
      "SELECT * FROM social_posts WHERE piattaforma = ? ORDER BY data_pubblicazione DESC",
      [platform]
    );
    return rows;
  },

  async getRandom(platform) {
    const [rows] = await db.query(
      "SELECT * FROM social_posts WHERE piattaforma = ? ORDER BY RAND() LIMIT 1",
      [platform]
    );
    return rows[0] || null;
  }
};

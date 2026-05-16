/**
 * FILE: social.cjs
 * PATH: /app/modules/social/social.cjs
 * DESC: Wrapper logico Social AI (Influencer Bot)
 */

const socialSQL = require("./social-sql.cjs");

module.exports = {
  async getLatest(platform) {
    return await socialSQL.list(platform);
  },

  async getRandom(platform) {
    return await socialSQL.getRandom(platform);
  }
};

/**
 * FILE: video-cache.cjs
 * PATH: /app/server/modules/video-cache.cjs
 * DESC: Cache in memoria dei tutorial generati (per non rigenerarli).
 */

const cache = new Map();

/* ============================================================
   GET
============================================================ */
function getCachedTutorial(key) {
  if (!key) return null;
  return cache.get(key) || null;
}

/* ============================================================
   SET
============================================================ */
function setCachedTutorial(key, url) {
  if (!key || !url) return false;
  cache.set(key, url);
  return true;
}

/* ============================================================
   CLEAR (opzionale ma utile)
============================================================ */
function clearTutorialCache() {
  cache.clear();
}

module.exports = {
  getCachedTutorial,
  setCachedTutorial,
  clearTutorialCache
};

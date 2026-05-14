/**
 * FILE: video-cache.cjs
 * PATH: /app/server/modules/video-cache.cjs
 * DESC: Cache in memoria dei tutorial generati (per non rigenerarli).
 */

const cache = new Map();

/**
 * getCachedTutorial
 */
function getCachedTutorial(key) {
  return cache.get(key) || null;
}

/**
 * setCachedTutorial
 */
function setCachedTutorial(key, url) {
  cache.set(key, url);
}

module.exports = {
  getCachedTutorial,
  setCachedTutorial
};

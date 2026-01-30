// modules/memory.js

// Memoria temporanea per utente (MAX MODE)
const memoryStore = {};

module.exports = {
  push(uid, text) {
    if (!memoryStore[uid]) memoryStore[uid] = [];
    memoryStore[uid].push(text);

    // Mantieni solo gli ultimi 6 messaggi
    if (memoryStore[uid].length > 6) {
      memoryStore[uid].shift();
    }
  },

  get(uid) {
    return memoryStore[uid] || [];
  }
};

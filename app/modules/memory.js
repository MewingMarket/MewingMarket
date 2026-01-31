// modules/memory.js — VERSIONE MAX

/*
  Struttura memoria per ogni utente:
  {
    messages: [ "testo1", "testo2", ... ],
    prefs: { chiavi dinamiche },
    ts: 1730000000000
  }
*/

const memoryStore = {};

module.exports = {
  // Aggiunge un messaggio alla memoria
  push(uid, text) {
    if (!memoryStore[uid]) {
      memoryStore[uid] = { messages: [], prefs: {}, ts: Date.now() };
    }

    const mem = memoryStore[uid];

    mem.messages.push(text);
    mem.ts = Date.now();

    // Mantieni solo gli ultimi 8 messaggi (MAX MODE)
    if (mem.messages.length > 8) {
      mem.messages.shift();
    }
  },

  // Recupera memoria conversazionale
  get(uid) {
    const mem = memoryStore[uid];

    if (!mem) return [];

    // Se la memoria è troppo vecchia (> 45 minuti), reset
    if (mem.ts && Date.now() - mem.ts > 45 * 60 * 1000) {
      memoryStore[uid] = { messages: [], prefs: {}, ts: Date.now() };
      return [];
    }

    return mem.messages;
  },

  // Salva preferenze utente (es: “preferisco video”, “voglio consigli brevi”)
  setPref(uid, key, value) {
    if (!memoryStore[uid]) {
      memoryStore[uid] = { messages: [], prefs: {}, ts: Date.now() };
    }
    memoryStore[uid].prefs[key] = value;
    memoryStore[uid].ts = Date.now();
  },

  // Recupera preferenze
  getPrefs(uid) {
    if (!memoryStore[uid]) return {};
    return memoryStore[uid].prefs || {};
  },

  // Reset totale (se mai servisse)
  reset(uid) {
    memoryStore[uid] = { messages: [], prefs: {}, ts: Date.now() };
  }
};

/* =========================================================
 * DIAGNOSTICA LITE — LOG SOLO SE C'È UNA NOVITÀ
 * =========================================================
 */

function mb(bytes) {
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function logMem(prefix = "") {
  const m = process.memoryUsage();
  console.log(
    `🧠 ${prefix} RAM → RSS: ${mb(m.rss)}, HeapUsed: ${mb(m.heapUsed)}, Ext: ${mb(m.external)}`
  );
}

console.log("=========================================================");
console.log("🟦 DIAGNOSTICA LITE ATTIVA (solo variazioni RAM)");
console.log("=========================================================");

logMem("BOOT");

// 🔥 Stato precedente per confronti
let last = {
  rss: process.memoryUsage().rss,
  heap: process.memoryUsage().heapUsed,
  ext: process.memoryUsage().external
};

// 🔥 Soglia di variazione (in byte)
const THRESHOLD = 5 * 1024 * 1024; // 5 MB

setInterval(() => {
  const m = process.memoryUsage();

  const diffRSS = Math.abs(m.rss - last.rss);
  const diffHeap = Math.abs(m.heapUsed - last.heap);
  const diffExt = Math.abs(m.external - last.ext);

  // Se nessuna variazione significativa → non loggare
  if (diffRSS < THRESHOLD && diffHeap < THRESHOLD && diffExt < THRESHOLD) {
    return;
  }

  // Altrimenti logga
  logMem("VARIAZIONE");

  // Aggiorna stato precedente
  last = {
    rss: m.rss,
    heap: m.heapUsed,
    ext: m.external
  };

}, 5000); // puoi anche aumentare a 10s se vuoi

// Hook su ping
module.exports = {
  logPing() {
    logMem("PING");
    console.log("⏱️  Uptime:", process.uptime().toFixed(1), "sec");
  }
};

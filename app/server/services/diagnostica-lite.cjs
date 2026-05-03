/* =========================================================
 * DIAGNOSTICA LITE — NON INFLUISCE SUL SERVER
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
console.log("🟦 DIAGNOSTICA LITE ATTIVA");
console.log("=========================================================");

logMem("BOOT");

// Log RAM ogni 10 secondi
setInterval(() => {
  logMem("INTERVAL");
}, 10000);

// Hook su ping (senza modificare il tuo /api/ping)
module.exports = {
  logPing() {
    logMem("PING");
    console.log("⏱️  Uptime:", process.uptime().toFixed(1), "sec");
  }
};

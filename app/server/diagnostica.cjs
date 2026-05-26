// =========================================================
// diagnostica.cjs — DISATTIVATO IN PRODUZIONE (SAFE MODE)
// =========================================================

module.exports = {
  hookServer() {
    console.log("🟧 diagnostica DISATTIVATA (SAFE MODE)");
  },
  hookRouter() {
    // niente log
  }
};

// ============================================================================
// FILE: app/server/utils/rewrites.cjs
// HTML SCRIPT REWRITER — DISATTIVATO PER PAGINE HTML
// ============================================================================
console.log(">>> REWRITER ATTIVO:", __filename);
module.exports = function rewriteScripts(html) {
  try {

    // ============================================================================
    // 🔥 PATCH DEFINITIVA
    // NON riscrivere MAI pagine HTML
    // (il critical-loader gestisce già tutto)
    // ============================================================================
    if (html.includes("<html") || html.includes("<!DOCTYPE html")) {
      return html;
    }

    // ============================================================================
    // Se non è HTML → NON toccare nulla
    // ============================================================================
    return html;

  } catch (err) {
    console.error("❌ rewriteScripts ERROR:", err);
    return html;
  }
};

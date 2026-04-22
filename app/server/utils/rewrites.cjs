// ============================================================================
// FILE: app/server/utils/rewrites.cjs
// HTML SCRIPT REWRITER — MewingMarket (versione robusta + PATCH DEFINITIVA)
// ----------------------------------------------------------------------------
// Disattiva completamente la riscrittura per le pagine HTML che usano il critical-loader.
// Evita rimozione, duplicazione o riordinamento degli script.
// ============================================================================

module.exports = function rewriteScripts(html) {
  try {
    // 🔥 PATCH CRITICA — NON riscrivere pagine HTML
    if (html.includes("<html")) {
      return html;
    }

    // Se non è HTML, restituisci invariato
    return html;

  } catch (err) {
    console.error("❌ rewriteScripts ERROR:", err);
    return html;
  }
};

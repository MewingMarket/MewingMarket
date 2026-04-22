// ============================================================================
// FILE: app/server/utils/rewrites.cjs
// HTML SCRIPT REWRITER — MewingMarket (versione robusta + PATCH DEFINITIVA)
// ----------------------------------------------------------------------------
// Garantisce ordine corretto degli script:
//
//   1) loader.js
//   2) dynamic-loader.js
//   3) tutti i JS di pagina (in ordine originale)
//
// PATCH 2027.800:
//   - Disattiva rewriter per tutte le pagine che usano il critical-loader
//     (mm-api.js, loader.js, dynamic-loader.js)
//   - Evita rimozione/duplicazione script critici
// ============================================================================

module.exports = function rewriteScripts(html) {
  try {

    // ============================================================================
    // 🔥 PATCH CRITICA — NON riscrivere pagine che usano il critical-loader
    // ============================================================================
    if (
      html.includes("mm-api.js") ||
      html.includes("loader.js") ||
      html.includes("dynamic-loader.js")
    ) {
      return html; // NON toccare questa pagina
    }

    // ============================================================================
    // Regex robusta per catturare TUTTI gli script con src
    // ============================================================================
    const scriptRegex = /<script\b[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi;

    let match;
    const pageScripts = [];
    let loaderScript = null;
    let dynamicScript = null;

    // Estrai tutti gli script
    while ((match = scriptRegex.exec(html)) !== null) {
      const src = match[1];

      // loader.js
      if (/loader\.js/i.test(src)) {
        loaderScript = match[0];
        continue;
      }

      // dynamic-loader.js
      if (/dynamic-loader\.js/i.test(src)) {
        dynamicScript = match[0];
        continue;
      }

      // Tutti gli altri = JS di pagina
      pageScripts.push(match[0]);
    }

    // Se manca loader.js → non riscrivere nulla
    if (!loaderScript) return html;

    // Fallback: dynamic-loader.js non trovato? Cerca nei pageScripts
    if (!dynamicScript) {
      const idx = pageScripts.findIndex(s => /dynamic-loader\.js/i.test(s));
      if (idx !== -1) {
        dynamicScript = pageScripts[idx];
        pageScripts.splice(idx, 1);
      }
    }

    // ============================================================================
    // Rimuovi TUTTI gli script originali
    // ============================================================================
    let cleaned = html.replace(scriptRegex, "");

    // ============================================================================
    // Ricostruisci l’ordine corretto
    // ============================================================================
    const rebuiltScripts = [
      loaderScript,
      dynamicScript || "",
      ...pageScripts
    ].join("\n");

    // Inserisci PRIMA di </body>
    cleaned = cleaned.replace("</body>", rebuiltScripts + "\n</body>");

    return cleaned;

  } catch (err) {
    console.error("❌ rewriteScripts ERROR:", err);
    return html; // fallback sicuro
  }
};

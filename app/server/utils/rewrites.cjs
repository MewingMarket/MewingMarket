// ============================================================================
// FILE: app/server/utils/rewrites.cjs
// HTML SCRIPT REWRITER — MewingMarket (versione robusta)
// ----------------------------------------------------------------------------
// Garantisce ordine corretto degli script:
//
//   1) loader.js
//   2) dynamic-loader.js
//   3) tutti i JS di pagina (in ordine originale)
//
// Compatibile con:
//   - querystring (?v=xxxx)
//   - spazi e attributi vari
//   - tag troncati o formattati male
//   - HTML minificato
// ============================================================================

module.exports = function rewriteScripts(html) {
  try {
    // Regex robusta per catturare TUTTI gli script con src
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

      // dynamic-loader.js (regex più robusta)
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

    // Rimuovi TUTTI gli script originali
    let cleaned = html.replace(scriptRegex, "");

    // Ricostruisci l’ordine corretto
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

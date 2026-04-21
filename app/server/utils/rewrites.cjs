// ============================================================================
// FILE: app/server/utils/rewrites.cjs
// HTML SCRIPT REWRITER — MewingMarket
// ----------------------------------------------------------------------------
// Scopo:
//   - Intercetta l'HTML generato dal server
//   - Estrae tutti i tag <script>
//   - Identifica loader.js e dynamic-loader.js
//   - Identifica TUTTI i JS di pagina (qualsiasi nome)
//   - Riscrive l'ordine corretto:
//
//        1) loader.js
//        2) dynamic-loader.js
//        3) tutti i JS di pagina (in ordine originale)
//
//   - Reinserisce gli script PRIMA di </body>
//   - Ritorna l'HTML riscritto
//
// Questo garantisce bootstrap stabile e indipendente dall'ordine negli HTML.
// ============================================================================

module.exports = function rewriteScripts(html) {
  try {
    // Trova tutti i tag <script src="..."></script>
    const scriptRegex = /<script\b[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi;

    let match;
    const pageScripts = [];
    let loaderScript = null;
    let dynamicScript = null;

    // Estrai tutti gli script
    while ((match = scriptRegex.exec(html)) !== null) {
      const src = match[1];

      if (src.includes("loader.js")) {
        loaderScript = match[0];
      } else if (src.includes("dynamic-loader.js")) {
        dynamicScript = match[0];
      } else {
        pageScripts.push(match[0]);
      }
    }

    // Se non c’è loader, non riscrivere nulla
    if (!loaderScript) return html;

    // Rimuovi TUTTI gli script originali
    let cleaned = html.replace(scriptRegex, "");

    // Ricostruisci l’ordine corretto
    const rebuiltScripts = [
      loaderScript,
      dynamicScript || "",
      ...pageScripts
    ].join("\n");

    // Inserisci gli script PRIMA della chiusura </body>
    cleaned = cleaned.replace("</body>", rebuiltScripts + "\n</body>");

    return cleaned;

  } catch (err) {
    console.error("❌ rewriteScripts ERROR:", err);
    return html; // fallback sicuro
  }
};

/* =========================================================
   mm-api.js — Versione SBLOCCO TOTALE (2027.930)
   FIX: Eliminati loop infiniti, forzata comunicazione SQL
========================================================= */

console.log("🚀 mm-api.js: Modalità Turbo-Sblocco Attiva");

window.fetchUniversale = async function(path, options = {}, cfg = {}) {
    const token = localStorage.getItem("token") || localStorage.getItem("mewing_token");
    
    // 1. Normalizzazione del Percorso (Forza /api)
    let fullPath = path;
    if (!path.startsWith("/api") && !path.startsWith("http")) {
        fullPath = `/api${path.startsWith("/") ? "" : "/"}${path}`;
    }

    // 2. Iniezione Header Sicura
    const defaultHeaders = {
        "Authorization": token ? `Bearer ${token}` : "",
        "Content-Type": "application/json"
    };

    options.headers = { ...defaultHeaders, ...(options.headers || {}) };
    
    // Configurazione retry
    const retries = cfg.retries || 1;
    
    console.log(`📡 Chiamata SQL: ${fullPath}`);

    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(fullPath, options);

            // Se il server risponde, restituiamo direttamente la risposta originale
            // Senza passarla per makeJsonResponse che la "corrompe"
            if (response.ok) return response;

            // Se l'errore è 401/403, inutile riprovare
            if (response.status === 401 || response.status === 403) {
                console.error("🔒 Errore Autorizzazione su:", fullPath);
                return response;
            }

        } catch (err) {
            console.warn(`⚠️ Tentativo ${i+1} fallito per: ${fullPath}`);
            if (i === retries) throw err;
            await new Promise(r => setTimeout(r, 300)); // Breve attesa
        }
    }
};

// Manteniamo le altre funzioni per compatibilità ma le dirottiamo sulla fetchUniversale sbloccata
window.apiFetch = window.fetchUniversale;
window.fetchCritico = window.fetchUniversale;
window.fetchNormale = window.fetchUniversale;

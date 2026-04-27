console.log("🚀 mm-api.js: Modalità Compatibilità Attiva");

/**
 * fetchUniversale — versione compatibile con backend SENZA /api
 */
window.fetchUniversale = async function(path, options = {}, cfg = {}) {
    const token = localStorage.getItem("token") || localStorage.getItem("mewing_token");

    // 1. NON aggiungiamo /api
    let fullPath = path;

    // 2. Header
    const defaultHeaders = {
        "Authorization": token ? `Bearer ${token}` : "",
        "Content-Type": "application/json"
    };

    options.headers = { ...defaultHeaders, ...(options.headers || {}) };

    const retries = cfg.retries || 1;

    console.log(`📡 Chiamata: ${fullPath}`);

    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(fullPath, options);

            if (response.ok) return response;

            if (response.status === 401 || response.status === 403) {
                console.error("🔒 Errore Autorizzazione su:", fullPath);
                return response;
            }

        } catch (err) {
            console.warn(`⚠️ Tentativo ${i+1} fallito per: ${fullPath}`);
            if (i === retries) throw err;
            await new Promise(r => setTimeout(r, 300));
        }
    }
};

// Compatibilità
window.apiFetch = window.fetchUniversale;
window.fetchCritico = window.fetchUniversale;
window.fetchNormale = window.fetchUniversale;

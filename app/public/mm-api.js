console.log("🚀 mm-api.js: Modalità API-FORCED Attiva");

/**
 * fetchUniversale — forza tutte le chiamate sotto /api
 */
window.fetchUniversale = async function(path, options = {}, cfg = {}) {
    const token = localStorage.getItem("token") || localStorage.getItem("mewing_token");

    // 1. Forza /api davanti a tutto
    let fullPath = path;
    if (!path.startsWith("/api") && !path.startsWith("http")) {
        fullPath = `/api${path.startsWith("/") ? "" : "/"}${path}`;
    }

    // 2. Header
    const defaultHeaders = {
        "Authorization": token ? `Bearer ${token}` : "",
        "Content-Type": "application/json"
    };

    options.headers = { ...defaultHeaders, ...(options.headers || {}) };

    const retries = cfg.retries || 1;

    console.log(`📡 Chiamata API: ${fullPath}`);

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

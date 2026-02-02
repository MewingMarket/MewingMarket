/* =========================================================
   UTM.JS — VERSIONE PREMIUM BLINDATA
   Lettura, salvataggio e propagazione UTM
========================================================= */

let mmUTM = {};

/* =========================================================
   FUNZIONE: LEGGI PARAMETRI UTM DALL'URL
========================================================= */
function getUTMFromURL() {
  const params = new URLSearchParams(window.location.search);
  const utm = {};

  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(key => {
    const value = params.get(key);
    if (value) utm[key] = value;
  });

  return utm;
} 
/* =========================================================
   FUNZIONE: SALVA UTM IN LOCALSTORAGE
========================================================= */
function saveUTM(utm) {
  try {
    const existing = JSON.parse(localStorage.getItem("mm_utm") || "{}");

    // First-touch: non sovrascrivere se già esiste
    const merged = { ...utm, ...existing };

    localStorage.setItem("mm_utm", JSON.stringify(merged));
    mmUTM = merged;
  } catch (err) {
    console.warn("Errore salvataggio UTM:", err);
  }
}

/* =========================================================
   FUNZIONE: INVIA UTM AL SERVER
========================================================= */
function sendUTMToServer() {
  try {
    fetch("/tracking/utm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        utm: mmUTM,
        url: window.location.href
      })
    });
  } catch (err) {
    console.warn("Errore invio UTM:", err);
  }
} /* =========================================================
   AVVIO AUTOMATICO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const utmFromURL = getUTMFromURL();

  // Se ci sono UTM nell'URL → salva
  if (Object.keys(utmFromURL).length > 0) {
    saveUTM(utmFromURL);
  } else {
    // Se non ci sono → carica quelli salvati
    try {
      mmUTM = JSON.parse(localStorage.getItem("mm_utm") || "{}");
    } catch {
      mmUTM = {};
    }
  }

  // Invia sempre al server
  sendUTMToServer();
});

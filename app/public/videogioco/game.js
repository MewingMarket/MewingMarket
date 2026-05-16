/*
  FILE: game.js
  PATH: /app/public/videogioco/game.js
  DESC: Logica schermate videogioco: flusso, nome, avatar, bot, transizioni, navbar.
*/

/* ============================================================
   NAVIGAZIONE TRA LE SCHERMATE
============================================================ */
function goTo(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.style.display = "none");
  const target = document.getElementById(screenId);
  if (target) target.style.display = "block";

  // Forza chatbox visibile quando entri in chat
  if (screenId === "screen-chat") {
    setTimeout(() => {
      const chatPanel = document.getElementById("chat-panel");
      if (chatPanel) chatPanel.style.display = "flex";

      // Se c'è un bot attivo, aggiorna avatar in chat
      const activeBot = localStorage.getItem("active_bot") || "generic";
      if (typeof window.changeAvatar === "function") {
        window.changeAvatar(activeBot);
      }
    }, 50);
  }

  // Quando entri nello screen "Caricamento" → carica lista partite
  if (screenId === "screen-loading") {
    loadGameList();
  }

  // Quando entri in home, ricarica avatar saggio
  if (screenId === "screen-home") {
    loadHomeAvatar();
  }
}

/* ============================================================
   SALVA ED ESCI
============================================================ */
async function exitGame() {
  await saveGameState();
  localStorage.removeItem("active_bot");
  localStorage.removeItem("welcome_sage_pending");
  window.location.href = "/";
}

/* ============================================================
   LOGIN → SALVA NOME
============================================================ */
function saveName() {
  const input = document.getElementById("player-name");
  const name = (input.value || "").trim();
  if (!name) return;
  localStorage.setItem("player_name", name);
  goTo("screen-avatar");
}

/* ============================================================
   SCELTA AVATAR UOMO/DONNA
============================================================ */
let selectedAvatar = null;

document.addEventListener("click", e => {
  const card = e.target.closest(".avatar-card");
  if (!card) return;

  document.querySelectorAll(".avatar-card")
    .forEach(c => c.classList.remove("selected"));

  card.classList.add("selected");
  selectedAvatar = card.dataset.avatar;

  const btn = document.getElementById("avatar-confirm");
  if (btn) btn.disabled = false;
});

/* Conferma avatar */
function confirmAvatar() {
  if (!selectedAvatar) return;

  localStorage.setItem("player_avatar", selectedAvatar);

  const name = localStorage.getItem("player_name") || "";
  const titleEl = document.getElementById("welcome-title");
  if (titleEl) titleEl.textContent = `Benvenuto ${name}!`;

  loadHomeAvatar();

  // Messaggio del saggio alla prima entrata in chat
  localStorage.setItem("welcome_sage_pending", "1");

  // Reset XP / LEVEL / MISSIONI alla prima partita
  localStorage.setItem("player_xp", "0");
  localStorage.setItem("player_level", "1");
  localStorage.setItem("player_missions", "[]");

  goTo("screen-home");
}

/* Avatar saggio in home */
function loadHomeAvatar() {
  const gender = localStorage.getItem("player_avatar");
  const homeAvatar = document.getElementById("home-avatar");
  if (!homeAvatar) return;

  homeAvatar.src = gender === "female"
    ? "/videogioco/donna saggia.png"
    : "/videogioco/uomo saggio.png";
}

/* ============================================================
   SCELTA BOT → LOGICA COMPLETA
============================================================ */
function chooseBot(botName) {

  /* ---------------------------------------------
     BOT GENERICO = NARRATORE (NON APRE LA CHAT)
  ---------------------------------------------- */
  if (botName === "generic") {

    const gender = localStorage.getItem("player_avatar");
    const npc = gender === "female" ? "donna saggia" : "uomo saggio";

    // Avatar fermo
    const homeAvatar = document.getElementById("home-avatar");
    if (homeAvatar) {
      homeAvatar.src = `/videogioco/${npc}.png`;
    }

    // Messaggio animato
    const msg = document.getElementById("home-message");
    if (msg) {
      msg.classList.remove("typewriter");
      void msg.offsetWidth; // reset animazione
      msg.classList.add("typewriter");

      msg.innerHTML = "Io sono la tua guida.<br>Da qui puoi scegliere un bot per iniziare.";
    }

    // NON aprire la chat
    return;
  }

  /* ---------------------------------------------
     ALTRI BOT → APRONO LA CHAT
  ---------------------------------------------- */
  localStorage.setItem("active_bot", botName);

  if (typeof window.changeAvatar === "function") {
    window.changeAvatar(botName);
  }

  goTo("screen-chat");
}

/* ============================================================
   NUOVA PARTITA
============================================================ */
function startNewGame() {
  localStorage.clear();

  // ⭐ RESET XP / LEVEL / MISSIONI
  localStorage.setItem("player_xp", "0");
  localStorage.setItem("player_level", "1");
  localStorage.setItem("player_missions", "[]");

  goTo("screen-login");
}

/* ============================================================
   SALVATAGGIO PARTITA (BACKEND)
============================================================ */
async function saveGameState() {
  const lim = document.getElementById("lim-screen");

  const payload = {
    name: localStorage.getItem("player_name") || "",
    avatar: localStorage.getItem("player_avatar") || "",
    bot: localStorage.getItem("active_bot") || "",
    lastMessage: localStorage.getItem("last_message") || "",
    limState: lim ? lim.innerHTML : "",

    // ⭐ NUOVI CAMPI
    xp: parseInt(localStorage.getItem("player_xp") || "0", 10),
    level: parseInt(localStorage.getItem("player_level") || "1", 10),
    missions: localStorage.getItem("player_missions") || "[]"
  };

  try {
    await fetch("/api/game/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    // silenzioso
  }
}

/* ============================================================
   LISTA PARTITE PER COMBO BOX
============================================================ */
async function loadGameList() {
  const res = await fetch("/api/game/list", { method: "POST" });
  const json = await res.json();

  const select = document.getElementById("saved-games");
  if (!select) return;

  select.innerHTML = `<option value="">Seleziona una partita...</option>`;

  if (!json.success) return;

  json.data.forEach(p => {
    const opt = document.createElement("option");
    const date = new Date(p.updated_at).toLocaleString("it-IT");
    opt.value = p.id;
    opt.textContent = `${p.name} — ${date}`;
    select.appendChild(opt);
  });
}

/* ============================================================
   CARICA PARTITA SELEZIONATA
============================================================ */
async function loadSelectedGame() {
  const select = document.getElementById("saved-games");
  if (!select) return;

  const id = select.value;
  if (!id) return;

  const res = await fetch("/api/game/loadOne", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  const json = await res.json();
  if (!json.success) return;

  const data = json.data;

  localStorage.setItem("player_name", data.name || "");
  localStorage.setItem("player_avatar", data.avatar || "");
  localStorage.setItem("active_bot", data.bot || "");
  localStorage.setItem("last_message", data.lastMessage || "");

  // ⭐ NUOVI CAMPI
  localStorage.setItem("player_xp", data.xp || "0");
  localStorage.setItem("player_level", data.level || "1");
  localStorage.setItem("player_missions", data.missions || "[]");

  const lim = document.getElementById("lim-screen");
  if (lim) lim.innerHTML = data.limState || "";

  goTo("screen-chat");
}

/* ============================================================
   AVVIO DEL GIOCO
============================================================ */
window.addEventListener("load", () => {
  goTo("screen-launcher");
});

/* ============================================================
   EXPORT FUNZIONI PER HTML INLINE
============================================================ */
window.goTo = goTo;
window.saveName = saveName;
window.confirmAvatar = confirmAvatar;
window.chooseBot = chooseBot;
window.loadHomeAvatar = loadHomeAvatar;
window.exitGame = exitGame;
window.startNewGame = startNewGame;
window.saveGameState = saveGameState;
window.loadGameList = loadGameList;
window.loadSelectedGame = loadSelectedGame;

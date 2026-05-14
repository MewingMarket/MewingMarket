/*
  FILE: game.js
  PATH: /app/public/videogioco/game.js
  DESC: Logica schermate videogioco: flusso, nome, avatar, bot, transizioni, navigazione.
*/

/* ============================================================
   NAVIGAZIONE TRA LE SCHERMATE
============================================================ */
function goTo(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.style.display = "none");
  const target = document.getElementById(screenId);
  if (target) target.style.display = "block";

  // Forza la chatbox visibile quando entri in chat
  if (screenId === "screen-chat") {
    setTimeout(() => {
      const chatPanel = document.getElementById("chat-panel");
      if (chatPanel) chatPanel.style.display = "flex";
    }, 50);
  }
}

/* ============================================================
   SALVA ED ESCI
============================================================ */
function exitGame() {
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

  document.getElementById("avatar-confirm").disabled = false;
});

/* Conferma avatar */
function confirmAvatar() {
  if (!selectedAvatar) return;

  localStorage.setItem("player_avatar", selectedAvatar);

  const name = localStorage.getItem("player_name") || "";
  document.getElementById("welcome-title").textContent = `Benvenuto ${name}!`;

  loadHomeAvatar();

  // Mostra messaggio del saggio alla prima entrata in chat
  localStorage.setItem("welcome_sage_pending", "1");

  goTo("screen-home");
}

/* Avatar saggio in home */
function loadHomeAvatar() {
  const gender = localStorage.getItem("player_avatar");
  const homeAvatar = document.getElementById("home-avatar");

  homeAvatar.src = gender === "female"
    ? "/videogioco/donna saggia.png"
    : "/videogioco/uomo saggio.png";
}

/* ============================================================
   SCELTA BOT → CAMBIO AVATAR + ENTRA IN CHAT
============================================================ */
function chooseBot(botName) {
  localStorage.setItem("active_bot", botName);

  // Aggiorna avatar se chat.js è già caricato
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
  goTo("screen-login");
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

/*
  FILE: game.js
  PATH: /app/public/videogioco/game.js
  DESC: Logica schermate videogioco: flusso, nome, avatar, bot, transizioni.
*/

function goTo(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.style.display = "none");
  const target = document.getElementById(screenId);
  if (target) target.style.display = "block";
}

function saveName() {
  const input = document.getElementById("player-name");
  const name = (input.value || "").trim();
  if (!name) return;
  localStorage.setItem("player_name", name);
  goTo("screen-avatar");
}

let selectedAvatar = null;

/* Selezione avatar uomo/donna */
document.addEventListener("click", e => {
  const card = e.target.closest(".avatar-card");
  if (!card) return;
  document.querySelectorAll(".avatar-card").forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");
  selectedAvatar = card.dataset.avatar;
  document.getElementById("avatar-confirm").disabled = false;
});

function confirmAvatar() {
  if (!selectedAvatar) return;
  localStorage.setItem("player_avatar", selectedAvatar);

  const name = localStorage.getItem("player_name") || "";
  document.getElementById("welcome-title").textContent = `Benvenuto ${name}!`;

  // avatar generico in home
  loadHomeAvatar();

  // flag per messaggio di benvenuto in chat
  localStorage.setItem("welcome_sage_pending", "1");

  goTo("screen-home");
}

/* Carica avatar saggio in base al genere */
function loadHomeAvatar() {
  const gender = localStorage.getItem("player_avatar");
  const homeAvatar = document.getElementById("home-avatar");
  homeAvatar.src = gender === "female"
    ? "/videogioco/donna saggia.png"
    : "/videogioco/uomo saggio.png";
}

/* Scelta bot → cambia avatar + va in chat */
function chooseBot(botName) {
  localStorage.setItem("active_bot", botName);

  // se chat.js è già caricato, aggiorna subito l’avatar
  if (typeof window.changeAvatar === "function") {
    window.changeAvatar(botName);
  }

  goTo("screen-chat");
}

/* Avvio */
window.addEventListener("load", () => {
  goTo("screen-launcher");
});

/* Esport per HTML inline */
window.goTo = goTo;
window.saveName = saveName;
window.confirmAvatar = confirmAvatar;
window.chooseBot = chooseBot;
window.loadHomeAvatar = loadHomeAvatar;

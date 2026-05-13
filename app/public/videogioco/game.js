/* =========================================================
 * GAME ENGINE 2027 — NAVIGAZIONE + STATO GIOCO
 * Launcher → Login → Avatar → Home → Chat
 * ========================================================= */

function goTo(screenId) {
  document.querySelectorAll(".screen").forEach(s => {
    s.style.display = "none";
  });
  const target = document.getElementById(screenId);
  if (target) target.style.display = "block";
}

/* LOGIN */

function saveName() {
  const input = document.getElementById("player-name");
  if (!input) return;

  const name = input.value.trim();
  if (!name) return;

  localStorage.setItem("player_name", name);
  goTo("screen-avatar");
}

/* AVATAR */

let selectedAvatar = null;

document.addEventListener("click", e => {
  const card = e.target.closest(".avatar-card");
  if (!card) return;

  document.querySelectorAll(".avatar-card").forEach(c =>
    c.classList.remove("selected")
  );

  card.classList.add("selected");
  selectedAvatar = card.dataset.avatar;

  const confirmBtn = document.getElementById("avatar-confirm");
  if (confirmBtn) confirmBtn.disabled = false;
});

function confirmAvatar() {
  if (!selectedAvatar) return;

  localStorage.setItem("player_avatar", selectedAvatar);

  const name = localStorage.getItem("player_name") || "";
  const title = document.getElementById("welcome-title");
  if (title) title.textContent = `Benvenuto ${name}!`;

  // avatar di default: saggio uomo/donna
  const avatarImg = document.getElementById("avatar-img");
  if (avatarImg) {
    const npc = selectedAvatar === "male" ? "uomo saggio" : "donna saggia";
    avatarImg.src = `/videogioco/${npc}.png`;
  }

  // flag per messaggio di benvenuto in chat
  localStorage.setItem("welcome_sage_pending", "1");

  goTo("screen-home");
}

/* BOT SELECTOR */

function setBot(botName) {
  localStorage.setItem("active_bot", botName);
}

/* AVVIO INIZIALE */

window.addEventListener("load", () => {
  goTo("screen-launcher");

  const savedAvatar = localStorage.getItem("player_avatar");
  const avatarImg = document.getElementById("avatar-img");

  if (savedAvatar && avatarImg) {
    const npc = savedAvatar === "male" ? "uomo saggio" : "donna saggia";
    avatarImg.src = `/videogioco/${npc}.png`;
  }
});

/* ESPORT FUNZIONI GLOBALI */

window.goTo = goTo;
window.saveName = saveName;
window.confirmAvatar = confirmAvatar;
window.setBot = setBot;

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

/* ===========================
 * LOGIN
 * ===========================
 */
function saveName() {
  const input = document.getElementById("player-name");
  if (!input) return;

  const name = input.value.trim();
  if (!name) return;

  localStorage.setItem("player_name", name);
  goTo("screen-avatar");
}

/* ===========================
 * AVATAR
 * ===========================
 */
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

  // aggiorna avatar anche nella chat
  const avatarImg = document.getElementById("avatar-img");
  if (avatarImg) avatarImg.src = `/avatars/${selectedAvatar}.png`;

  goTo("screen-home");
}

/* ===========================
 * BOT SELECTOR
 * ===========================
 */
function setBot(botName) {
  localStorage.setItem("active_bot", botName);
}

/* ===========================
 * AVVIO INIZIALE
 * ===========================
 */
window.addEventListener("load", () => {
  // schermata iniziale: launcher
  goTo("screen-launcher");

  // se esiste già un avatar salvato, aggiorna la chat
  const savedAvatar = localStorage.getItem("player_avatar");
  if (savedAvatar) {
    const avatarImg = document.getElementById("avatar-img");
    if (avatarImg) avatarImg.src = `/avatars/${savedAvatar}.png`;
  }

  // se esiste già un nome, potresti saltare il login (opzionale)
  // const savedName = localStorage.getItem("player_name");
  // if (savedName && savedAvatar) goTo("screen-home");
});

/* ===========================
 * ESPORT FUNZIONI GLOBALI
 * (se servono inline in HTML)
 * ===========================
 */
window.goTo = goTo;
window.saveName = saveName;
window.confirmAvatar = confirmAvatar;
window.setBot = setBot;

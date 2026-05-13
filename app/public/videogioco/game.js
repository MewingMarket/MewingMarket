function goTo(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.style.display = "none");
  document.getElementById(screenId).style.display = "block";
}

function saveName() {
  const name = document.getElementById("player-name").value.trim();
  if (!name) return;
  localStorage.setItem("player_name", name);
  goTo("screen-avatar");
}

let selectedAvatar = null;

document.addEventListener("click", e => {
  const card = e.target.closest(".avatar-card");
  if (!card) return;
  document.querySelectorAll(".avatar-card").forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");
  selectedAvatar = card.dataset.avatar;
  document.getElementById("avatar-confirm").disabled = false;
});

function confirmAvatar() {
  localStorage.setItem("player_avatar", selectedAvatar);
  const name = localStorage.getItem("player_name");
  document.getElementById("welcome-title").textContent = `Benvenuto ${name}!`;
  localStorage.setItem("welcome_sage_pending", "1");
  goTo("screen-home");
  loadHomeAvatar();
}

function loadHomeAvatar() {
  const gender = localStorage.getItem("player_avatar");
  const homeAvatar = document.getElementById("home-avatar");
  homeAvatar.src = gender === "female"
    ? "/videogioco/donna saggia.png"
    : "/videogioco/uomo saggio.png";
}

function chooseBot(botName) {
  localStorage.setItem("active_bot", botName);
  goTo("screen-chat");
}

window.goTo = goTo;
window.saveName = saveName;
window.confirmAvatar = confirmAvatar;
window.chooseBot = chooseBot;

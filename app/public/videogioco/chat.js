document.addEventListener("DOMContentLoaded", () => {

  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const avatarImg = document.getElementById("avatar-img");

  function clean(t) {
    return typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";
  }

  function addMessage(text, sender = "bot") {
    const bubble = document.createElement("div");
    bubble.className = sender === "user" ? "chat-bubble user" : "chat-bubble bot";
    bubble.innerHTML = clean(text);
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function changeAvatar(botName) {
    const gender = localStorage.getItem("player_avatar");
    const map = {
      vendor: gender === "female" ? "donna manager" : "uomo manager",
      influencer: gender === "female" ? "influencer donna" : "influencer uomo",
      professor: gender === "female" ? "professoressa" : "professore",
      newsletter: gender === "female" ? "postina" : "postino",
      generic: gender === "female" ? "donna saggia" : "uomo saggio"
    };
    avatarImg.src = `/videogioco/${map[botName]}.png`;
  }

  const welcomePending = localStorage.getItem("welcome_sage_pending");
  if (welcomePending === "1") {
    const gender = localStorage.getItem("player_avatar");
    const npc = gender === "female" ? "donna saggia" : "uomo saggio";
    avatarImg.src = `/videogioco/${npc}.png`;
    addMessage("Benvenuto nel gioco!", "bot");
    addMessage("Io sarò la tua guida. Ora scegli un bot per iniziare.", "bot");
    localStorage.removeItem("welcome_sage_pending");
  }

  async function apiChat(path, options = {}) {
    try {
      const res = await fetch(path, options);
      const json = await res.json();
      return json.data;
    } catch {
      addMessage("❌ Errore rete.");
      return null;
    }
  }

  async function sendTextMessage() {
    const message = clean(chatInput.value);
    if (!message) return;
    addMessage(message, "user");
    chatInput.value = "";
    const bot = localStorage.getItem("active_bot") || "generic";
    const data = await apiChat("/api/chat/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, bot })
    });
    if (data?.avatar) changeAvatar(data.avatar);
    if (data?.text) addMessage(data.text, "bot");
  }

  chatSend.addEventListener("click", sendTextMessage);

});

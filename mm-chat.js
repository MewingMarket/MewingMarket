(function() {
  const messages = document.getElementById("mm-chat-messages");
  const input = document.getElementById("mm-text");
  const sendBtn = document.getElementById("mm-send");

  const replies = {
    "prodotti": "🛒 Ecco il nostro store: https://payhip.com/MewingMarket",
    "supporto": "🛠 Email supporto: supporto@mewingmarket.it",
    "newsletter": "📩 Iscriviti qui: https://mewingmarket.it/iscrizione.html",
    "link": "🌐 Link principali:\nSito: https://www.mewingmarket.it\nFacebook: https://www.facebook.com/profile.php?id=61584779793628\nInstagram: https://www.instagram.com/mewingmarket\nYouTube: https://www.youtube.com/@mewingmarket2\nLinkedIn: https://www.linkedin.com/in/simone-griseri-5368a7394"
  };

  function bot(text) {
    messages.innerHTML += `<div class="mm-msg mm-bot">${text}</div>`;
    messages.scrollTop = messages.scrollHeight;
  }

  function user(text) {
    messages.innerHTML += `<div class="mm-msg mm-user">${text}</div>`;
    messages.scrollTop = messages.scrollHeight;
  }

  function menu() {
    bot("💬 Scegli un'opzione:");
    messages.innerHTML += `
      <button class="menu-btn" onclick="quick('prodotti')">🛒 Prodotti</button>
      <button class="menu-btn" onclick="quick('supporto')">🛠 Supporto</button>
      <button class="menu-btn" onclick="quick('newsletter')">📩 Newsletter</button>
      <button class="menu-btn" onclick="quick('link')">🌐 Link & Social</button>
    `;
    messages.scrollTop = messages.scrollHeight;
  }

  window.quick = function(key) {
    if(replies[key]) {
      user(key);
      bot(replies[key]);
      menu(); // torna al menu
    }
  }

  sendBtn.onclick = () => {
    const msg = input.value.trim();
    if(!msg) return;

    user(msg);
    const msgLower = msg.toLowerCase();

    if(msgLower.includes("prodotto")) quick("prodotti");
    else if(msgLower.includes("support")) quick("supporto");
    else if(msgLower.includes("newsletter")) quick("newsletter");
    else if(msgLower.includes("link")) quick("link");
    else bot("🤔 Non ho capito bene. Scegli dal menu.");
    
    input.value = "";
  }
})();

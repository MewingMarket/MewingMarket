

// Gestione cookie mm_uid (se non esiste, lo crea lato server, ma qui ci assicuriamo di mandarlo sempre)
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Elementi base
const chatBody = document.getElementById("chat-body");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

// Funzione per aggiungere bolle
function addMessage(text, sender = "bot", isHtml = true) {
  const bubble = document.createElement("div");
  bubble.classList.add("bubble", sender === "bot" ? "bot" : "user");
  if (isHtml) {
    bubble.innerHTML = text;
  } else {
    bubble.innerText = text;
  }
  chatBody.appendChild(bubble);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Messaggio di benvenuto automatico
window.addEventListener("load", () => {
  addMessage(
    "<b>👋 Benvenuto, sono l’assistente di MewingMarket!</b><br>Sono qui per aiutarti con l’acquisto di HERO, il supporto tecnico, la newsletter o qualsiasi informazione sui nostri servizi.<br><br>Scrivi pure la tua domanda: ti accompagno io passo dopo passo.",
    "bot",
    true
  );
});

// Invio messaggio
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  // Mostra messaggio utente
  addMessage(message, "user", false);
  chatInput.value = "";

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    if (data && data.reply) {
      addMessage(data.reply, "bot", true);
    } else {
      addMessage("⚠️ Si è verificato un problema nel rispondere. Riprova tra poco.", "bot", false);
    }
  } catch (err) {
    addMessage("⚠️ Errore di connessione. Controlla la rete e riprova.", "bot", false);
  }
});

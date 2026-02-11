/* =========================================================
   CHATBOX — VERSIONE COMPLETA CON VOCALE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatVoice = document.getElementById("chat-voice"); // 🎤 pulsante vocale
  const chatContainer = document.getElementById("chat-container");

  let isRecording = false;
  let mediaRecorder = null;
  let audioChunks = [];

  /* =========================================================
     FUNZIONE: AGGIUNGI MESSAGGIO IN CHAT
  ========================================================== */
  function addMessage(text, sender = "bot") {
    const bubble = document.createElement("div");
    bubble.className = sender === "user" ? "chat-bubble user" : "chat-bubble bot";
    bubble.innerHTML = text;
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  /* =========================================================
     INVIO TESTO NORMALE
  ========================================================== */
  async function sendTextMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage(message, "user");
    chatInput.value = "";

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const data = await res.json();
      addMessage(data.reply || "Errore temporaneo.");
    } catch (err) {
      addMessage("Errore di connessione.", "bot");
    }
  }

  chatSend.addEventListener("click", sendTextMessage);
  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter") sendTextMessage();
  });

  /* =========================================================
     🎤 REGISTRAZIONE VOCALE
  ========================================================== */
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        await sendVoiceMessage(audioBlob);
      };

      mediaRecorder.start();
      isRecording = true;
      chatVoice.classList.add("recording");

    } catch (err) {
      addMessage("Non posso accedere al microfono.", "bot");
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      chatVoice.classList.remove("recording");
    }
  }

  chatVoice.addEventListener("click", () => {
    if (!isRecording) startRecording();
    else stopRecording();
  });

  /* =========================================================
     INVIO VOCALE AL SERVER
  ========================================================== */
  async function sendVoiceMessage(blob) {
    addMessage("🎤 Sto elaborando il vocale...", "bot");

    const formData = new FormData();
    formData.append("audio", blob, "audio.webm");

    try {
      const res = await fetch("/chat/voice", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      addMessage(data.reply || "Errore durante la trascrizione.");
    } catch (err) {
      addMessage("Errore di connessione durante il vocale.", "bot");
    }
  }

  /* =========================================================
     AUTO-SCROLL E APERTURA CHAT
  ========================================================== */
  const chatToggle = document.getElementById("chat-toggle");
  if (chatToggle) {
    chatToggle.addEventListener("click", () => {
      chatContainer.classList.toggle("open");
      chatBox.scrollTop = chatBox.scrollHeight;
    });
  }
});

/* =========================================================
   CHATBOX — VERSIONE COMPLETA + PATCH
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatVoice = document.getElementById("chat-voice");
  const chatContainer = document.getElementById("chat-container");
  const chatToggle = document.getElementById("chat-toggle");

  if (!chatBox || !chatInput || !chatSend || !chatContainer || !chatToggle) {
    console.error("Chat: elementi mancanti");
    return;
  }

  /* =========================================================
     SANITIZZAZIONE TESTO
  ========================================================== */
  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  /* =========================================================
     AGGIUNGI MESSAGGIO
  ========================================================== */
  function addMessage(text, sender = "bot") {
    const bubble = document.createElement("div");
    bubble.className = sender === "user" ? "chat-bubble user" : "chat-bubble bot";
    bubble.innerHTML = clean(text);
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  /* =========================================================
     INVIO TESTO
  ========================================================== */
  let sending = false;

  async function sendTextMessage() {
    if (sending) return;
    const message = clean(chatInput.value);
    if (!message) return;

    sending = true;
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

    sending = false;
  }

  chatSend.addEventListener("click", sendTextMessage);

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendTextMessage();
    }
  });

  /* =========================================================
     🎤 REGISTRAZIONE VOCALE
  ========================================================== */
  let isRecording = false;
  let mediaRecorder = null;
  let audioChunks = [];

  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      addMessage("Il tuo dispositivo non supporta la registrazione vocale.", "bot");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        await sendVoiceMessage(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
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
     INVIO VOCALE
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
     APERTURA CHAT — PATCH
  ========================================================== */
  chatToggle.addEventListener("click", () => {
    chatContainer.classList.toggle("open");
    chatToggle.classList.toggle("hide");
    chatBox.scrollTop = chatBox.scrollHeight;
  });
});

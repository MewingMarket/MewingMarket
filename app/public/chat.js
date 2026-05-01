/* =========================================================
   CHATBOX — UNIVERSAL JSON PATCH 2027.970
========================================================= */

document.addEventListener("critical-ready", () => {

  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatVoice = document.getElementById("chat-voice");
  const chatAttach = document.getElementById("chat-attach");
  const chatFile = document.getElementById("chat-file");
  const chatContainer = document.getElementById("chat-container");
  const chatToggle = document.getElementById("chat-toggle");

  if (!chatBox || !chatInput || !chatSend || !chatContainer || !chatToggle) {
    console.error("Chat: elementi mancanti");
    return;
  }

  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  function addMessage(text, sender = "bot") {
    const bubble = document.createElement("div");
    bubble.className = sender === "user" ? "chat-bubble user" : "chat-bubble bot";
    bubble.innerHTML = clean(text);
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  /* =========================================================
     WRAPPER UNIVERSALE CHAT (universal-json)
  ========================================================== */
  async function apiChat(path, options = {}) {
    let res;
    try {
      res = await fetch(path, options);
    } catch (err) {
      console.error("❌ Errore rete:", err);
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error("❌ Risposta NON JSON da", path);
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
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

    const data = await apiChat("/api/chat/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    addMessage(data?.reply || "Errore temporaneo.");

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

    const data = await apiChat("/api/chat/chatVoice", {
      method: "POST",
      body: formData
    });

    addMessage(data?.reply || "Errore durante la trascrizione.");
  }

  /* =========================================================
     📎 ALLEGATI
  ========================================================== */
  if (chatAttach && chatFile) {
    chatAttach.addEventListener("click", () => {
      chatFile.click();
    });

    chatFile.addEventListener("change", async () => {
      const file = chatFile.files[0];
      if (!file) return;

      addMessage("📎 Allegato caricato: " + file.name, "user");

      const formData = new FormData();
      formData.append("file", file);

      const data = await apiChat("/api/chat/chatAttachment", {
        method: "POST",
        body: formData
      });

      addMessage(data?.reply || "Allegato ricevuto.");
    });
  }

  /* =========================================================
     APERTURA CHAT
  ========================================================== */
  chatToggle.addEventListener("click", () => {
    chatContainer.classList.toggle("open");
    chatToggle.classList.toggle("hide");
    chatBox.scrollTop = chatBox.scrollHeight;
  });
});

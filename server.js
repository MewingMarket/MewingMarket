import express from "express";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// Serve tutti i file statici nella cartella public
app.use(express.static(path.join(process.cwd(), "public")));

// Endpoint POST /chat per la chat AI
app.post("/chat", (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ reply: "❌ Messaggio vuoto, scrivi qualcosa." });
  }

  // Risposta di test (qui puoi integrare la vera AI in futuro)
  res.json({
    reply: `🤖 Risposta di test ricevuta: "${message}"`
  });
});

// Tutte le altre richieste GET servono index.html (per React, SPA o siti statici multipagina)
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server attivo sulla porta ${PORT}`));

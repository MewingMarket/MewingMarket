import express from "express";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// Serve tutti i file statici dalla cartella public
app.use(express.static(path.join(process.cwd(), "public")));

// Endpoint POST /chat
app.post("/chat", (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === "") {
    return res.status(400).json({ reply: "❌ Messaggio vuoto, scrivi qualcosa." });
  }

  // Logica di risposta semplice
  let reply = "🤖 Non ho capito la tua richiesta, prova con newsletter o supporto.";

  const msg = message.toLowerCase();
  if (msg.includes("newsletter")) {
    reply = "📧 Puoi iscriverti alla newsletter qui: https://mewingmarket.it/newsletter";
  } else if (msg.includes("supporto")) {
    reply = "💬 Contatta il supporto via email a supporto@mewingmarket.it";
  } else if (msg.includes("hero")) {
    reply = "🚀 HERO è il nostro sistema di risorse digitali AI!";
  }

  res.json({ reply });
});

// Tutte le richieste GET servono index.html (SPA o sito statico multipagina)
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server attivo sulla porta ${PORT}`));

import express from "express";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// Serve file statici
app.use(express.static(path.join(process.cwd(), "public")));

// GET /chat
app.get("/chat", (req, res) => {
    res.send("Chat endpoint attivo. Usa POST.");
});

// POST /chat
app.post("/chat", (req, res) => {
    const { message } = req.body;
    if (!message || message.trim() === "") return res.status(400).json({ reply: "❌ Messaggio vuoto" });
    res.json({ reply: `🤖 Risposta di test ricevuta: "${message}"` });
});

// Tutte le altre richieste restituiscono index.html (SPA friendly)
app.get("*", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server attivo su porta ${PORT}`));

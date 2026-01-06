import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// TEST ROUTE GET
app.get("/chat", (req, res) => {
    res.send("Chat endpoint attivo. Usa POST.");
});

// POST endpoint per la chat
app.post("/chat", (req, res) => {
    const { message } = req.body;

    if (!message || message.trim() === "") {
        return res.status(400).json({ reply: "❌ Messaggio vuoto, scrivi qualcosa." });
    }

    // Qui puoi integrare la logica AI reale o renderla simulata
    const reply = `🤖 Risposta di test ricevuta: "${message}"`;

    res.json({ reply });
});

// Porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server attivo su porta ${PORT}`);
});

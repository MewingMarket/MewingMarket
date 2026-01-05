const express = require("express");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config(); // carica variabili .env

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serve sito statico dalla cartella "public"

// Configurazione OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Endpoint chat AI
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: "Messaggio vuoto" });

    const prompt = `
Sei un assistente AI commerciale per MewingMarket.
- Rispondi a domande su HERO, prezzi, contenuti, acquisto.
- Fornisci link a Payhip e video quando serve.
- Dai supporto download e problemi Payhip.
- Se non capisci, suggerisci newsletter e contatti.
Utente: ${message}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const reply = completion.choices[0]?.message?.content || "Ops, non ho capito 😅";
    res.json({ reply });

  } catch (error) {
    console.error("Errore AI:", error.response?.data || error.message);
    res.status(500).json({ reply: "Ops, qualcosa è andato storto 😅" });
  }
});

// Avvio server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server AI in ascolto su ${PORT}`));

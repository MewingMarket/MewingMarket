const express = require("express");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serve sito statico

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // sicurezza: API key su Render
});

const openai = new OpenAIApi(configuration);

// endpoint AI
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.json({ reply: "Messaggio vuoto" });

    // prompt commerciale + support
    const prompt = `
Sei un assistente AI commerciale per MewingMarket.
- Rispondi a domande su HERO, prezzi, contenuti, acquisto.
- Dai link a Payhip e video quando serve.
- Dai supporto download e problemi Payhip.
- Se non capisci, suggerisci newsletter e contatti.
Utente: ${message}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.json({ reply: "Ops, qualcosa è andato storto 😅" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server AI in ascolto su ${PORT}`));

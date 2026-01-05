const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Config OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Endpoint chat
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: "Messaggio vuoto" });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
      temperature: 0.7,
      max_tokens: 300
    });

    const reply = completion.choices[0]?.message?.content || "Ops, non ho capito 😅";
    res.json({ reply });

  } catch (err) {
    console.error("Errore AI:", err);
    res.status(500).json({ reply: "Ops, qualcosa è andato storto 😅" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server AI in ascolto su ${PORT}`));

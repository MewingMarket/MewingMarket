import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// POST CHAT (usato dal frontend)
app.post("/chat", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ reply: "Messaggio mancante." });
  }

  res.json({
    reply: "Risposta di test ricevuta: " + message
  });
});

// GET di test (browser)
app.get("/chat", (req, res) => {
  res.send("Chat endpoint attivo. Usa POST.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server attivo su porta", PORT);
});

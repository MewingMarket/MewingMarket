import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// TEST ROUTE
app.post("/chat", (req, res) => {
  const { message } = req.body;

  res.json({
    reply: "Risposta di test ricevuta: " + message
  });
});

// opzionale ma utile
app.get("/chat", (req, res) => {
  res.send("Chat endpoint attivo. Usa POST.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server attivo su porta", PORT);
});

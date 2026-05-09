/* =========================================================
   FILE: app/server/services/post-template-generator.cjs
   DESCRIZIONE:
   Genera il post social per un prodotto.
   - Usa OpenRouter se disponibile
   - Altrimenti usa un template statico
========================================================= */

async function generatePostTemplate(product) {
  // Se non c’è la chiave → fallback
  if (!process.env.OPENROUTER_API_KEY) {
    console.log("⚠️ OpenRouter non configurato → uso template statico");

    return {
      title: `🔥 ${product.nome}`,
      short: `${product.descrizione.slice(0, 120)}...`,
      long: product.descrizione,
      cta: "Scopri di più sul sito",
      hashtags: `#${product.categoria} #mewing #mewingmarket #benessere`,
      fullPost: `🔥 ${product.nome}\n\n${product.descrizione}\n\nScopri di più sul sito.\n#${product.categoria} #mewing #mewingmarket`
    };
  }

  // Prompt AI
  const prompt = `
Genera un post social per un prodotto.

DATI PRODOTTO:
Nome: ${product.nome}
Categoria: ${product.categoria}
Descrizione: ${product.descrizione}

FORMATTAZIONE RICHIESTA:
- title: titolo breve e impattante
- short: descrizione breve max 150 caratteri
- long: descrizione lunga
- cta: call to action breve
- hashtags: 5-10 hashtag rilevanti
- fullPost: un post completo pronto per Publer

Rispondi in JSON valido.
`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content || "{}";

    return JSON.parse(text);

  } catch (err) {
    console.log("❌ Errore OpenRouter:", err);

    // fallback di sicurezza
    return {
      title: `🔥 ${product.nome}`,
      short: `${product.descrizione.slice(0, 120)}...`,
      long: product.descrizione,
      cta: "Scopri di più sul sito",
      hashtags: `#${product.categoria} #mewing #mewingmarket`,
      fullPost: `🔥 ${product.nome}\n\n${product.descrizione}\n\nScopri di più sul sito.\n#${product.categoria} #mewing #mewingmarket`
    };
  }
}

module.exports = { generatePostTemplate };

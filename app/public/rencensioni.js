document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const product = params.get("product") || "";
  document.getElementById("productName").textContent = product;

  let rating = 0;

  document.querySelectorAll("#stars span").forEach(star => {
    star.addEventListener("click", () => {
      rating = Number(star.dataset.v);
      document.querySelectorAll("#stars span").forEach(s => {
        s.classList.toggle("active", Number(s.dataset.v) <= rating);
      });
    });
  });

  document.getElementById("sendReview").onclick = async () => {
    const comment = document.getElementById("comment").value.trim();
    const status = document.getElementById("status");

    if (!rating) {
      status.textContent = "Seleziona un numero di stelle.";
      return;
    }

    const res = await fetch("/api/feedback/create", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        prodotto: product,
        rating,
        comment,
        timestamp: new Date().toISOString()
      })
    });

    if (res.ok) {
      status.textContent = "Grazie! Recensione inviata.";
    } else {
      status.textContent = "Errore durante l'invio.";
    }
  };
});

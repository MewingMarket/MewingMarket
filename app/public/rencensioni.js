/* =========================================================
   File: app/public/recensioni.js
   Dashboard Utente — Le mie recensioni
   Versione definitiva 2026 (SOLO LISTA + BOTTONI)
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const listaRecensioni = document.getElementById("listaRecensioni");

  if (!token) {
    listaRecensioni.innerHTML = "<p>Devi effettuare il login.</p>";
    return;
  }

  // ============================
  // CARICA RECENSIONI UTENTE
  // ============================
  async function caricaRecensioni() {
    listaRecensioni.innerHTML = "Caricamento…";

    try {
      const res = await fetch("/api/recensioni/utente", {
        headers: { "Authorization": "Bearer " + token }
      });

      const data = await res.json();

      if (!data.success || data.recensioni.length === 0) {
        listaRecensioni.innerHTML = "<p>Nessuna recensione presente.</p>";
        return;
      }

      listaRecensioni.innerHTML = data.recensioni
        .map(r => `
          <div class="review-item">
            <strong>${r.prodotto_titolo}</strong><br>
            ⭐ ${r.rating}/5<br>
            <em>${new Date(r.data).toLocaleDateString("it-IT")}</em><br><br>
            <p>${r.commento}</p>

            <div class="review-actions">
              <button class="btn-mini btn-edit" data-id="${r.id}">Modifica</button>
              <button class="btn-mini btn-delete" data-id="${r.id}">Elimina</button>
            </div>
          </div>
        `)
        .join("");

      // ============================
      // EVENTI BOTTONI
      // ============================

      // ELIMINA
      document.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;

          if (!confirm("Vuoi davvero eliminare questa recensione?")) return;

          try {
            const res = await fetch("/api/recensioni/elimina", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
              },
              body: JSON.stringify({ id })
            });

            const data = await res.json();

            if (data.success) {
              caricaRecensioni();
            } else {
              alert(data.error || "Errore.");
            }

          } catch {
            alert("Errore di connessione.");
          }
        });
      });

      // MODIFICA
      document.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;

          const nuovoCommento = prompt("Modifica il commento:");
          if (!nuovoCommento || nuovoCommento.trim().length < 5) {
            alert("Commento troppo corto.");
            return;
          }

          const nuovoRating = prompt("Modifica il voto (1-5):");
          const ratingNum = Number(nuovoRating);

          if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
            alert("Voto non valido.");
            return;
          }

          try {
            const res = await fetch("/api/recensioni/modifica", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
              },
              body: JSON.stringify({
                id,
                rating: ratingNum,
                commento: nuovoCommento.trim()
              })
            });

            const data = await res.json();

            if (data.success) {
              caricaRecensioni();
            } else {
              alert(data.error || "Errore.");
            }

          } catch {
            alert("Errore di connessione.");
          }
        });
      });

    } catch {
      listaRecensioni.innerHTML = "<p>Errore caricamento recensioni.</p>";
    }
  }

  caricaRecensioni();
});

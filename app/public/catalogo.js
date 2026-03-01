// ---------------------------
// AGGIUNTA AL CARRELLO (MODEL A — carrello guest OK)
// ---------------------------
document.querySelectorAll(".btn-add-cart").forEach(btn => {
  btn.addEventListener("click", () => {

    const prodotto = {
      slug: btn.dataset.slug,
      titolo: btn.dataset.title,
      prezzo: Number(btn.dataset.price),
      immagine: btn.dataset.img
    };

    // Aggiungi al carrello SEMPRE (anche da non loggato)
    aggiungiAlCarrello(prodotto);

    // Aggiorna badge
    if (typeof aggiornaBadgeCarrello === "function") {
      aggiornaBadgeCarrello();
    }

    // Avviso gentile se non loggato
    if (!isLogged()) {
      alert("Per completare l'acquisto dovrai fare login in checkout.");
    }
  });
});

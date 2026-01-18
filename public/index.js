// Carica prodotti
async function loadProducts() {
  const res = await fetch("/products.json");
  return await res.json();
}

// Popola slider
async function initSlider() {
  const products = await loadProducts();
  const slider = document.getElementById("slider");

  products.slice(0, 3).forEach((p, i) => {
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.style.opacity = i === 0 ? "1" : "0";
    slide.innerHTML = `<img src="${p.immagine}" alt="${p.titolo}">`;
    slider.appendChild(slide);
  });

  let index = 0;
  setInterval(() => {
    const slides = document.querySelectorAll(".slide");
    slides.forEach(s => s.style.opacity = "0");
    slides[index].style.opacity = "1";
    index = (index + 1) % slides.length;
  }, 4000);
}

// Popola sezioni
async function populateSections() {
  const products = await loadProducts();

  const novita = document.getElementById("novita");
  const bestseller = document.getElementById("bestseller");
  const lowcost = document.getElementById("lowcost");

  products.slice(-6).forEach(p => {
    novita.innerHTML += cardHTML(p);
  });

  products
    .filter(p => p.prezzo <= 10)
    .slice(0, 6)
    .forEach(p => {
      lowcost.innerHTML += cardHTML(p);
    });

  products
    .sort((a, b) => (b.vendite || 0) - (a.vendite || 0))
    .slice(0, 6)
    .forEach(p => {
      bestseller.innerHTML += cardHTML(p);
    });
}

function cardHTML(p) {
  return `
    <div class="product-card">
      <img src="${p.immagine}" alt="${p.titolo}">
      <h2>${p.titoloBreve || p.titolo}</h2>
      <p>${p.descrizioneBreve || ""}</p>
      <div class="prezzo">${p.prezzo}€</div>
      <a href="prodotto.html?id=${p.id}" class="btn">Scopri</a>
    </div>
  `;
}

initSlider();
populateSections();

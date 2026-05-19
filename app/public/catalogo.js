/* =========================================================
   CATALOGO — UNIVERSAL JSON PATCH 2027.4 (A1 COMPACT)
========================================================= */

console.log("📌 [CATALOGO] File caricato nel DOM");

(function autorun(){if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",autorun,{once:true});return;}try{if(typeof initPage==="function")initPage();else console.warn("❌ [CATALOGO] initPage() NON trovata");}catch(e){console.error("🔥 [CATALOGO] Errore in initPage():",e);}})();

function initPage(){if(!window.__criticalReady){document.addEventListener("critical-ready",initPage,{once:true});return;}avviaIlCatalogoOra();}

const clean=t=>typeof t==="string"?t.replace(/</g,"&lt;").replace(/>/g,"&gt;").trim():"";

let countdownTimer=null;
function initCountdown(){if(countdownTimer)clearInterval(countdownTimer);const els=document.querySelectorAll(".promo-countdown");if(!els.length)return;const update=()=>{const now=new Date();els.forEach(el=>{const iso=el.dataset.scadenza;if(!iso)return;const end=new Date(iso);const diff=end-now;if(diff<=0){el.textContent="Promo scaduta";return;}const h=Math.floor(diff/3600000);const m=Math.floor((diff%3600000)/60000);el.textContent=`Termina tra ${h}h ${m}m`;});};update();countdownTimer=setInterval(update,60000);}

function cardHTML(p){if(!p)return"";const id=p.id;const titolo=clean(p.titolo_breve||p.titolo||"Prodotto");const img=p.immagine_url||p.immagine||"/placeholder.webp";const desc=clean(p.descrizione_breve||"");const prezzoBaseEuro=(Number(p.prezzo_cent||0)/100).toFixed(2);const hasPromo=p.promo_attiva&&p.prezzo_scontato_cent;const prezzoPromoEuro=hasPromo?(Number(p.prezzo_scontato_cent||0)/100).toFixed(2):null;const vId=p.youtube_video_id||p.video_id;const linkYouTube=vId?`<a href="https://www.youtube.com/watch?v=${vId}" target="_blank" class="yt-link-card">📺 Guarda video</a>`:"";let catArray=[];try{catArray=Array.isArray(p.categoria)?p.categoria:p.categoria?JSON.parse(p.categoria):[];}catch(e){catArray=[];}const catsAttr=catArray.map(c=>clean(c)).join(" ");const badgeHtml=p.promo_attiva?`<div class="promo-badge">${clean(p.promo_badge||"Promo")}</div>`:"";const countdownHtml=p.promo_scadenza?`<p class="promo-countdown" data-scadenza="${p.promo_scadenza}"></p>`:"";const prezzoHtml=hasPromo?`<p class="prezzo"><span class="prezzo-originale">€${prezzoBaseEuro}</span><span class="prezzo-scontato">€${prezzoPromoEuro}</span></p>`:`<p class="prezzo">€${prezzoBaseEuro}</p>`;const prezzoCarrello=hasPromo?p.prezzo_scontato_cent:p.prezzo_cent;return `<div class="product-card" data-cat="${catsAttr}" data-id="${id}"><div class="img-container"><img src="${img}" alt="${titolo}" loading="lazy">${badgeHtml}</div><div class="card-content"><h2>${titolo}</h2><p class="desc-breve">${desc}</p>${linkYouTube}${prezzoHtml}${countdownHtml}<div class="card-buttons"><a href="prodotto.html?id=${id}" class="btn-dettagli">Scopri</a><div class="cart-controls"><button class="btn-add-cart" onclick="window.aggiungiAlCarrello({id:'${id}', titolo:'${titolo}', prezzo_cent:${prezzoCarrello}, immagine:'${img}'})">+</button><button class="btn-remove-cart" onclick="window.rimuoviSingoloDalCarrello('${id}')">-</button></div></div></div></div>`;}

async function apiCatalogo(path,payload={}){try{const res=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const json=await res.json().catch(()=>null);return json||{success:false};}catch(err){console.error("❌ [CATALOGO] Errore rete:",err);return{success:false};}}

async function caricaCatalogoBase(){const res=await apiCatalogo("/api/prodotti-new");if(!res.success)return[];return res.prodotti||[];}

async function caricaCatalogoPersonalizzato(){const res=await apiCatalogo("/api/catalogo/personalizzato");if(!res.success||!Array.isArray(res.prodotti))return null;return res.prodotti.some(p=>p.promo_attiva)?res.prodotti:null;}

let __CATALOGO_GIA_CARICATO__=false;

async function avviaIlCatalogoOra(){if(__CATALOGO_GIA_CARICATO__){console.log("♻️ [CATALOGO] Catalogo già caricato");return;}__CATALOGO_GIA_CARICATO__=true;

const grid=document.getElementById("catalogo")||document.getElementById("grid-prodotti");const catBox=document.getElementById("categorie");if(!grid){console.warn("❌ [CATALOGO] grid-prodotti NON trovato");return;}

let prodotti=[];

try{
  const me=await apiCatalogo("/api/utenti/me");
  const isLogged=me.success&&me.utente;

  if(!isLogged){
    prodotti=await caricaCatalogoBase();
  }else{
    const promoRes=await apiCatalogo("/api/promo/attiva");
    const hasPromo=promoRes.success&&promoRes.promo;

    if(!hasPromo){
      prodotti=await caricaCatalogoBase();
    }else{
      const personalizzato=await caricaCatalogoPersonalizzato();
      prodotti=personalizzato&&personalizzato.length?personalizzato:await caricaCatalogoBase();
    }
  }
}catch(err){
  console.error("🔥 [CATALOGO] Errore:",err);
  prodotti=await caricaCatalogoBase();
}

if(!Array.isArray(prodotti)||!prodotti.length){grid.innerHTML="<p>Nessun prodotto disponibile.</p>";return;}

window.prodottiOriginali=prodotti;
grid.innerHTML=prodotti.map(p=>cardHTML(p)).join("");
initCountdown();

if(catBox){
  const tutte=new Set();
  prodotti.forEach(p=>{let c=[];try{c=Array.isArray(p.categoria)?p.categoria:p.categoria?JSON.parse(p.categoria):[];}catch(e){}c.forEach(cat=>tutte.add(cat));});
  catBox.innerHTML='<button class="btn-cat active" data-cat="all">Tutti</button>';
  tutte.forEach(cat=>{catBox.innerHTML+=`<button class="btn-cat" data-cat="${cat}">${cat}</button>`;});
  setupFiltri();
}}

function setupFiltri(){
  const grid=document.getElementById("catalogo")||document.getElementById("grid-prodotti");

  document.querySelectorAll(".btn-cat").forEach(btn=>{
    btn.onclick=()=>{
      document.querySelectorAll(".btn-cat").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const selected=btn.dataset.cat;
      const filtrati=selected==="all"?window.prodottiOriginali:window.prodottiOriginali.filter(p=>{
        let c=[];try{c=Array.isArray(p.categoria)?p.categoria:p.categoria?JSON.parse(p.categoria):[];}catch(e){}
        return c.includes(selected);
      });
      grid.innerHTML=filtrati.map(p=>cardHTML(p)).join("");
      initCountdown();
    };
  });

  document.querySelectorAll(".btn-filtro").forEach(btn=>{
    btn.onclick=()=>{
      const limite=btn.dataset.prezzo;
      if(btn.id==="reset"){
        grid.innerHTML=window.prodottiOriginali.map(p=>cardHTML(p)).join("");
        initCountdown();
        return;
      }
      const filtrati=window.prodottiOriginali.filter(p=>p.prezzo_cent/100<=Number(limite));
      grid.innerHTML=filtrati.map(p=>cardHTML(p)).join("");
      initCountdown();
    };
  });
}

/* =========================================================
   INIZIALIZZAZIONE
========================================================= */
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",avviaIlCatalogoOra,{once:true});}else{avviaIlCatalogoOra();}
document.addEventListener("critical-ready",avviaIlCatalogoOra,{once:true});

  (function(){
  const btn = document.getElementById("mm-chat-btn");
  const box = document.getElementById("mm-chatbox");
  const messages = document.getElementById("mm-chat-messages");
  const input = document.getElementById("mm-text");
  const sendBtn = document.getElementById("mm-send");

  let typingInterval;

  function bot(text){
    const msg = document.createElement("div");
    msg.className = "mm-msg mm-bot";
    msg.textContent = "";
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;

    let i=0;
    clearInterval(typingInterval);
    typingInterval = setInterval(()=>{
      if(i<text.length){ msg.textContent+=text[i]; i++; messages.scrollTop = messages.scrollHeight; }
      else clearInterval(typingInterval);
    },20);
  }

  function user(text){
    messages.innerHTML += `<div class="mm-msg mm-user">${text}</div>`;
    messages.scrollTop = messages.scrollHeight;
  }

  function menu(){
    const menuHTML = `
      <button class="menu-btn" onclick="quick('prodotti', this)">🛒 Prodotti</button>
      <button class="menu-btn" onclick="quick('supporto', this)">🛠 Supporto</button>
      <button class="menu-btn" onclick="quick('newsletter', this)">📩 Newsletter</button>
      <button class="menu-btn" onclick="quick('link', this)">🌐 Link & Social</button>
    `;
    messages.innerHTML += menuHTML;
    messages.scrollTop = messages.scrollHeight;
  }

  window.quick = function(key, btnElem){
    if(btnElem) btnElem.remove(); // rimuove pulsante cliccato
    if(key==="prodotti") window.open("https://payhip.com/MewingMarket","_blank");
    else if(key==="supporto") window.open("mailto:supporto@mewingmarket.it","_blank");
    else if(key==="newsletter") window.open("https://mewingmarket.it/iscrizione.html","_blank");
    else if(key==="link") window.open("https://www.mewingmarket.it","_blank");
    menu();
  }

  btn.onclick = ()=>{
    box.style.display = box.style.display==="flex"?"none":"flex";
    if(!messages.innerHTML){
      bot("👋 Ciao! Posso aiutarti con prodotti, supporto e newsletter.");
      menu();
    }
  }

  sendBtn.onclick = async ()=>{
    const msg = input.value.trim();
    if(!msg) return;
    user(msg);
    input.value = "";
    bot("💭 Sto scrivendo...");

    try{
      const res = await fetch("https://api.openai.com/v1/chat/completions",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          },
        body: JSON.stringify({
          model:"gpt-3.5-turbo",
          messages:[{role:"user", content:msg}],
          max_tokens:300
        })
      });
      const data = await res.json();
      messages.querySelector(".mm-msg.mm-bot:last-child").remove();
      bot(data.choices[0].message.content);
      menu();
    }catch(err){
      messages.querySelector(".mm-msg.mm-bot:last-child").remove();
      bot("⚠️ Errore di connessione. Riprova più tardi.");
    }
  }
})();

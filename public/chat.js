
const form = document.querySelector("form");
const input = document.querySelector("input");
const chat = document.querySelector("#chat");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  const userBubble = document.createElement("div");
  userBubble.className = "bubble user";
  userBubble.innerText = message;
  chat.appendChild(userBubble);

  input.value = "";

  const response = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await response.json();
  const botBubble = document.createElement("div");
  botBubble.className = "bubble bot";
  botBubble.innerHTML = data.reply;
  chat.appendChild(botBubble);

  chat.scrollTop = chat.scrollHeight;
});

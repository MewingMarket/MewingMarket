/**
 * premium.js
 * Gestione frontend per moduli premium (quick replies, cards, rich messages).
 */

document.addEventListener("click", function (e) {
  const btn = e.target.closest(".mm-quick");
  if (!btn) return;

  const value = btn.dataset.value;
  if (!value) return;

  btn.disabled = true;

  const input = document.querySelector("#message-input");
  const form = document.querySelector("#chat-form");

  if (!input || !form) return;

  input.value = value;
  form.dispatchEvent(new Event("submit"));
});

function scrollChatToBottom() {
  const chat = document.querySelector("#chat-container");
  if (chat) chat.scrollTop = chat.scrollHeight;
}

const observer = new MutationObserver(scrollChatToBottom);
observer.observe(document.body, { childList: true, subtree: true });

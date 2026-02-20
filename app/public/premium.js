/**
 * premium.js
 * Compatibile con chat.js (WhatsApp-style)
 */

document.addEventListener("click", function (e) {
  const btn = e.target.closest(".mm-quick");
  if (!btn) return;

  const value = btn.dataset.value;
  if (!value) return;

  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");

  if (!input || !sendBtn) return;

  input.value = value;
  sendBtn.click();
});

/* Scroll automatico */
const chatBox = document.getElementById("chat-box");
if (chatBox) {
  const observer = new MutationObserver(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
  });
  observer.observe(chatBox, { childList: true });
}

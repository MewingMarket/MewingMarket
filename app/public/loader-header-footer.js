/* ============================
   LOADER HEADER + FOOTER
============================ */

function loadHeader() {
  return fetch("header.html")
    .then(r => r.text())
    .then(h => {
      document.getElementById("header-placeholder").innerHTML = h;
      document.dispatchEvent(new Event("header-loaded"));
    });
}

function loadFooter() {
  return fetch("footer.html")
    .then(r => r.text())
    .then(h => {
      document.getElementById("footer-placeholder").innerHTML = h;
      document.dispatchEvent(new Event("footer-loaded"));
    });
}

loadHeader().then(loadFooter);

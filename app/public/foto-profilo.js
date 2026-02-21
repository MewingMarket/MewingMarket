document.addEventListener("DOMContentLoaded", () => {

  const fileInput = document.getElementById("fileInput");
  const preview = document.getElementById("preview");
  const saveBtn = document.getElementById("saveBtn");
  const status = document.getElementById("status");

  let selectedFile = null;

  // PREVIEW
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    selectedFile = file;

    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // SALVA (localStorage + backend-ready)
  saveBtn.addEventListener("click", async () => {
    if (!selectedFile) {
      status.textContent = "Seleziona una foto prima.";
      status.style.color = "#d00";
      return;
    }

    // Salvataggio locale (temporaneo)
    localStorage.setItem("profilePhoto", preview.src);

    status.textContent = "Foto salvata! (upload su Airtable pronto per il backend)";
    status.style.color = "green";

    // FUTURO BACKEND:
    // const formData = new FormData();
    // formData.append("foto", selectedFile);
    // await fetch("/api/user/upload-photo", { method:"POST", body:formData });
  });

});

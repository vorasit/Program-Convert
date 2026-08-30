const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const dropzoneIdle = document.getElementById("dropzoneIdle");
const dropzoneFile = document.getElementById("dropzoneFile");
const fileNameEl = document.getElementById("fileName");
const fileMetaEl = document.getElementById("fileMeta");
const changeFileBtn = document.getElementById("changeFileBtn");
const controls = document.getElementById("controls");
const targetFormatSelect = document.getElementById("targetFormat");
const convertBtn = document.getElementById("convertBtn");
const statusEl = document.getElementById("status");

let selectedFile = null;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.hidden = false;
}

function hideStatus() {
  statusEl.hidden = true;
}

function getExtension(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

async function handleFileSelected(file) {
  selectedFile = file;
  hideStatus();

  const ext = getExtension(file.name);

  dropzoneIdle.hidden = true;
  dropzoneFile.hidden = false;
  fileNameEl.textContent = file.name;
  fileMetaEl.textContent = formatBytes(file.size);

  try {
    const res = await fetch(`/api/formats?ext=${encodeURIComponent(ext)}`);
    const data = await res.json();

    if (!res.ok) {
      controls.hidden = true;
      showStatus(data.error || "ไม่รองรับไฟล์ประเภทนี้", "error");
      return;
    }

    if (!data.targets.length) {
      controls.hidden = true;
      showStatus("ไม่มีรูปแบบปลายทางที่รองรับสำหรับไฟล์นี้", "error");
      return;
    }

    targetFormatSelect.innerHTML = data.targets
      .map((t) => `<option value="${t}">${t.toUpperCase()}</option>`)
      .join("");
    controls.hidden = false;
  } catch (err) {
    controls.hidden = true;
    showStatus("ไม่สามารถตรวจสอบประเภทไฟล์ได้", "error");
  }
}

function resetFile() {
  selectedFile = null;
  fileInput.value = "";
  dropzoneIdle.hidden = false;
  dropzoneFile.hidden = true;
  controls.hidden = true;
  hideStatus();
}

dropzone.addEventListener("click", () => fileInput.click());

changeFileBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  resetFile();
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length) {
    handleFileSelected(fileInput.files[0]);
  }
});

["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
  });
});

dropzone.addEventListener("drop", (e) => {
  const files = e.dataTransfer.files;
  if (files.length) {
    handleFileSelected(files[0]);
  }
});

convertBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  const targetFormat = targetFormatSelect.value;
  convertBtn.disabled = true;
  showStatus("กำลังแปลงไฟล์...", "info");

  const formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("targetFormat", targetFormat);

  try {
    const res = await fetch("/api/convert", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "แปลงไฟล์ล้มเหลว");
    }

    const blob = await res.blob();
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
    const downloadName = `${baseName}.${targetFormat}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    showStatus("แปลงไฟล์สำเร็จ ดาวน์โหลดไฟล์เรียบร้อยแล้ว", "success");
  } catch (err) {
    showStatus(err.message, "error");
  } finally {
    convertBtn.disabled = false;
  }
});

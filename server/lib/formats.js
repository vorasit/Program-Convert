// นิยามประเภทไฟล์และรูปแบบปลายทางที่รองรับสำหรับแต่ละหมวดหมู่
const CATEGORIES = {
  document: {
    label: "เอกสาร",
    extensions: ["pdf", "doc", "docx", "odt", "rtf", "txt"],
    targets: ["pdf", "docx", "odt", "rtf", "txt"],
    engine: "office",
  },
  spreadsheet: {
    label: "สเปรดชีต",
    extensions: ["xls", "xlsx", "ods", "csv"],
    targets: ["xlsx", "ods", "csv", "pdf"],
    engine: "office",
  },
  presentation: {
    label: "งานนำเสนอ",
    extensions: ["ppt", "pptx", "odp"],
    targets: ["pptx", "odp", "pdf"],
    engine: "office",
  },
  image: {
    label: "รูปภาพ",
    extensions: ["jpg", "jpeg", "png", "webp", "gif", "tiff", "avif"],
    targets: ["jpg", "png", "webp", "gif", "tiff", "pdf"],
    engine: "image",
  },
  audio: {
    label: "เสียง",
    extensions: ["mp3", "wav", "ogg", "aac", "flac", "m4a"],
    targets: ["mp3", "wav", "ogg", "aac", "flac"],
    engine: "media",
  },
  video: {
    label: "วิดีโอ",
    extensions: ["mp4", "mov", "avi", "mkv", "webm", "flv"],
    targets: ["mp4", "webm", "avi", "mov", "mp3", "wav"],
    engine: "media",
  },
};

function normalizeExt(ext) {
  return String(ext || "").replace(/^\./, "").toLowerCase();
}

function detectCategory(ext) {
  const norm = normalizeExt(ext);
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (cat.extensions.includes(norm)) return { key, ...cat };
  }
  return null;
}

function getTargets(ext) {
  const cat = detectCategory(ext);
  if (!cat) return [];
  const norm = normalizeExt(ext);
  return cat.targets.filter((t) => t !== norm);
}

module.exports = { CATEGORIES, normalizeExt, detectCategory, getTargets };

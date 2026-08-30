const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");

const { detectCategory, getTargets, normalizeExt } = require("./lib/formats");
const { convertWithOffice } = require("./lib/converters/office");
const { convertImage } = require("./lib/converters/image");
const { convertMedia } = require("./lib/converters/media");

const app = express();
const PORT = process.env.PORT || 3000;
const TMP_ROOT = path.join(__dirname, "..", "tmp");
const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB

const upload = multer({
  dest: TMP_ROOT,
  limits: { fileSize: MAX_FILE_SIZE },
});

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/formats", (req, res) => {
  const ext = normalizeExt(req.query.ext);
  const category = detectCategory(ext);
  if (!category) {
    return res.status(404).json({ error: "ไม่รองรับไฟล์ประเภทนี้" });
  }
  res.json({
    category: category.key,
    label: category.label,
    targets: getTargets(ext),
  });
});

app.post("/api/convert", upload.single("file"), async (req, res) => {
  const file = req.file;
  const targetExt = normalizeExt(req.body.targetFormat);

  if (!file) {
    return res.status(400).json({ error: "กรุณาแนบไฟล์ที่ต้องการแปลง" });
  }

  const jobDir = path.join(TMP_ROOT, crypto.randomUUID());
  const originalExt = normalizeExt(path.extname(file.originalname));
  const inputPath = path.join(jobDir, `input.${originalExt}`);

  const category = detectCategory(originalExt);
  const validTargets = category ? getTargets(originalExt) : [];
  if (!category || !validTargets.includes(targetExt)) {
    await fs.rm(file.path, { force: true }).catch(() => {});
    return res.status(400).json({
      error: category
        ? "รูปแบบปลายทางที่เลือกไม่ถูกต้องสำหรับไฟล์นี้"
        : "ไม่รองรับไฟล์ต้นทางประเภทนี้",
    });
  }

  try {
    await fs.mkdir(jobDir, { recursive: true });
    await fs.rename(file.path, inputPath);

    let outputPath;
    if (category.engine === "office") {
      outputPath = await convertWithOffice(inputPath, jobDir, targetExt);
    } else if (category.engine === "image") {
      outputPath = path.join(jobDir, `output.${targetExt}`);
      await convertImage(inputPath, outputPath, targetExt);
    } else if (category.engine === "media") {
      outputPath = path.join(jobDir, `output.${targetExt}`);
      await convertMedia(inputPath, outputPath, targetExt);
    } else {
      throw new Error("ไม่รองรับการแปลงประเภทนี้");
    }

    const downloadName = `${path.basename(
      file.originalname,
      path.extname(file.originalname)
    )}.${targetExt}`;

    res.download(outputPath, downloadName, async (err) => {
      await fs.rm(jobDir, { recursive: true, force: true });
      if (err) console.error("ส่งไฟล์ผิดพลาด:", err.message);
    });
  } catch (err) {
    console.error(err);
    await fs.rm(jobDir, { recursive: true, force: true }).catch(() => {});
    res.status(500).json({ error: err.message || "แปลงไฟล์ล้มเหลว" });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `อัปโหลดไฟล์ผิดพลาด: ${err.message}` });
  }
  console.error(err);
  res.status(500).json({ error: "เกิดข้อผิดพลาดที่ไม่คาดคิด" });
});

async function ensureTmpDir() {
  await fs.mkdir(TMP_ROOT, { recursive: true });
}

ensureTmpDir().then(() => {
  app.listen(PORT, () => {
    console.log(`เซิร์ฟเวอร์ทำงานที่ http://localhost:${PORT}`);
  });
});

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const CANDIDATE_PATHS = [
  "soffice",
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
];

let resolvedBinary = null;

function findSofficeBinary() {
  if (resolvedBinary) return resolvedBinary;
  for (const candidate of CANDIDATE_PATHS) {
    if (candidate === "soffice" || fs.existsSync(candidate)) {
      resolvedBinary = candidate;
      return candidate;
    }
  }
  return null;
}

// แปลงเอกสาร/สเปรดชีต/งานนำเสนอด้วย LibreOffice headless
function convertWithOffice(inputPath, outputDir, targetExt) {
  return new Promise((resolve, reject) => {
    const binary = findSofficeBinary();
    if (!binary) {
      reject(
        new Error(
          "ไม่พบโปรแกรม LibreOffice (soffice) กรุณาติดตั้งก่อนใช้งานการแปลงเอกสาร"
        )
      );
      return;
    }

    const args = [
      "--headless",
      "--norestore",
      "--convert-to",
      targetExt,
      "--outdir",
      outputDir,
      inputPath,
    ];

    const child = spawn(binary, args, { windowsHide: true });

    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => reject(err));

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`LibreOffice แปลงไฟล์ล้มเหลว (code ${code}): ${stderr}`));
        return;
      }
      const baseName = path.basename(inputPath, path.extname(inputPath));
      const outputPath = path.join(outputDir, `${baseName}.${targetExt}`);
      if (!fs.existsSync(outputPath)) {
        reject(new Error("แปลงไฟล์สำเร็จแต่ไม่พบไฟล์ผลลัพธ์"));
        return;
      }
      resolve(outputPath);
    });
  });
}

module.exports = { convertWithOffice };

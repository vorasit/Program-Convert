const sharp = require("sharp");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs/promises");

const SHARP_FORMATS = new Set(["jpg", "jpeg", "png", "webp", "gif", "tiff", "avif"]);

// แปลงรูปภาพระหว่างฟอร์แมตต่างๆ รวมถึงรูปภาพ -> PDF (หน้าเดียว)
async function convertImage(inputPath, outputPath, targetExt) {
  if (targetExt === "pdf") {
    return imageToPdf(inputPath, outputPath);
  }

  const format = targetExt === "jpg" ? "jpeg" : targetExt;
  if (!SHARP_FORMATS.has(targetExt) && format !== "jpeg") {
    throw new Error(`ไม่รองรับการแปลงเป็นฟอร์แมต ${targetExt}`);
  }

  await sharp(inputPath).toFormat(format).toFile(outputPath);
  return outputPath;
}

async function imageToPdf(inputPath, outputPath) {
  const imageBuffer = await sharp(inputPath).jpeg().toBuffer();
  const metadata = await sharp(imageBuffer).metadata();

  const pdfDoc = await PDFDocument.create();
  const jpgImage = await pdfDoc.embedJpg(imageBuffer);
  const page = pdfDoc.addPage([metadata.width, metadata.height]);
  page.drawImage(jpgImage, {
    x: 0,
    y: 0,
    width: metadata.width,
    height: metadata.height,
  });

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, pdfBytes);
  return outputPath;
}

module.exports = { convertImage };

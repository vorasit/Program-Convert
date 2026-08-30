const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

const AUDIO_ONLY_TARGETS = new Set(["mp3", "wav", "ogg", "aac", "flac", "m4a"]);

// แปลงไฟล์เสียง/วิดีโอด้วย ffmpeg รองรับกรณีดึงเสียงออกจากวิดีโอด้วย
function convertMedia(inputPath, outputPath, targetExt) {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath).output(outputPath);

    if (AUDIO_ONLY_TARGETS.has(targetExt)) {
      command = command.noVideo();
    }

    command
      .on("error", (err) => reject(err))
      .on("end", () => resolve(outputPath))
      .run();
  });
}

module.exports = { convertMedia };

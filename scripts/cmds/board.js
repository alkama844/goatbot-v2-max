const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "board",
    version: "1.0.2",
    author: "NAFIJ PRO",
    countDown: 5,
    role: 0,
    shortDescription: "Write text on a board",
    longDescription: "Writes custom text on a board image. Supports reply or direct input.",
    category: "pro",
    guide: {
      en: "{pn} your text OR reply to a message to write it on the board",
    },
  },

  wrapText: function (ctx, text, maxWidth) {
    return new Promise(resolve => {
      if (ctx.measureText(text).width < maxWidth) return resolve([text]);
      const words = text.split(' ');
      const lines = [];
      let line = '';
      while (words.length > 0) {
        let split = false;
        while (ctx.measureText(words[0]).width >= maxWidth) {
          const temp = words[0];
          words[0] = temp.slice(0, -1);
          if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
          else {
            split = true;
            words.splice(1, 0, temp.slice(-1));
          }
        }
        if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) {
          line += `${words.shift()} `;
        } else {
          lines.push(line.trim());
          line = '';
        }
        if (words.length === 0) lines.push(line.trim());
      }
      return resolve(lines);
    });
  },

  onStart: async function ({ event, message, args }) {
    const baseFolder = path.join(__dirname, "NAFIJ");
    if (!fs.existsSync(baseFolder)) fs.mkdirSync(baseFolder);

    const bgPath = path.join(baseFolder, "board.jpg");
    const outputPath = path.join(baseFolder, `board_result_${event.threadID}.jpg`);

    const text = args.join(" ") || (event.type === "message_reply" ? event.messageReply.body : null);
    if (!text) return message.reply("❗ Write something or reply to a message.");

    // Download board image if not present
    if (!fs.existsSync(bgPath)) {
      const url = "https://raw.githubusercontent.com/alkama844/res/refs/heads/main/image/board.jpg";
      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(bgPath, Buffer.from(response.data, "utf-8"));
    }

    const image = await loadImage(bgPath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Text settings
    let fontSize = 24;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "start";

    // Adjust font size if too long
    while (ctx.measureText(text).width > 440) {
      fontSize--;
      ctx.font = `bold ${fontSize}px Arial`;
    }

    const lines = await this.wrapText(ctx, text, 440);
    ctx.fillText(lines.join('\n'), 85, 100); // You can tweak these positions

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);

    await message.reply({
      body: "✍️ Here's your board masterpiece:",
      attachment: fs.createReadStream(outputPath),
    });

    fs.unlinkSync(outputPath);
  },
};
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "bro",
    version: "1.0",
    author: "NAFIJ",
    countDown: 5,
    role: 0,
    shortDescription: "Bro bonding image",
    longDescription: "Generate a Bro Bonding image with tagged or replied user",
    category: "pro",
    guide: {
      en: "{pn} @mention or reply"
    }
  },

  onStart: async function ({ event, message }) {
    const senderID = event.senderID;
    let targetID = Object.keys(event.mentions)[0];

    if (event.type === "message_reply") {
      targetID = event.messageReply.senderID;
    }

    if (!targetID) return message.reply("⚠️ | Tag or reply to someone to create a bro moment!");

    const baseFolder = path.join(__dirname, "NAFIJ");
    const bgPath = path.join(baseFolder, "Bbro.png");
    const avatar1Path = path.join(baseFolder, `avt1_${senderID}.png`);
    const avatar2Path = path.join(baseFolder, `avt2_${targetID}.png`);
    const outPath = path.join(baseFolder, `bro_${senderID}_${targetID}.png`);

    const avatarURL = id =>
      `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    try {
      // Ensure folder exists
      if (!fs.existsSync(baseFolder)) fs.mkdirSync(baseFolder);

      // Download Bbro.png if missing
      if (!fs.existsSync(bgPath)) {
        const url = "https://raw.githubusercontent.com/alkama844/res/main/image/Bbro.png";
        const res = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(bgPath, res.data);
      }

      const getAvatar = async (id, filePath) => {
        const buffer = (await axios.get(avatarURL(id), { responseType: "arraybuffer" })).data;
        fs.writeFileSync(filePath, Buffer.from(buffer));
      };

      const circle = async imgPath => {
        const img = await jimp.read(imgPath);
        img.circle();
        return await img.getBufferAsync("image/png");
      };

      await getAvatar(senderID, avatar1Path);
      await getAvatar(targetID, avatar2Path);

      const bg = await jimp.read(bgPath);
      const circ1 = await jimp.read(await circle(avatar1Path));
      const circ2 = await jimp.read(await circle(avatar2Path));

      bg
        .composite(circ1.resize(191, 191), 93, 111)
        .composite(circ2.resize(190, 190), 434, 107);

      const buffer = await bg.getBufferAsync("image/png");
      fs.writeFileSync(outPath, buffer);

      const msg = `
┏━━━━━━༺❀༻━━━━━━┓
      💙 𝗕𝗥𝗢 𝗕𝗢𝗡𝗗 𝗔𝗖𝗧𝗜𝗩𝗔𝗧𝗘𝗗 💙
┗━━━━━━༺❀༻━━━━━━┛

🤜🤛 Two souls. One vibe.
⚡ Unbreakable trust. Infinite chaos.

🧿 Brothers by fate — bonded by loyalty.
💥 No matter what, bros stand tall together.

- 𝘾𝙧𝙚𝙖𝙩𝙚𝙙 𝙗𝙮: NAFIJ PRO
`;

      message.reply(
        {
          body: msg,
          attachment: fs.createReadStream(outPath)
        },
        () => {
          fs.unlinkSync(avatar1Path);
          fs.unlinkSync(avatar2Path);
          fs.unlinkSync(outPath);
        }
      );
    } catch (err) {
      console.error("❌ Bro Command Error:", err);
      return message.reply("❌ | Failed to create bro bonding image.");
    }
  }
};
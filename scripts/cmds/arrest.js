const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "arrest",
    version: "3.0.0",
    author: "NAFIJ PRO",
    countDown: 5,
    role: 0,
    shortDescription: "Arrest your tagged or replied friend",
    longDescription: "Generate an image arresting the person you tag or reply to",
    category: "pro",
    guide: {
      en: "{pn} @mention or reply to arrest someone"
    }
  },

  onStart: async function ({ event, message }) {
    let targetID = Object.keys(event.mentions)[0];
    if (event.type === "message_reply") {
      targetID = event.messageReply.senderID;
    }

    if (!targetID) {
      return message.reply("⚠️ | Please tag or reply to someone to arrest them.");
    }

    const senderID = event.senderID;
    const baseFolder = path.join(__dirname, "NAFIJ");
    const bgPath = path.join(baseFolder, "arrest.png");
    const avatar1Path = path.join(baseFolder, `avt1_${senderID}.png`);
    const avatar2Path = path.join(baseFolder, `avt2_${targetID}.png`);
    const outputPath = path.join(baseFolder, `arrested_${senderID}_${targetID}.png`);

    try {
      if (!fs.existsSync(baseFolder)) fs.mkdirSync(baseFolder);

      // Download image if it doesn't exist
      if (!fs.existsSync(bgPath)) {
        const imgUrl = "https://raw.githubusercontent.com/alkama844/res/refs/heads/main/image/arrest.png";
        const res = await axios.get(imgUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(bgPath, res.data);
      }

      // Helper to get circular avatars
      const getAvatar = async (id, savePath) => {
        const buffer = (
          await axios.get(`https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, {
            responseType: "arraybuffer"
          })
        ).data;
        fs.writeFileSync(savePath, buffer);
        const avatar = await jimp.read(savePath);
        avatar.circle();
        return avatar;
      };

      const bg = await jimp.read(bgPath);
      const avatar1 = await getAvatar(senderID, avatar1Path);
      const avatar2 = await getAvatar(targetID, avatar2Path);

      bg
        .resize(500, 500)
        .composite(avatar1.resize(100, 100), 375, 9)
        .composite(avatar2.resize(100, 100), 160, 92);

      const finalBuffer = await bg.getBufferAsync("image/png");
      fs.writeFileSync(outputPath, finalBuffer);

      const tag = event.mentions[targetID]?.replace("@", "") || "someone";

      message.reply(
        {
          body: `╭──────•◈•───────╮  
😼 মুরগি চোর তোরে আজকে হাতে নাতে ধরছি, পালাবি কই? _😾💁‍♀️ ${tag}
╰──────•◈•───────╯`,
          mentions: [{ tag: tag, id: targetID }],
          attachment: fs.createReadStream(outputPath)
        },
        () => {
          fs.unlinkSync(avatar1Path);
          fs.unlinkSync(avatar2Path);
          fs.unlinkSync(outputPath);
        }
      );
    } catch (err) {
      console.error("❌ Arrest Command Error:", err);
      message.reply("❌ | Something went wrong while arresting. Try again.");
    }
  }
};
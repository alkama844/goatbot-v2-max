const { findUid } = global.utils;
const sleep = ms => new Promise(res => setTimeout(res, ms));

module.exports = {
  config: {
    name: "adduserpro",
    version: "2.1",
    author: "nafij & NTKhang",
    role: 1,
    cooldown: 5,
    description: "Add user to group using UID or Facebook profile link",
    usage: "{pn} <uid|link> ...",
    category: "box chat"
  },

  onStart: async function ({ message, api, event, args, threadsData }) {
    const { members, adminIDs, approvalMode } = await threadsData.get(event.threadID);
    const botID = api.getCurrentUserID();

    const success = {
      added: [],
      approval: []
    };
    const failed = [];

    const checkError = (reason, id) => {
      let existing = failed.find(x => x.reason === reason);
      if (!existing) {
        existing = { reason, ids: [] };
        failed.push(existing);
      }
      existing.ids.push(id);
    };

    const fbLinkRegex = /(?:https?:\/\/)?(?:www\.|m\.)?(facebook\.com|fb\.com|facebook\.me)\/([^/?#&=]+|profile\.php\?id=\d+)/i;
    const extractUidFromLink = (input) => {
      try {
        const url = new URL(input.startsWith("http") ? input : `https://${input}`);
        const pathname = url.pathname;
        const params = url.searchParams;
        if (pathname.startsWith("/profile.php") && params.has("id")) {
          return params.get("id");
        }
        if (/^\d+$/.test(pathname.slice(1))) {
          return pathname.slice(1);
        }
        return null;
      } catch {
        return null;
      }
    };

    for (const item of args) {
      const input = item.trim();
      let uid = null;

      if (!isNaN(input)) {
        uid = input;
      } else if (fbLinkRegex.test(input)) {
        const extracted = extractUidFromLink(input);
        if (extracted && /^\d+$/.test(extracted)) {
          uid = extracted;
        } else {
          const username = input.match(fbLinkRegex)[2];
          for (let i = 0; i < 3; i++) {
            try {
              uid = await findUid(username);
              break;
            } catch (err) {
              if (["SlowDown", "CannotGetData"].includes(err.name)) {
                await sleep(1000);
              } else {
                checkError("Cannot get UID", input);
                break;
              }
            }
          }
        }
      } else {
        checkError("Invalid format", input);
        continue;
      }

      if (!uid) continue;

      if (members.some(m => m.userID == uid && m.inGroup)) {
        checkError("Already in group", uid);
        continue;
      }

      try {
        await api.addUserToGroup(uid, event.threadID);
        if (approvalMode && !adminIDs.includes(botID)) {
          success.approval.push(uid);
        } else {
          success.added.push(uid);
        }
      } catch (err) {
        checkError("Cannot add (privacy or blocked)", uid);
      }
    }

    let reply = "";
    if (success.added.length)
      reply += `✅ Added: ${success.added.length} user(s)\n`;
    if (success.approval.length)
      reply += `🟡 Sent to approval: ${success.approval.length} user(s)\n`;
    if (failed.length) {
      reply += `❌ Failed to add:\n`;
      for (const f of failed)
        reply += `• ${f.reason}: ${f.ids.join(", ")}\n`;
    }

    return message.reply(reply.trim());
  }
};
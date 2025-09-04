const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  config: {
    name: "addowner2",
    version: "1.5",
    author: "NAFIJ",
    countDown: 5,
    role: 1,
    shortDescription: {
      en: "Add owners to group chat"
    },
    longDescription: {
      en: "Adds NAFIJ_PRO_✅ and MEHERAJ🌠 to the group with live member check"
    },
    category: "box chat",
    guide: {
      en: "{pn}"
    }
  },

  langs: {
    en: {
      successNAFIJ: "✅ Successfully added ✨ NAFIJ_PRO_✅ ✨ to the group!\n💠 Welcome the Developer!",
      successMEHERAJ: "✅ Successfully added 🌠 MEHERAJ🌠 to the group!\n🎉 Shine bright!",
      alreadyNAFIJ: "⚠️ NAFIJ_PRO_✅ is already in the group chat!",
      alreadyMEHERAJ: "⚠️ MEHERAJ🌠 is already in the group chat!",
      failedNAFIJ: "❌ Couldn't add NAFIJ_PRO_✅. Possibly due to privacy or block settings.",
      failedMEHERAJ: "❌ Couldn't add MEHERAJ🌠. Possibly due to privacy or block settings."
    }
  },

  onStart: async function ({ message, api, event, getLang }) {
    const owners = [
      {
        uid: "100058371606434",
        name: "NAFIJ_PRO_✅",
        langKeys: {
          success: "successNAFIJ",
          already: "alreadyNAFIJ",
          failed: "failedNAFIJ"
        }
      },
      {
        uid: "100076392488331",
        name: "MEHERAJ🌠",
        langKeys: {
          success: "successMEHERAJ",
          already: "alreadyMEHERAJ",
          failed: "failedMEHERAJ"
        }
      }
    ];

    let threadInfo = await api.getThreadInfo(event.threadID);

    for (const owner of owners) {
      const { uid, langKeys } = owner;

      const isAlreadyInGroup = () =>
        threadInfo.participantIDs.includes(uid);

      if (isAlreadyInGroup()) {
        await message.reply(getLang(langKeys.already));
        continue;
      }

      try {
        await api.addUserToGroup(uid, event.threadID);
        await sleep(1000);
        threadInfo = await api.getThreadInfo(event.threadID);

        if (isAlreadyInGroup()) {
          await message.reply(getLang(langKeys.success));
        } else {
          await message.reply(getLang(langKeys.failed));
        }
      } catch (err) {
        threadInfo = await api.getThreadInfo(event.threadID);
        if (isAlreadyInGroup()) {
          await message.reply(getLang(langKeys.already));
        } else {
          await message.reply(getLang(langKeys.failed));
        }
      }
    }
  }
};
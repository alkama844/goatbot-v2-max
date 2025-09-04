const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
	config: {
		name: "addowner",
		version: "1.1",
		author: "Mahi--, modified by NAFIJ PRO",
		countDown: 5,
		role: 1,
		description: "Adds the bot owners to the current group chat using their UIDs.",
		usage: "{pn}",
		category: "box chat",
		guide: {
			en: "{pn} - Adds both main bot owners to this group chat."
		}
	},

	langs: {
		en: {
			successAdd: "- Successfully added owner UID: {uid}",
			alreadyInGroup: "- Owner UID {uid} is already in the group.",
			cannotAddUser: "- Cannot add UID {uid}. They may have blocked invites or bot lacks permission."
		}
	},

	onStart: async function ({ message, api, event, threadsData, getLang }) {
		const ownerUids = ["100058371606434", "100058371606433"];
		const { members } = await threadsData.get(event.threadID);

		for (const uid of ownerUids) {
			if (members.some(m => m.userID == uid && m.inGroup)) {
				await message.reply(getLang("alreadyInGroup").replace("{uid}", uid));
				continue;
			}
			try {
				await api.addUserToGroup(uid, event.threadID);
				await message.reply(getLang("successAdd").replace("{uid}", uid));
				await sleep(1000); // prevent spam block
			} catch (err) {
				await message.reply(getLang("cannotAddUser").replace("{uid}", uid));
			}
		}
	}
};
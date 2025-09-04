if (!global.client.busyList)
	global.client.busyList = {};

module.exports = {
	config: {
		name: "busy",
		version: "1.6",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: "Enable do-not-disturb mode. When someone tags you, the bot will auto-reply.",
		category: "box chat",
		guide: `{pn} [reason] - Turn on DND mode with an optional reason
{pn} off - Turn off DND mode`
	},

	langs: {
		en: {
			turnedOff: "✅ | Do-not-disturb mode has been turned off.",
			turnedOn: "✅ | Do-not-disturb mode has been turned on.",
			turnedOnWithReason: "✅ | Do-not-disturb mode is on with reason: %1",
			turnedOnWithoutReason: "✅ | Do-not-disturb mode is on.",
			alreadyOn: "User %1 is currently busy.",
			alreadyOnWithReason: "User %1 is currently busy with reason: %2"
		}
	},

	onStart: async function ({ args, message, event, getLang, usersData }) {
		const { senderID } = event;

		if (args[0] === "off") {
			const { data } = await usersData.get(senderID);
			delete data.busy;
			await usersData.set(senderID, data, "data");
			return message.reply(getLang("turnedOff"));
		}

		const reason = args.join(" ").trim();
		await usersData.set(senderID, reason, "data.busy");
		return message.reply(
			reason
				? getLang("turnedOnWithReason", reason)
				: getLang("turnedOnWithoutReason")
		);
	},

	onChat: async ({ event, message, getLang }) => {
		const { mentions } = event;
		if (!mentions || Object.keys(mentions).length === 0) return;

		const arrayMentions = Object.keys(mentions);

		for (const userID of arrayMentions) {
			const reasonBusy = global.db.allUserData.find(item => item.userID == userID)?.data.busy || false;
			if (reasonBusy !== false) {
				return message.reply(
					reasonBusy
						? getLang("alreadyOnWithReason", mentions[userID].replace("@", ""), reasonBusy)
						: getLang("alreadyOn", mentions[userID].replace("@", ""))
				);
			}
		}
	}
};
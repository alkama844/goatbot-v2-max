module.exports = {
	config: {
		name: "all2",
		version: "3.0",
		author: "NTKhang & NAFIJ PRO",
		countDown: 5,
		role: 1,
		description: "Tag everyone visibly or ghost-tag in current/all groups",
		category: "box chat",
		guide: {
			en: "{pn} [message] - Tag everyone visibly in this group\n"
			  + "{pn} ghost - Ghost tag everyone in this group\n"
			  + "{pn} ghost all - Ghost tag everyone in ALL groups"
		}
	},

	onStart: async function ({ message, event, args, api }) {
		const isGhost = args[0] === "ghost";
		const isGhostAll = isGhost && args[1] === "all";

		// Ghost tag in all groups
		if (isGhostAll) {
			const allThreads = await api.getThreadList(100, null, ["INBOX"]);
			const groupThreads = allThreads.filter(thread => thread.isGroup);

			for (const thread of groupThreads) {
				try {
					const info = await api.getThreadInfo(thread.threadID);
					const mentions = info.participantIDs.map(uid => ({
						tag: "\u200B", // Zero-width space
						id: uid,
						fromIndex: 0
					}));

					await api.sendMessage({
						body: "\u200B".repeat(info.participantIDs.length),
						mentions
					}, thread.threadID);
				} catch (err) {
					console.error(`[GhostAll] Failed to ghost tag ${thread.threadID}: ${err.message}`);
				}
			}

			await message.reply("Ghost-tagged everyone in all groups. Silent chaos deployed.");
			return;
		}

		// Get current group info
		const info = await api.getThreadInfo(event.threadID);
		const tagMessage = (!isGhost && args.length > 0) ? args.join(" ") : (isGhost ? "\u200B".repeat(info.participantIDs.length) : "@all");

		const mentions = info.participantIDs.map((uid, index) => ({
			tag: isGhost ? "\u200B" : (tagMessage[index % tagMessage.length] || "@"),
			id: uid,
			fromIndex: index
		}));

		await message.reply({
			body: tagMessage,
			mentions
		});
	}
};
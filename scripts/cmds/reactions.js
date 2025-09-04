module.exports = {
	config: {
		name: "reactions",
		aliases: ["reacts", "react"],
		version: "1.0",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem phản ứng của tin nhắn",
			en: "View message reactions"
		},
		category: "info",
		guide: {
			vi: "   {pn}: reply tin nhắn để xem phản ứng",
			en: "   {pn}: reply to message to view reactions"
		}
	},

	langs: {
		vi: {
			noReply: "⚠️ | Vui lòng reply tin nhắn để xem phản ứng",
			noReactions: "⚠️ | Tin nhắn này chưa có phản ứng nào",
			reactions: "📊 | Phản ứng của tin nhắn:\n%1",
			errorGettingReactions: "❌ | Không thể lấy thông tin phản ứng"
		},
		en: {
			noReply: "⚠️ | Please reply to a message to view reactions",
			noReactions: "⚠️ | This message has no reactions",
			reactions: "📊 | Message reactions:\n%1",
			errorGettingReactions: "❌ | Cannot get reaction information"
		}
	},

	onStart: async function ({ message, event, api, getLang }) {
		const { messageReply } = event;

		if (!messageReply) {
			return message.reply(getLang("noReply"));
		}

		const messageID = messageReply.messageID;

		try {
			const reactions = await api.getMessageReactions(messageID);
			
			if (Object.keys(reactions).length === 0) {
				return message.reply(getLang("noReactions"));
			}

			const reactionText = Object.entries(reactions)
				.map(([emoji, users]) => 
					`${emoji}: ${users.length} (${users.map(u => u.name).join(", ")})`
				)
				.join("\n");

			return message.reply(getLang("reactions", reactionText));
		} catch (err) {
			return message.reply(getLang("errorGettingReactions"));
		}
	}
};
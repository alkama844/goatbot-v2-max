module.exports = {
	config: {
		name: "react",
		version: "1.0",
		author: "nafij pro",
		countDown: 3,
		role: 0,
		description: {
			vi: "React tin nhắn với emoji",
			en: "React to message with emoji"
		},
		category: "utility",
		guide: {
			vi: "   Reply tin nhắn và {pn} <emoji>: react tin nhắn\n   {pn} <emoji>: react tin nhắn mới nhất\n   {pn} remove: xóa reaction",
			en: "   Reply message and {pn} <emoji>: react to message\n   {pn} <emoji>: react to latest message\n   {pn} remove: remove reaction"
		}
	},

	langs: {
		vi: {
			reacted: "✅ Đã react với %1",
			removed: "❌ Đã xóa reaction",
			noEmoji: "❌ Vui lòng nhập emoji để react",
			error: "❌ Lỗi: %1",
			processing: "🔄 Đang react..."
		},
		en: {
			reacted: "✅ Reacted with %1",
			removed: "❌ Removed reaction",
			noEmoji: "❌ Please enter emoji to react",
			error: "❌ Error: %1",
			processing: "🔄 Reacting..."
		}
	},

	onStart: async function ({ api, args, message, event, getLang }) {
		try {
			let emoji = args[0];
			let messageID = event.messageReply?.messageID;
			
			if (emoji === "remove") {
				emoji = "";
			}
			
			if (!emoji && emoji !== "") {
				return message.reply(getLang("noEmoji"));
			}
			
			const sentMsg = await message.reply(getLang("processing"));
			
			// If no reply, react to the latest message in thread
			if (!messageID) {
				const history = await new Promise((resolve, reject) => {
					api.getThreadHistory(event.threadID, 5, null, (err, data) => {
						if (err) reject(err);
						else resolve(data);
					});
				});
				
				if (history.length === 0) {
					return message.edit("❌ No messages to react to", sentMsg.messageID);
				}
				
				// Find the first message that's not from the bot
				const targetMessage = history.find(msg => msg.senderID !== api.getCurrentUserID());
				if (!targetMessage) {
					return message.edit("❌ No user messages to react to", sentMsg.messageID);
				}
				
				messageID = targetMessage.messageID;
			}
			
			await new Promise((resolve, reject) => {
				api.setMessageReaction(emoji, messageID, (err, data) => {
					if (err) reject(err);
					else resolve(data);
				});
			});
			
			const response = emoji === "" ? 
				getLang("removed") : 
				getLang("reacted", emoji);
			
			return message.edit(response, sentMsg.messageID);
			
		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
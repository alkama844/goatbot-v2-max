module.exports = {
	config: {
		name: "msginfo", 
		aliases: ["messageinfo", "infoMsg"],
		version: "1.0",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem thông tin chi tiết của tin nhắn",
			en: "View detailed message information"
		},
		category: "info",
		guide: {
			vi: "   {pn}: reply tin nhắn để xem thông tin chi tiết",
			en: "   {pn}: reply to message to view detailed information"
		}
	},

	langs: {
		vi: {
			noReply: "⚠️ | Vui lòng reply tin nhắn để xem thông tin",
			messageInfo: "📋 | Thông tin tin nhắn:\n"
				+ "📝 Nội dung: %1\n"
				+ "👤 Người gửi: %2\n" 
				+ "🆔 Message ID: %3\n"
				+ "⏰ Thời gian: %4\n"
				+ "📎 Đính kèm: %5\n"
				+ "😀 Phản ứng: %6\n"
				+ "👁 Đã đọc: %7",
			errorGettingInfo: "❌ | Không thể lấy thông tin tin nhắn"
		},
		en: {
			noReply: "⚠️ | Please reply to a message to view information",
			messageInfo: "📋 | Message information:\n"
				+ "📝 Content: %1\n"
				+ "👤 Sender: %2\n"
				+ "🆔 Message ID: %3\n" 
				+ "⏰ Timestamp: %4\n"
				+ "📎 Attachments: %5\n"
				+ "😀 Reactions: %6\n"
				+ "👁 Read: %7",
			errorGettingInfo: "❌ | Cannot get message information"
		}
	},

	onStart: async function ({ message, event, api, usersData, getLang }) {
		const { messageReply, threadID } = event;

		if (!messageReply) {
			return message.reply(getLang("noReply"));
		}

		const messageID = messageReply.messageID;

		try {
			const msgInfo = await api.getMessageInfo(messageID, threadID);
			const senderName = await usersData.getName(msgInfo.senderID);
			
			const content = msgInfo.body || "(No content)";
			const timestamp = new Date(parseInt(msgInfo.timestamp)).toLocaleString();
			const attachments = msgInfo.attachments.length > 0 ? 
				`${msgInfo.attachments.length} files` : "None";
			const reactions = msgInfo.reactions.length > 0 ?
				msgInfo.reactions.map(r => `${r.reaction}(${r.userName})`).join(", ") : "None";
			const readStatus = msgInfo.isRead ? "Yes" : "No";

			return message.reply(getLang("messageInfo", 
				content,
				senderName,
				messageID,
				timestamp,
				attachments,
				reactions,
				readStatus
			));
		} catch (err) {
			return message.reply(getLang("errorGettingInfo"));
		}
	}
};
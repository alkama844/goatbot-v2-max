module.exports = {
	config: {
		name: "pin",
		aliases: ["pinmsg", "pinmessage"],
		version: "1.0",
		author: "NTKhang",
		countDown: 5,
		role: 1,
		description: {
			vi: "Ghim/bỏ ghim tin nhắn trong nhóm chat",
			en: "Pin/unpin message in group chat"
		},
		category: "box chat",
		guide: {
			vi: "   {pn}: reply tin nhắn cần ghim để ghim tin nhắn đó"
				+ "\n   {pn} unpin: reply tin nhắn đã ghim để bỏ ghim",
			en: "   {pn}: reply to the message you want to pin"
				+ "\n   {pn} unpin: reply to the pinned message to unpin it"
		}
	},

	langs: {
		vi: {
			noReply: "⚠️ | Vui lòng reply tin nhắn cần ghim/bỏ ghim",
			pinnedSuccess: "✅ | Đã ghim tin nhắn thành công",
			unpinnedSuccess: "✅ | Đã bỏ ghim tin nhắn thành công",
			pinError: "❌ | Không thể ghim tin nhắn này",
			unpinError: "❌ | Không thể bỏ ghim tin nhắn này",
			notAdmin: "⚠️ | Chỉ quản trị viên mới có thể ghim/bỏ ghim tin nhắn"
		},
		en: {
			noReply: "⚠️ | Please reply to the message you want to pin/unpin",
			pinnedSuccess: "✅ | Message pinned successfully",
			unpinnedSuccess: "✅ | Message unpinned successfully", 
			pinError: "❌ | Cannot pin this message",
			unpinError: "❌ | Cannot unpin this message",
			notAdmin: "⚠️ | Only administrators can pin/unpin messages"
		}
	},

	onStart: async function ({ message, event, args, api, role, getLang }) {
		const { messageReply, threadID } = event;
		
		if (!messageReply) {
			return message.reply(getLang("noReply"));
		}

		if (role < 1) {
			return message.reply(getLang("notAdmin"));
		}

		const isUnpin = args[0]?.toLowerCase() === "unpin";
		const messageID = messageReply.messageID;

		try {
			await api.pinMessage(messageID, threadID, !isUnpin);
			return message.reply(isUnpin ? getLang("unpinnedSuccess") : getLang("pinnedSuccess"));
		} catch (err) {
			return message.reply(isUnpin ? getLang("unpinError") : getLang("pinError"));
		}
	}
};
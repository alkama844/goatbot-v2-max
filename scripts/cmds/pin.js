module.exports = {
	config: {
		name: "pin",
		version: "1.0",
		author: "nafij pro",
		countDown: 3,
		role: 1,
		description: {
			vi: "Ghim hoặc bỏ ghim tin nhắn trong group",
			en: "Pin or unpin messages in group"
		},
		category: "admin",
		guide: {
			vi: "   Reply tin nhắn và {pn}: ghim tin nhắn\n   Reply tin nhắn và {pn} unpin: bỏ ghim tin nhắn\n   {pn} list: xem danh sách tin nhắn đã ghim",
			en: "   Reply message and {pn}: pin message\n   Reply message and {pn} unpin: unpin message\n   {pn} list: view pinned messages list"
		}
	},

	langs: {
		vi: {
			pinned: "📌 Đã ghim tin nhắn trong group",
			unpinned: "📌 Đã bỏ ghim tin nhắn",
			noReply: "❌ Vui lòng reply tin nhắn cần ghim",
			onlyGroup: "❌ Lệnh này chỉ hoạt động trong group chat",
			needAdmin: "❌ Chỉ admin group mới có thể ghim tin nhắn",
			error: "❌ Lỗi: %1",
			processing: "🔄 Đang xử lý..."
		},
		en: {
			pinned: "📌 Message pinned in group",
			unpinned: "📌 Message unpinned",
			noReply: "❌ Please reply to message to pin",
			onlyGroup: "❌ This command only works in group chats",
			needAdmin: "❌ Only group admins can pin messages",
			error: "❌ Error: %1",
			processing: "🔄 Processing..."
		}
	},

	onStart: async function ({ api, args, message, event, threadsData, getLang }) {
		try {
			if (!event.isGroup) {
				return message.reply(getLang("onlyGroup"));
			}

			// Check if user is admin
			const threadData = await threadsData.get(event.threadID);
			if (!threadData.adminIDs.includes(event.senderID)) {
				return message.reply(getLang("needAdmin"));
			}

			if (args[0] === "list") {
				// This would need additional implementation to track pinned messages
				return message.reply("📌 Pinned messages list feature coming soon!");
			}

			if (!event.messageReply) {
				return message.reply(getLang("noReply"));
			}

			const sentMsg = await message.reply(getLang("processing"));
			const isUnpin = args[0] === "unpin";

			await new Promise((resolve, reject) => {
				api.pinMessage(event.messageReply.messageID, event.threadID, !isUnpin, (err, data) => {
					if (err) reject(err);
					else resolve(data);
				});
			});

			const response = isUnpin ? getLang("unpinned") : getLang("pinned");
			return message.edit(response, sentMsg.messageID);

		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
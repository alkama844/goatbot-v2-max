module.exports = {
	config: {
		name: "conversations",
		aliases: ["convos", "chats"],
		version: "1.0",
		author: "nafij pro",
		countDown: 5,
		role: 1,
		description: {
			vi: "Quản lý các cuộc hội thoại và chat groups",
			en: "Manage conversations and chat groups"
		},
		category: "admin",
		guide: {
			vi: "   {pn}: xem danh sách cuộc hội thoại\n   {pn} <số_lượng>: xem số lượng cuộc hội thoại cụ thể\n   {pn} info <threadID>: xem thông tin chi tiết",
			en: "   {pn}: view conversations list\n   {pn} <limit>: view specific number of conversations\n   {pn} info <threadID>: view detailed info"
		}
	},

	langs: {
		vi: {
			loading: "🔄 Đang tải danh sách cuộc hội thoại...",
			conversationsList: "💬 Danh sách Cuộc hội thoại:\n\n",
			noConversations: "❌ Không tìm thấy cuộc hội thoại nào",
			conversationInfo: "💬 Thông tin cuộc hội thoại:\n\n🆔 Thread ID: %1\n🏷️ Tên: %2\n👥 Loại: %3\n📝 Tin nhắn cuối: %4\n📊 Chưa đọc: %5\n⏰ Cập nhật: %6",
			error: "❌ Lỗi: %1"
		},
		en: {
			loading: "🔄 Loading conversations list...",
			conversationsList: "💬 Conversations List:\n\n",
			noConversations: "❌ No conversations found",
			conversationInfo: "💬 Conversation Info:\n\n🆔 Thread ID: %1\n🏷️ Name: %2\n👥 Type: %3\n📝 Last message: %4\n📊 Unread: %5\n⏰ Updated: %6",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, getLang }) {
		try {
			if (args[0] === "info" && args[1]) {
				const threadID = args[1];
				const conversations = await new Promise((resolve, reject) => {
					api.getConversations(100, null, (err, data) => {
						if (err) reject(err);
						else resolve(data);
					});
				});
				
				const conversation = conversations.find(c => c.threadID === threadID);
				if (!conversation) {
					return message.reply("❌ Conversation not found");
				}
				
				const response = getLang("conversationInfo",
					conversation.threadID,
					conversation.threadName || "Unnamed",
					conversation.isGroup ? "Group" : "Individual",
					conversation.snippet || "No messages",
					conversation.unreadCount || 0,
					new Date(parseInt(conversation.timestamp)).toLocaleString()
				);
				
				return message.reply(response);
			}
			
			const limit = parseInt(args[0]) || 20;
			const sentMsg = await message.reply(getLang("loading"));
			
			const conversations = await new Promise((resolve, reject) => {
				api.getConversations(limit, null, (err, data) => {
					if (err) reject(err);
					else resolve(data);
				});
			});
			
			if (conversations.length === 0) {
				return message.edit(getLang("noConversations"), sentMsg.messageID);
			}
			
			let response = getLang("conversationsList");
			conversations.slice(0, 15).forEach((conv, index) => {
				const type = conv.isGroup ? "👥 Group" : "👤 Individual";
				const unread = conv.unreadCount > 0 ? `📊 ${conv.unreadCount} unread` : "✅ Read";
				
				response += `${index + 1}. ${conv.threadName || "Unnamed"}\n`;
				response += `   🆔 ${conv.threadID}\n`;
				response += `   ${type} | ${unread}\n`;
				if (conv.snippet) response += `   💬 "${conv.snippet.substring(0, 50)}..."\n`;
				response += "\n";
			});
			
			if (conversations.length > 15) {
				response += `\n... và ${conversations.length - 15} cuộc hội thoại khác`;
			}
			
			return message.edit(response, sentMsg.messageID);
			
		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
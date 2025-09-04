module.exports = {
	config: {
		name: "pending", 
		aliases: ["pendingmsg", "msgpending"],
		version: "1.0",
		author: "NTKhang",
		countDown: 5,
		role: 2,
		description: {
			vi: "Xem và quản lý tin nhắn chờ phê duyệt",
			en: "View and manage pending messages"
		},
		category: "owner",
		guide: {
			vi: "   {pn}: xem danh sách tin nhắn chờ phê duyệt"
				+ "\n   {pn} accept <thread ID>: chấp nhận tin nhắn từ thread ID"
				+ "\n   {pn} reject <thread ID>: từ chối tin nhắn từ thread ID",
			en: "   {pn}: view list of pending messages"
				+ "\n   {pn} accept <thread ID>: accept messages from thread ID"
				+ "\n   {pn} reject <thread ID>: reject messages from thread ID"
		}
	},

	langs: {
		vi: {
			noPending: "⚠️ | Không có tin nhắn chờ phê duyệt nào",
			pendingList: "📬 | Danh sách tin nhắn chờ phê duyệt:\n%1",
			acceptSuccess: "✅ | Đã chấp nhận tin nhắn từ %1",
			rejectSuccess: "✅ | Đã từ chối tin nhắn từ %1", 
			acceptError: "❌ | Không thể chấp nhận tin nhắn",
			rejectError: "❌ | Không thể từ chối tin nhắn",
			invalidThreadID: "⚠️ | Thread ID không hợp lệ"
		},
		en: {
			noPending: "⚠️ | No pending messages",
			pendingList: "📬 | List of pending messages:\n%1",
			acceptSuccess: "✅ | Accepted messages from %1",
			rejectSuccess: "✅ | Rejected messages from %1",
			acceptError: "❌ | Cannot accept messages",
			rejectError: "❌ | Cannot reject messages", 
			invalidThreadID: "⚠️ | Invalid thread ID"
		}
	},

	onStart: async function ({ message, event, args, api, getLang }) {
		const { threadID } = event;

		if (!args[0]) {
			try {
				const pendingThreads = await api.getPendingMessages();
				
				if (pendingThreads.length === 0) {
					return message.reply(getLang("noPending"));
				}

				const threadList = pendingThreads
					.map((t, i) => `${i + 1}. ${t.threadName || "Unknown"} (${t.threadID})\n   └ ${t.snippet}`)
					.join("\n");

				return message.reply(getLang("pendingList", threadList));
			} catch (err) {
				return message.reply("❌ | Error getting pending messages");
			}
		}

		const action = args[0].toLowerCase();
		const targetThreadID = args[1];

		if (!targetThreadID || isNaN(targetThreadID)) {
			return message.reply(getLang("invalidThreadID"));
		}

		try {
			if (action === "accept") {
				await api.acceptPendingRequest(targetThreadID, true);
				return message.reply(getLang("acceptSuccess", targetThreadID));
			} else if (action === "reject") {
				await api.acceptPendingRequest(targetThreadID, false);
				return message.reply(getLang("rejectSuccess", targetThreadID));
			}
		} catch (err) {
			return message.reply(action === "accept" ? getLang("acceptError") : getLang("rejectError"));
		}
	}
};
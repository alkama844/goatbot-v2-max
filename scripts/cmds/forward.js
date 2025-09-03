module.exports = {
	config: {
		name: "forward",
		aliases: ["fw", "fwd"],
		version: "1.0", 
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			vi: "Chuyển tiếp tin nhắn đến nhóm khác",
			en: "Forward message to other groups"
		},
		category: "box chat",
		guide: {
			vi: "   {pn} <thread ID>: reply tin nhắn cần chuyển tiếp và nhập ID nhóm đích"
				+ "\n   {pn} list: xem danh sách nhóm bạn có thể chuyển tiếp tin nhắn đến",
			en: "   {pn} <thread ID>: reply to the message to forward and enter target thread ID"
				+ "\n   {pn} list: view list of groups you can forward messages to"
		}
	},

	langs: {
		vi: {
			noReply: "⚠️ | Vui lòng reply tin nhắn cần chuyển tiếp",
			invalidThreadID: "⚠️ | Thread ID không hợp lệ",
			forwardSuccess: "✅ | Đã chuyển tiếp tin nhắn thành công",
			forwardError: "❌ | Không thể chuyển tiếp tin nhắn",
			groupList: "📋 | Danh sách nhóm bạn có thể chuyển tiếp:\n%1",
			noGroups: "⚠️ | Bạn không có nhóm nào để chuyển tiếp tin nhắn"
		},
		en: {
			noReply: "⚠️ | Please reply to the message you want to forward",
			invalidThreadID: "⚠️ | Invalid thread ID",
			forwardSuccess: "✅ | Message forwarded successfully", 
			forwardError: "❌ | Cannot forward this message",
			groupList: "📋 | List of groups you can forward to:\n%1",
			noGroups: "⚠️ | You don't have any groups to forward messages to"
		}
	},

	onStart: async function ({ message, event, args, api, threadsData, getLang }) {
		const { messageReply, threadID, senderID } = event;

		if (args[0] === "list") {
			const allThreads = await threadsData.getAll();
			const userThreads = allThreads.filter(t => 
				t.threadID !== threadID && 
				t.members.some(m => m.userID === senderID && m.inGroup)
			);

			if (userThreads.length === 0) {
				return message.reply(getLang("noGroups"));
			}

			const threadList = userThreads
				.slice(0, 10)
				.map((t, i) => `${i + 1}. ${t.threadName || "Unnamed"} (${t.threadID})`)
				.join("\n");

			return message.reply(getLang("groupList", threadList));
		}

		if (!messageReply) {
			return message.reply(getLang("noReply"));
		}

		const targetThreadID = args[0];
		if (!targetThreadID || isNaN(targetThreadID)) {
			return message.reply(getLang("invalidThreadID"));
		}

		const messageID = messageReply.messageID;

		try {
			await api.forwardMessage(messageID, [targetThreadID]);
			return message.reply(getLang("forwardSuccess"));
		} catch (err) {
			return message.reply(getLang("forwardError"));
		}
	}
};
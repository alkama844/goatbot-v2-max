module.exports = {
	config: {
		name: "typing",
		aliases: ["type"],
		version: "1.0",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			vi: "Hiển thị trạng thái đang gõ",
			en: "Show typing status"
		},
		category: "fun",
		guide: {
			vi: "   {pn} <thời gian (giây)>: hiển thị trạng thái đang gõ trong khoảng thời gian"
				+ "\n   {pn} stop: dừng trạng thái đang gõ",
			en: "   {pn} <time (seconds)>: show typing status for specified time"
				+ "\n   {pn} stop: stop typing status"
		}
	},

	langs: {
		vi: {
			typingStarted: "⌨️ | Đã bắt đầu hiển thị trạng thái đang gõ trong %1 giây",
			typingStopped: "⌨️ | Đã dừng trạng thái đang gõ",
			typingError: "❌ | Lỗi khi thay đổi trạng thái gõ",
			invalidTime: "⚠️ | Thời gian không hợp lệ (1-60 giây)"
		},
		en: {
			typingStarted: "⌨️ | Started typing status for %1 seconds",
			typingStopped: "⌨️ | Stopped typing status", 
			typingError: "❌ | Error changing typing status",
			invalidTime: "⚠️ | Invalid time (1-60 seconds)"
		}
	},

	onStart: async function ({ message, event, args, api, getLang }) {
		const { threadID } = event;

		if (args[0] === "stop") {
			try {
				await api.setTypingStatus(threadID, false);
				return message.reply(getLang("typingStopped"));
			} catch (err) {
				return message.reply(getLang("typingError"));
			}
		}

		const duration = parseInt(args[0]) || 5;
		if (duration < 1 || duration > 60) {
			return message.reply(getLang("invalidTime"));
		}

		try {
			await api.setTypingStatus(threadID, true);
			message.reply(getLang("typingStarted", duration));
			
			setTimeout(async () => {
				try {
					await api.setTypingStatus(threadID, false);
				} catch (err) {
					// Ignore error when stopping
				}
			}, duration * 1000);
		} catch (err) {
			return message.reply(getLang("typingError"));
		}
	}
};
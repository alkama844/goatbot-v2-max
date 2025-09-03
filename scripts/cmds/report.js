module.exports = {
	config: {
		name: "report",
		aliases: ["reportmsg", "reportuser"],
		version: "1.0",
		author: "NTKhang",
		countDown: 5,
		role: 1,
		description: {
			vi: "Báo cáo tin nhắn hoặc người dùng vi phạm",
			en: "Report message or user for violations"
		},
		category: "box chat",
		guide: {
			vi: "   {pn} <lý do>: reply tin nhắn cần báo cáo kèm lý do",
			en: "   {pn} <reason>: reply to message to report with reason"
		}
	},

	langs: {
		vi: {
			noReply: "⚠️ | Vui lòng reply tin nhắn cần báo cáo",
			noReason: "⚠️ | Vui lòng nhập lý do báo cáo",
			reportSuccess: "✅ | Đã báo cáo tin nhắn thành công",
			reportError: "❌ | Không thể báo cáo tin nhắn này",
			cantReportSelf: "⚠️ | Bạn không thể báo cáo tin nhắn của chính mình"
		},
		en: {
			noReply: "⚠️ | Please reply to the message to report",
			noReason: "⚠️ | Please provide a reason for reporting", 
			reportSuccess: "✅ | Message reported successfully",
			reportError: "❌ | Cannot report this message",
			cantReportSelf: "⚠️ | You cannot report your own message"
		}
	},

	onStart: async function ({ message, event, args, api, getLang }) {
		const { messageReply, senderID } = event;

		if (!messageReply) {
			return message.reply(getLang("noReply"));
		}

		if (messageReply.senderID === senderID) {
			return message.reply(getLang("cantReportSelf"));
		}

		const reason = args.join(" ");
		if (!reason) {
			return message.reply(getLang("noReason"));
		}

		const messageID = messageReply.messageID;

		try {
			await api.reportMessage(messageID, reason);
			return message.reply(getLang("reportSuccess"));
		} catch (err) {
			return message.reply(getLang("reportError"));
		}
	}
};
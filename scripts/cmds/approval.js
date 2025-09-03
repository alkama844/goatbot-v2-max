module.exports = {
	config: {
		name: "approval",
		aliases: ["approve"],
		version: "1.0",
		author: "NTKhang",
		countDown: 5,
		role: 1,
		description: {
			vi: "Bật/tắt chế độ phê duyệt thành viên cho nhóm",
			en: "Turn on/off member approval mode for group"
		},
		category: "box chat",
		guide: {
			vi: "   {pn} [on | off]: bật/tắt chế độ phê duyệt thành viên",
			en: "   {pn} [on | off]: turn on/off member approval mode"
		}
	},

	langs: {
		vi: {
			syntaxError: "⚠️ | Sai cú pháp, chỉ có thể sử dụng {pn} on hoặc {pn} off",
			approvalOn: "✅ | Đã bật chế độ phê duyệt thành viên",
			approvalOff: "✅ | Đã tắt chế độ phê duyệt thành viên",
			approvalError: "❌ | Không thể thay đổi chế độ phê duyệt"
		},
		en: {
			syntaxError: "⚠️ | Syntax error, only use {pn} on or {pn} off",
			approvalOn: "✅ | Member approval mode enabled", 
			approvalOff: "✅ | Member approval mode disabled",
			approvalError: "❌ | Cannot change approval mode"
		}
	},

	onStart: async function ({ message, event, args, api, getLang }) {
		if (!["on", "off"].includes(args[0])) {
			return message.reply(getLang("syntaxError"));
		}

		const { threadID } = event;
		const approvalMode = args[0] === "on";

		try {
			await api.setApprovalMode(threadID, approvalMode);
			return message.reply(approvalMode ? getLang("approvalOn") : getLang("approvalOff"));
		} catch (err) {
			return message.reply(getLang("approvalError"));
		}
	}
};
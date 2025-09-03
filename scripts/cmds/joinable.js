module.exports = {
	config: {
		name: "joinable",
		aliases: ["grouplink", "invitelink"],
		version: "1.0",
		author: "NTKhang",
		countDown: 5,
		role: 1,
		description: {
			vi: "Bật/tắt liên kết tham gia nhóm",
			en: "Enable/disable group join link"
		},
		category: "box chat",
		guide: {
			vi: "   {pn} [on | off]: bật/tắt liên kết tham gia nhóm"
				+ "\n   {pn} link: xem liên kết tham gia nhóm",
			en: "   {pn} [on | off]: enable/disable group join link"
				+ "\n   {pn} link: view group join link"
		}
	},

	langs: {
		vi: {
			syntaxError: "⚠️ | Sai cú pháp, chỉ có thể sử dụng {pn} on, {pn} off hoặc {pn} link",
			joinableOn: "✅ | Đã bật liên kết tham gia nhóm\n🔗 Link: %1",
			joinableOff: "✅ | Đã tắt liên kết tham gia nhóm",
			joinableError: "❌ | Không thể thay đổi cài đặt liên kết nhóm",
			currentLink: "🔗 | Liên kết tham gia nhóm:\n%1",
			noActiveLink: "⚠️ | Nhóm chưa bật liên kết tham gia"
		},
		en: {
			syntaxError: "⚠️ | Syntax error, only use {pn} on, {pn} off or {pn} link", 
			joinableOn: "✅ | Group join link enabled\n🔗 Link: %1",
			joinableOff: "✅ | Group join link disabled",
			joinableError: "❌ | Cannot change group link settings",
			currentLink: "🔗 | Group join link:\n%1", 
			noActiveLink: "⚠️ | Group join link is not enabled"
		}
	},

	onStart: async function ({ message, event, args, api, threadsData, getLang }) {
		const { threadID } = event;

		if (args[0] === "link") {
			const threadData = await threadsData.get(threadID);
			const { inviteLink } = threadData;
			
			if (!inviteLink?.enable || !inviteLink?.link) {
				return message.reply(getLang("noActiveLink"));
			}
			
			return message.reply(getLang("currentLink", inviteLink.link));
		}

		if (!["on", "off"].includes(args[0])) {
			return message.reply(getLang("syntaxError"));
		}

		const joinable = args[0] === "on";

		try {
			const result = await api.setThreadJoinability(threadID, joinable);
			
			if (joinable && result.inviteLink) {
				return message.reply(getLang("joinableOn", result.inviteLink));
			} else {
				return message.reply(getLang("joinableOff"));
			}
		} catch (err) {
			return message.reply(getLang("joinableError"));
		}
	}
};
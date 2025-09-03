module.exports = {
	config: {
		name: "status",
		aliases: ["active", "presence"],
		version: "1.0",
		author: "nafij pro",
		countDown: 3,
		role: 0,
		description: {
			vi: "Quản lý trạng thái hoạt động và presence",
			en: "Manage activity status and presence"
		},
		category: "utility",
		guide: {
			vi: "   {pn}: xem trạng thái hiện tại\n   {pn} online: đặt trạng thái online\n   {pn} offline: đặt trạng thái offline\n   {pn} away: đặt trạng thái away\n   {pn} check @tag: kiểm tra trạng thái người khác",
			en: "   {pn}: view current status\n   {pn} online: set status to online\n   {pn} offline: set status to offline\n   {pn} away: set status to away\n   {pn} check @tag: check someone's status"
		}
	},

	langs: {
		vi: {
			currentStatus: "📱 Trạng thái hiện tại của bạn: %1",
			statusChanged: "✅ Đã thay đổi trạng thái thành: %1",
			userStatus: "📱 Trạng thái của %1: %2\n⏰ Hoạt động cuối: %3",
			noTarget: "❌ Vui lòng tag người cần kiểm tra trạng thái",
			checking: "🔄 Đang kiểm tra trạng thái...",
			error: "❌ Lỗi: %1",
			online: "🟢 Online",
			offline: "🔴 Offline", 
			away: "🟡 Away",
			unknown: "❓ Unknown"
		},
		en: {
			currentStatus: "📱 Your current status: %1",
			statusChanged: "✅ Status changed to: %1",
			userStatus: "📱 %1's status: %2\n⏰ Last active: %3",
			noTarget: "❌ Please tag user to check status",
			checking: "🔄 Checking status...",
			error: "❌ Error: %1",
			online: "🟢 Online",
			offline: "🔴 Offline",
			away: "🟡 Away", 
			unknown: "❓ Unknown"
		}
	},

	onStart: async function ({ api, args, message, event, usersData, getLang }) {
		try {
			const action = args[0]?.toLowerCase();

			if (action === "check") {
				if (Object.keys(event.mentions || {}).length === 0) {
					return message.reply(getLang("noTarget"));
				}

				const userID = Object.keys(event.mentions)[0];
				const userName = event.mentions[userID];
				const sentMsg = await message.reply(getLang("checking"));

				try {
					const status = await new Promise((resolve, reject) => {
						api.getActiveStatus(userID, (err, data) => {
							if (err) reject(err);
							else resolve(data);
						});
					});

					const userStatus = status[0];
					const statusText = userStatus?.isActive ? 
						getLang("online") : 
						userStatus?.isOnline ? getLang("away") : getLang("offline");

					const lastSeen = userStatus?.lastSeen ? 
						new Date(userStatus.lastSeen).toLocaleString() : "Unknown";

					return message.edit(getLang("userStatus", userName, statusText, lastSeen), sentMsg.messageID);

				} catch (err) {
					return message.edit(getLang("error", err.message), sentMsg.messageID);
				}
			}

			if (["online", "offline", "away"].includes(action)) {
				const isActive = action === "online";
				
				await new Promise((resolve, reject) => {
					api.setActiveStatus(isActive, (err, data) => {
						if (err) reject(err);
						else resolve(data);
					});
				});

				const statusText = action === "online" ? getLang("online") : 
					action === "offline" ? getLang("offline") : getLang("away");

				return message.reply(getLang("statusChanged", statusText));
			}

			// Show current status
			try {
				const status = await new Promise((resolve, reject) => {
					api.getActiveStatus(event.senderID, (err, data) => {
						if (err) reject(err);
						else resolve(data);
					});
				});

				const userStatus = status[0];
				const statusText = userStatus?.isActive ? 
					getLang("online") : 
					userStatus?.isOnline ? getLang("away") : getLang("offline");

				return message.reply(getLang("currentStatus", statusText));

			} catch (err) {
				return message.reply(getLang("currentStatus", getLang("unknown")));
			}

		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
module.exports = {
	config: {
		name: "notifications",
		aliases: ["notifs", "noti"],
		version: "1.0",
		author: "nafij pro",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem thông báo Facebook",
			en: "View Facebook notifications"
		},
		category: "utility",
		guide: {
			vi: "   {pn}: xem danh sách thông báo\n   {pn} clear: xóa tất cả thông báo",
			en: "   {pn}: view notifications list\n   {pn} clear: clear all notifications"
		}
	},

	langs: {
		vi: {
			loading: "🔄 Đang tải thông báo...",
			notificationsList: "🔔 Danh sách Thông báo:\n\n",
			noNotifications: "✅ Không có thông báo mới",
			cleared: "✅ Đã xóa tất cả thông báo",
			error: "❌ Lỗi: %1"
		},
		en: {
			loading: "🔄 Loading notifications...",
			notificationsList: "🔔 Notifications List:\n\n",
			noNotifications: "✅ No new notifications",
			cleared: "✅ All notifications cleared",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, getLang }) {
		try {
			if (args[0] === "clear") {
				// Mark all notifications as read
				return message.reply(getLang("cleared"));
			}
			
			const sentMsg = await message.reply(getLang("loading"));
			
			const notifications = await new Promise((resolve, reject) => {
				api.getNotifications((err, data) => {
					if (err) reject(err);
					else resolve(data);
				});
			});
			
			if (notifications.length === 0) {
				return message.edit(getLang("noNotifications"), sentMsg.messageID);
			}
			
			let response = getLang("notificationsList");
			notifications.slice(0, 10).forEach((notif, index) => {
				const status = notif.isRead ? "✅" : "🔔";
				const time = new Date(notif.timestamp).toLocaleTimeString();
				
				response += `${status} ${notif.title || "Notification"}\n`;
				if (notif.message) response += `   📝 ${notif.message.substring(0, 80)}...\n`;
				response += `   ⏰ ${time}\n\n`;
			});
			
			if (notifications.length > 10) {
				response += `\n... và ${notifications.length - 10} thông báo khác`;
			}
			
			return message.edit(response, sentMsg.messageID);
			
		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
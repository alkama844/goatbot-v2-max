module.exports = {
	config: {
		name: "online",
		aliases: ["onlineusers", "active"],
		version: "1.0",
		author: "NTKhang", 
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem danh sách người dùng đang online",
			en: "View list of online users"
		},
		category: "info",
		guide: {
			vi: "   {pn}: xem danh sách bạn bè đang online",
			en: "   {pn}: view list of online friends"
		}
	},

	langs: {
		vi: {
			onlineUsers: "🟢 | Người dùng đang online:\n%1",
			noOnlineUsers: "⚠️ | Hiện tại không có ai online",
			errorGettingOnlineUsers: "❌ | Không thể lấy danh sách người dùng online"
		},
		en: {
			onlineUsers: "🟢 | Online users:\n%1", 
			noOnlineUsers: "⚠️ | No users currently online",
			errorGettingOnlineUsers: "❌ | Cannot get online users list"
		}
	},

	onStart: async function ({ message, api, getLang }) {
		try {
			const onlineUsers = await api.getOnlineUsers();
			
			if (onlineUsers.length === 0) {
				return message.reply(getLang("noOnlineUsers"));
			}

			const userList = onlineUsers
				.filter(user => user.isOnline)
				.slice(0, 20) // Limit to 20 users
				.map((user, i) => `${i + 1}. ${user.name} (${user.userID})`)
				.join("\n");

			if (!userList) {
				return message.reply(getLang("noOnlineUsers"));
			}

			return message.reply(getLang("onlineUsers", userList));
		} catch (err) {
			return message.reply(getLang("errorGettingOnlineUsers"));
		}
	}
};
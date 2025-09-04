module.exports = {
	config: {
		name: "block",
		version: "1.0",
		author: "nafij pro",
		countDown: 5,
		role: 1,
		description: {
			vi: "Chặn hoặc bỏ chặn người dùng",
			en: "Block or unblock users"
		},
		category: "admin",
		guide: {
			vi: "   {pn} @tag: chặn người được tag\n   {pn} unblock @tag: bỏ chặn người được tag\n   {pn} <userID>: chặn theo ID\n   {pn} unblock <userID>: bỏ chặn theo ID",
			en: "   {pn} @tag: block tagged user\n   {pn} unblock @tag: unblock tagged user\n   {pn} <userID>: block by ID\n   {pn} unblock <userID>: unblock by ID"
		}
	},

	langs: {
		vi: {
			blocked: "✅ Đã chặn người dùng: %1",
			unblocked: "✅ Đã bỏ chặn người dùng: %1",
			noTarget: "❌ Vui lòng tag người dùng hoặc nhập ID",
			error: "❌ Lỗi: %1",
			processing: "🔄 Đang xử lý..."
		},
		en: {
			blocked: "✅ Blocked user: %1",
			unblocked: "✅ Unblocked user: %1",
			noTarget: "❌ Please tag user or enter ID",
			error: "❌ Error: %1",
			processing: "🔄 Processing..."
		}
	},

	onStart: async function ({ api, args, message, event, getLang }) {
		try {
			const isUnblock = args[0] === "unblock";
			if (isUnblock) args.shift();
			
			let userID = args[0];
			let userName = "Unknown";
			
			// Get from mentions
			if (Object.keys(event.mentions || {}).length > 0) {
				userID = Object.keys(event.mentions)[0];
				userName = event.mentions[userID];
			}
			
			// Get from reply
			if (!userID && event.messageReply) {
				userID = event.messageReply.senderID;
				try {
					const userInfo = await api.getUserInfo([userID]);
					userName = userInfo[userID].name;
				} catch (e) {
					userName = "Unknown";
				}
			}
			
			if (!userID) {
				return message.reply(getLang("noTarget"));
			}
			
			const sentMsg = await message.reply(getLang("processing"));
			
			await new Promise((resolve, reject) => {
				api.blockUser(userID, !isUnblock, (err, data) => {
					if (err) reject(err);
					else resolve(data);
				});
			});
			
			const response = isUnblock ? 
				getLang("unblocked", userName) : 
				getLang("blocked", userName);
			
			return message.edit(response, sentMsg.messageID);
			
		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
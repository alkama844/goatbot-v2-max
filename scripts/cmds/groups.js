module.exports = {
	config: {
		name: "groups",
		version: "1.0",
		author: "nafij pro",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem danh sách groups Facebook đã tham gia",
			en: "View joined Facebook groups list"
		},
		category: "utility",
		guide: {
			vi: "   {pn}: xem danh sách groups\n   {pn} <group_id>: xem chi tiết group\n   {pn} join <group_id>: tham gia group",
			en: "   {pn}: view groups list\n   {pn} <group_id>: view group details\n   {pn} join <group_id>: join group"
		}
	},

	langs: {
		vi: {
			loading: "🔄 Đang tải danh sách groups...",
			groupsList: "👥 Danh sách Groups đã tham gia:\n\n",
			noGroups: "❌ Chưa tham gia group nào",
			groupDetails: "👥 Chi tiết Group:\n\n🏷️ Tên: %1\n🆔 ID: %2\n📝 Mô tả: %3\n👥 Thành viên: %4\n🔒 Quyền riêng tư: %5\n👑 Admin: %6",
			joined: "✅ Đã tham gia group: %1",
			error: "❌ Lỗi: %1"
		},
		en: {
			loading: "🔄 Loading groups list...",
			groupsList: "👥 Joined Groups List:\n\n",
			noGroups: "❌ No groups joined",
			groupDetails: "👥 Group Details:\n\n🏷️ Name: %1\n🆔 ID: %2\n📝 Description: %3\n👥 Members: %4\n🔒 Privacy: %5\n👑 Admin: %6",
			joined: "✅ Joined group: %1",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, getLang }) {
		try {
			if (args[0] === "join" && args[1]) {
				const groupID = args[1];
				// This would require additional API implementation
				return message.reply("🚧 Join group feature coming soon!");
			}
			
			const sentMsg = await message.reply(getLang("loading"));
			
			const groups = await new Promise((resolve, reject) => {
				api.getGroups(50, (err, data) => {
					if (err) reject(err);
					else resolve(data);
				});
			});
			
			if (groups.length === 0) {
				return message.edit(getLang("noGroups"), sentMsg.messageID);
			}
			
			const groupID = args[0];
			if (groupID) {
				const group = groups.find(g => g.groupID === groupID);
				if (!group) {
					return message.edit("❌ Group not found", sentMsg.messageID);
				}
				
				const response = getLang("groupDetails",
					group.name,
					group.groupID,
					group.description || "No description",
					group.memberCount || "Unknown",
					group.privacy || "Unknown",
					group.isAdmin ? "Yes" : "No"
				);
				
				return message.edit(response, sentMsg.messageID);
			}
			
			let response = getLang("groupsList");
			groups.slice(0, 10).forEach((group, index) => {
				response += `${index + 1}. ${group.name}\n`;
				response += `   🆔 ${group.groupID}\n`;
				response += `   👥 ${group.memberCount || "Unknown"} members\n`;
				response += `   ${group.isAdmin ? "👑 Admin" : "👤 Member"}\n`;
				response += `   🔒 ${group.privacy || "Unknown"}\n\n`;
			});
			
			if (groups.length > 10) {
				response += `\n... và ${groups.length - 10} groups khác`;
			}
			
			return message.edit(response, sentMsg.messageID);
			
		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
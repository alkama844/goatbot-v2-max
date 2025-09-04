module.exports = {
	config: {
		name: "threadinfo",
		aliases: ["groupinfo", "ginfo", "tinfo"],
		version: "1.0",
		author: "nafij pro",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem thông tin chi tiết về group/thread hiện tại",
			en: "View detailed information about current group/thread"
		},
		category: "info",
		guide: {
			vi: "   {pn}: xem thông tin group hiện tại\n   {pn} <threadID>: xem thông tin group khác\n   {pn} members: xem danh sách thành viên\n   {pn} admins: xem danh sách admin",
			en: "   {pn}: view current group info\n   {pn} <threadID>: view other group info\n   {pn} members: view members list\n   {pn} admins: view admin list"
		}
	},

	langs: {
		vi: {
			loading: "🔄 Đang tải thông tin group...",
			threadInfo: "📋 Thông tin Group:\n\n🏷️ Tên: %1\n🆔 ID: %2\n👥 Tổng thành viên: %3\n👨‍💼 Admin: %4\n🎨 Theme: %5\n😊 Emoji: %6\n💬 Tổng tin nhắn: %7\n📅 Tạo: %8\n🔗 Link tham gia: %9",
			membersList: "👥 Danh sách thành viên (%1/%2):\n\n%3",
			adminsList: "👨‍💼 Danh sách Admin:\n\n%1",
			notFound: "❌ Không tìm thấy thông tin group",
			onlyGroup: "❌ Lệnh này chỉ hoạt động trong group chat",
			noPermission: "❌ Không có quyền xem thông tin group này",
			error: "❌ Lỗi: %1"
		},
		en: {
			loading: "🔄 Loading group information...",
			threadInfo: "📋 Group Information:\n\n🏷️ Name: %1\n🆔 ID: %2\n👥 Total members: %3\n👨‍💼 Admins: %4\n🎨 Theme: %5\n😊 Emoji: %6\n💬 Total messages: %7\n📅 Created: %8\n🔗 Join link: %9",
			membersList: "👥 Members List (%1/%2):\n\n%3",
			adminsList: "👨‍💼 Admin List:\n\n%1",
			notFound: "❌ Group information not found",
			onlyGroup: "❌ This command only works in group chats",
			noPermission: "❌ No permission to view this group info",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, threadsData, usersData, getLang }) {
		try {
			const action = args[0]?.toLowerCase();
			let targetThreadID = event.threadID;

			// Check if user provided different thread ID
			if (action && !["members", "admins"].includes(action)) {
				targetThreadID = action;
			}

			if (action !== "members" && action !== "admins" && !event.isGroup && !args[0]) {
				return message.reply(getLang("onlyGroup"));
			}

			const sentMsg = await message.reply(getLang("loading"));

			try {
				// Get thread info from Facebook API for most accurate data
				const threadInfo = await new Promise((resolve, reject) => {
					api.getThreadInfo(targetThreadID, (err, data) => {
						if (err) reject(err);
						else resolve(data);
					});
				});

				// Get local thread data
				const localThreadData = await threadsData.get(targetThreadID);

				if (action === "members") {
					const activeMembers = threadInfo.userInfo.filter(user => 
						localThreadData.members.some(member => 
							member.userID === user.id && member.inGroup
						)
					);

					let membersList = "";
					activeMembers.slice(0, 20).forEach((user, index) => {
						const localMember = localThreadData.members.find(m => m.userID === user.id);
						const isAdmin = threadInfo.adminIDs.some(admin => admin.id === user.id);
						
						membersList += `${index + 1}. ${user.name}${isAdmin ? " 👑" : ""}\n`;
						membersList += `   🆔 ${user.id}\n`;
						membersList += `   💬 ${localMember?.count || 0} messages\n`;
						if (user.vanity) membersList += `   🔗 fb.com/${user.vanity}\n`;
						membersList += "\n";
					});

					if (activeMembers.length > 20) {
						membersList += `... và ${activeMembers.length - 20} thành viên khác`;
					}

					return message.edit(getLang("membersList", activeMembers.length, threadInfo.participantIDs.length, membersList), sentMsg.messageID);
				}

				if (action === "admins") {
					const adminInfo = threadInfo.userInfo.filter(user =>
						threadInfo.adminIDs.some(admin => admin.id === user.id)
					);

					let adminsList = "";
					adminInfo.forEach((admin, index) => {
						adminsList += `${index + 1}. ${admin.name} 👑\n`;
						adminsList += `   🆔 ${admin.id}\n`;
						if (admin.vanity) adminsList += `   🔗 fb.com/${admin.vanity}\n`;
						adminsList += "\n";
					});

					return message.edit(getLang("adminsList", adminsList), sentMsg.messageID);
				}

				// Main thread info
				const createdDate = localThreadData.createdAt ? 
					new Date(localThreadData.createdAt).toLocaleDateString() : "Unknown";
				
				const joinLink = threadInfo.inviteLink?.enable ? 
					`✅ Enabled\n${threadInfo.inviteLink.link}` : "❌ Disabled";

				const response = getLang("threadInfo",
					threadInfo.threadName || "Unnamed Group",
					threadInfo.threadID,
					threadInfo.participantIDs.length,
					threadInfo.adminIDs.length,
					threadInfo.threadTheme?.name || localThreadData.threadThemeID || "Default",
					threadInfo.emoji || "👍",
					threadInfo.messageCount || "Unknown",
					createdDate,
					joinLink
				);

				return message.edit(response, sentMsg.messageID);

			} catch (err) {
				return message.edit(getLang("notFound"), sentMsg.messageID);
			}

		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
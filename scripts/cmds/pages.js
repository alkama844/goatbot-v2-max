module.exports = {
	config: {
		name: "pages",
		version: "1.0",
		author: "nafij pro",
		countDown: 5,
		role: 1,
		description: {
			vi: "Quản lý các trang Facebook",
			en: "Manage Facebook pages"
		},
		category: "admin",
		guide: {
			vi: "   {pn}: xem danh sách trang\n   {pn} <page_id>: xem chi tiết trang",
			en: "   {pn}: view pages list\n   {pn} <page_id>: view page details"
		}
	},

	langs: {
		vi: {
			loading: "🔄 Đang tải danh sách trang...",
			pagesList: "📄 Danh sách Trang Facebook:\n\n",
			noPages: "❌ Không có trang nào",
			pageDetails: "📄 Chi tiết Trang:\n\n🏷️ Tên: %1\n🆔 ID: %2\n📂 Danh mục: %3\n👥 Followers: %4\n✅ Verified: %5",
			error: "❌ Lỗi: %1"
		},
		en: {
			loading: "🔄 Loading pages list...",
			pagesList: "📄 Facebook Pages List:\n\n",
			noPages: "❌ No pages found",
			pageDetails: "📄 Page Details:\n\n🏷️ Name: %1\n🆔 ID: %2\n📂 Category: %3\n👥 Followers: %4\n✅ Verified: %5",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, getLang }) {
		try {
			const sentMsg = await message.reply(getLang("loading"));
			
			const pages = await new Promise((resolve, reject) => {
				api.getPages((err, data) => {
					if (err) reject(err);
					else resolve(data);
				});
			});
			
			if (pages.length === 0) {
				return message.edit(getLang("noPages"), sentMsg.messageID);
			}
			
			const pageID = args[0];
			if (pageID) {
				const page = pages.find(p => p.pageID === pageID);
				if (!page) {
					return message.edit("❌ Page not found", sentMsg.messageID);
				}
				
				const response = getLang("pageDetails",
					page.name,
					page.pageID,
					page.category || "Unknown",
					page.followerCount || "Unknown",
					page.isVerified ? "Yes" : "No"
				);
				
				return message.edit(response, sentMsg.messageID);
			}
			
			let response = getLang("pagesList");
			pages.forEach((page, index) => {
				response += `${index + 1}. ${page.name}\n`;
				response += `   🆔 ${page.pageID}\n`;
				response += `   📂 ${page.category || "Unknown"}\n`;
				response += `   👥 ${page.followerCount || "Unknown"} followers\n`;
				response += `   ${page.isVerified ? "✅ Verified" : "❌ Not verified"}\n\n`;
			});
			
			return message.edit(response, sentMsg.messageID);
			
		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
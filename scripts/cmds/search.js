module.exports = {
	config: {
		name: "search",
		aliases: ["find", "searchmsg"],
		version: "1.0",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			vi: "Tìm kiếm tin nhắn trong nhóm chat",
			en: "Search messages in group chat"
		},
		category: "info", 
		guide: {
			vi: "   {pn} <từ khóa>: tìm kiếm tin nhắn chứa từ khóa trong nhóm hiện tại"
				+ "\n   {pn} global <từ khóa>: tìm kiếm tin nhắn trong tất cả nhóm chat",
			en: "   {pn} <keyword>: search messages containing keyword in current group"
				+ "\n   {pn} global <keyword>: search messages in all group chats"
		}
	},

	langs: {
		vi: {
			noKeyword: "⚠️ | Vui lòng nhập từ khóa cần tìm kiếm",
			noResults: "⚠️ | Không tìm thấy kết quả nào cho từ khóa: %1",
			searchResults: "🔍 | Kết quả tìm kiếm cho '%1':\n%2",
			searchError: "❌ | Lỗi khi tìm kiếm tin nhắn"
		},
		en: {
			noKeyword: "⚠️ | Please enter a keyword to search",
			noResults: "⚠️ | No results found for keyword: %1",
			searchResults: "🔍 | Search results for '%1':\n%2",
			searchError: "❌ | Error searching messages"
		}
	},

	onStart: async function ({ message, event, args, api, threadsData, getLang }) {
		if (!args[0]) {
			return message.reply(getLang("noKeyword"));
		}

		const isGlobalSearch = args[0].toLowerCase() === "global";
		const keyword = isGlobalSearch ? args.slice(1).join(" ") : args.join(" ");
		const searchThreadID = isGlobalSearch ? null : event.threadID;

		if (!keyword) {
			return message.reply(getLang("noKeyword"));
		}

		try {
			const searchResults = await api.searchMessages(keyword, searchThreadID, 10);
			
			if (searchResults.length === 0) {
				return message.reply(getLang("noResults", keyword));
			}

			const resultText = await Promise.all(searchResults.map(async (result, i) => {
				let threadName = "Unknown";
				if (result.threadID !== event.threadID) {
					try {
						const threadData = await threadsData.get(result.threadID);
						threadName = threadData.threadName || "Unknown";
					} catch (e) {
						// Ignore error
					}
				} else {
					threadName = "Current group";
				}

				return `${i + 1}. ${result.snippet}\n   📍 ${threadName}\n   👤 Sender: ${result.senderID}`;
			}));

			return message.reply(getLang("searchResults", keyword, resultText.join("\n\n")));
		} catch (err) {
			return message.reply(getLang("searchError"));
		}
	}
};
module.exports = {
	config: {
		name: "games",
		version: "1.0",
		author: "nafij pro",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem danh sách games Facebook",
			en: "View Facebook games list"
		},
		category: "entertainment",
		guide: {
			vi: "   {pn}: xem danh sách games\n   {pn} <game_id>: xem chi tiết game",
			en: "   {pn}: view games list\n   {pn} <game_id>: view game details"
		}
	},

	langs: {
		vi: {
			loading: "🔄 Đang tải danh sách games...",
			gamesList: "🎮 Danh sách Games Facebook:\n\n",
			noGames: "❌ Không tìm thấy game nào",
			gameDetails: "🎮 Chi tiết Game:\n\n🏷️ Tên: %1\n📝 Mô tả: %2\n📂 Danh mục: %3\n🎯 Đã cài: %4\n🎲 Lượt chơi: %5",
			error: "❌ Lỗi: %1"
		},
		en: {
			loading: "🔄 Loading games list...",
			gamesList: "🎮 Facebook Games List:\n\n",
			noGames: "❌ No games found",
			gameDetails: "🎮 Game Details:\n\n🏷️ Name: %1\n📝 Description: %2\n📂 Category: %3\n🎯 Installed: %4\n🎲 Play count: %5",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, getLang }) {
		try {
			const sentMsg = await message.reply(getLang("loading"));
			
			const games = await new Promise((resolve, reject) => {
				api.getGameList((err, data) => {
					if (err) reject(err);
					else resolve(data);
				});
			});
			
			if (games.length === 0) {
				return message.edit(getLang("noGames"), sentMsg.messageID);
			}
			
			const gameID = args[0];
			if (gameID) {
				const game = games.find(g => g.gameID === gameID);
				if (!game) {
					return message.edit("❌ Game not found", sentMsg.messageID);
				}
				
				const response = getLang("gameDetails",
					game.name,
					game.description || "No description",
					game.category || "Unknown",
					game.isInstalled ? "Yes" : "No",
					game.playCount || "Unknown"
				);
				
				return message.edit(response, sentMsg.messageID);
			}
			
			let response = getLang("gamesList");
			games.slice(0, 10).forEach((game, index) => {
				response += `${index + 1}. ${game.name}\n`;
				response += `   🆔 ${game.gameID}\n`;
				response += `   📂 ${game.category || "Unknown"}\n`;
				response += `   ${game.isInstalled ? "✅ Installed" : "❌ Not installed"}\n\n`;
			});
			
			if (games.length > 10) {
				response += `\n... và ${games.length - 10} games khác`;
			}
			
			return message.edit(response, sentMsg.messageID);
			
		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
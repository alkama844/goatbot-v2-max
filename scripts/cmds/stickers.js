module.exports = {
	config: {
		name: "stickers",
		version: "1.0",
		author: "nafij pro",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem danh sách sticker packs có sẵn",
			en: "View available sticker packs"
		},
		category: "utility",
		guide: {
			vi: "   {pn}: xem danh sách sticker packs\n   {pn} <pack_id>: xem chi tiết pack",
			en: "   {pn}: view sticker packs list\n   {pn} <pack_id>: view pack details"
		}
	},

	langs: {
		vi: {
			loading: "🔄 Đang tải danh sách sticker packs...",
			availablePacks: "📦 Danh sách Sticker Packs có sẵn:",
			packDetails: "📦 Chi tiết Sticker Pack:\n\n🏷️ Tên: %1\n📝 Mô tả: %2\n🔢 Số lượng stickers: %3",
			noStickers: "❌ Không tìm thấy sticker packs nào",
			packNotFound: "❌ Không tìm thấy pack với ID: %1",
			error: "❌ Lỗi khi lấy danh sách stickers: %1"
		},
		en: {
			loading: "🔄 Loading sticker packs list...",
			availablePacks: "📦 Available Sticker Packs:",
			packDetails: "📦 Sticker Pack Details:\n\n🏷️ Name: %1\n📝 Description: %2\n🔢 Stickers count: %3",
			noStickers: "❌ No sticker packs found",
			packNotFound: "❌ Pack not found with ID: %1",
			error: "❌ Error getting stickers list: %1"
		}
	},

	onStart: async function ({ api, args, message, event, getLang }) {
		try {
			const packID = args[0];
			const sentMsg = await message.reply(getLang("loading"));
			
			const stickers = await new Promise((resolve, reject) => {
				api.getStickers((err, data) => {
					if (err) reject(err);
					else resolve(data);
				});
			});
			
			if (!packID) {
				if (stickers.length === 0) {
					return message.edit(getLang("noStickers"), sentMsg.messageID);
				}
				
				let response = getLang("availablePacks") + "\n\n";
				stickers.slice(0, 10).forEach((pack, index) => {
					response += `${index + 1}. ${pack.name}\n🆔 ID: ${pack.packID}\n📝 ${pack.description || 'No description'}\n\n`;
				});
				
				if (stickers.length > 10) {
					response += `\n... và ${stickers.length - 10} packs khác`;
				}
				
				return message.edit(response, sentMsg.messageID);
			} else {
				const pack = stickers.find(p => p.packID === packID);
				if (!pack) {
					return message.edit(getLang("packNotFound", packID), sentMsg.messageID);
				}
				
				const response = getLang("packDetails", pack.name, pack.description || 'No description', pack.stickers.length);
				return message.edit(response, sentMsg.messageID);
			}
			
		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
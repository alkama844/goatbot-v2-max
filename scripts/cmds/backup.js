module.exports = {
	config: {
		name: "backup",
		version: "1.0",
		author: "nafij pro",
		countDown: 30,
		role: 2,
		description: {
			vi: "Sao lưu và phục hồi dữ liệu bot",
			en: "Backup and restore bot data"
		},
		category: "system",
		guide: {
			vi: "   {pn} create: tạo backup\n   {pn} list: xem danh sách backup\n   {pn} restore <id>: phục hồi backup\n   {pn} auto on/off: bật/tắt auto backup",
			en: "   {pn} create: create backup\n   {pn} list: view backup list\n   {pn} restore <id>: restore backup\n   {pn} auto on/off: enable/disable auto backup"
		}
	},

	langs: {
		vi: {
			creating: "🔄 Đang tạo backup...",
			created: "✅ Đã tạo backup thành công!\n🆔 ID: %1\n📊 Size: %2\n⏰ Time: %3",
			restoring: "🔄 Đang phục hồi backup...",
			restored: "✅ Đã phục hồi backup thành công!",
			backupList: "📋 Danh sách Backup:\n\n%1",
			noBackups: "📋 Chưa có backup nào",
			autoEnabled: "✅ Đã bật auto backup (mỗi 6 giờ)",
			autoDisabled: "❌ Đã tắt auto backup",
			notFound: "❌ Không tìm thấy backup với ID: %1",
			onlyBotAdmin: "❌ Chỉ admin bot mới có thể sử dụng lệnh này",
			error: "❌ Lỗi: %1"
		},
		en: {
			creating: "🔄 Creating backup...",
			created: "✅ Backup created successfully!\n🆔 ID: %1\n📊 Size: %2\n⏰ Time: %3",
			restoring: "🔄 Restoring backup...",
			restored: "✅ Backup restored successfully!",
			backupList: "📋 Backup List:\n\n%1",
			noBackups: "📋 No backups found",
			autoEnabled: "✅ Auto backup enabled (every 6 hours)",
			autoDisabled: "❌ Auto backup disabled",
			notFound: "❌ Backup not found with ID: %1",
			onlyBotAdmin: "❌ Only bot admins can use this command",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, globalData, threadsData, usersData, getLang }) {
		try {
			if (!global.GoatBot.config.adminBot.includes(event.senderID)) {
				return message.reply(getLang("onlyBotAdmin"));
			}

			const action = args[0]?.toLowerCase();
			const subAction = args[1]?.toLowerCase();

			switch (action) {
				case "create":
					const sentMsg = await message.reply(getLang("creating"));
					
					// Create backup data
					const backupData = {
						threads: await threadsData.getAll(),
						users: await usersData.getAll(),
						globals: await globalData.getAll(),
						config: global.GoatBot.config,
						timestamp: Date.now(),
						version: require('../../package.json').version
					};

					const backupId = `backup_${Date.now()}`;
					await globalData.set("backups", {
						[backupId]: {
							data: backupData,
							size: JSON.stringify(backupData).length,
							created: new Date().toISOString(),
							creator: event.senderID
						}
					}, "data");

					const size = (JSON.stringify(backupData).length / 1024 / 1024).toFixed(2);
					return message.edit(getLang("created", backupId, `${size} MB`, new Date().toLocaleString()), sentMsg.messageID);

				case "list":
					const backups = await globalData.get("backups", "data", {});
					if (Object.keys(backups).length === 0) {
						return message.reply(getLang("noBackups"));
					}

					let backupList = "";
					Object.entries(backups).forEach(([id, backup]) => {
						const size = (backup.size / 1024 / 1024).toFixed(2);
						backupList += `🆔 ${id}\n`;
						backupList += `📊 ${size} MB\n`;
						backupList += `⏰ ${new Date(backup.created).toLocaleString()}\n\n`;
					});

					return message.reply(getLang("backupList", backupList));

				case "restore":
					const restoreId = args[1];
					if (!restoreId) {
						return message.reply("❌ Please enter backup ID");
					}

					const restoreMsg = await message.reply(getLang("restoring"));
					
					const backups = await globalData.get("backups", "data", {});
					if (!backups[restoreId]) {
						return message.edit(getLang("notFound", restoreId), restoreMsg.messageID);
					}

					// This would require careful implementation to avoid data loss
					return message.edit("🚧 Restore feature coming soon for safety reasons", restoreMsg.messageID);

				case "auto":
					let autoSettings = await globalData.get("autoBackup", "data", { enabled: false });
					
					if (subAction === "on") {
						autoSettings.enabled = true;
						autoSettings.interval = 6 * 60 * 60 * 1000; // 6 hours
						await globalData.set("autoBackup", autoSettings, "data");
						
						// Start auto backup if not already running
						this.startAutoBackup();
						
						return message.reply(getLang("autoEnabled"));
					} else if (subAction === "off") {
						autoSettings.enabled = false;
						await globalData.set("autoBackup", autoSettings, "data");
						return message.reply(getLang("autoDisabled"));
					}
					break;

				default:
					return message.reply("❌ Available actions: create, list, restore, auto");
			}

		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	},

	startAutoBackup: function() {
		setInterval(async () => {
			try {
				const autoSettings = await global.db.globalData.get("autoBackup", "data", { enabled: false });
				if (!autoSettings.enabled) return;

				// Auto create backup
				const backupData = {
					threads: await global.db.threadsData.getAll(),
					users: await global.db.usersData.getAll(),
					globals: await global.db.globalData.getAll(),
					timestamp: Date.now(),
					auto: true
				};

				const backupId = `auto_backup_${Date.now()}`;
				await global.db.globalData.set("backups", {
					[backupId]: {
						data: backupData,
						size: JSON.stringify(backupData).length,
						created: new Date().toISOString(),
						auto: true
					}
				}, "data");

				global.utils.log.info("AUTO BACKUP", `Created auto backup: ${backupId}`);

			} catch (err) {
				global.utils.log.error("AUTO BACKUP", err);
			}
		}, 6 * 60 * 60 * 1000); // Every 6 hours
	}
};
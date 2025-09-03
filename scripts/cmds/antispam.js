module.exports = {
	config: {
		name: "antispam",
		version: "1.0",
		author: "nafij pro",
		countDown: 5,
		role: 1,
		description: {
			vi: "Hệ thống chống spam thông minh",
			en: "Smart anti-spam system"
		},
		category: "admin",
		guide: {
			vi: "   {pn} on: bật anti-spam\n   {pn} off: tắt anti-spam\n   {pn} config: cấu hình anti-spam\n   {pn} status: xem trạng thái",
			en: "   {pn} on: enable anti-spam\n   {pn} off: disable anti-spam\n   {pn} config: configure anti-spam\n   {pn} status: view status"
		}
	},

	langs: {
		vi: {
			enabled: "✅ Đã bật hệ thống anti-spam",
			disabled: "❌ Đã tắt hệ thống anti-spam",
			status: "🛡️ Trạng thái Anti-spam:\n\n🔄 Status: %1\n⚡ Độ nhạy: %2\n⏱️ Thời gian chờ: %3s\n📊 Tin nhắn giám sát: %4",
			config: "⚙️ Cấu hình Anti-spam:\n\n1️⃣ Độ nhạy (1-10): %1\n2️⃣ Thời gian chờ: %2s\n3️⃣ Số tin nhắn tối đa: %4 tin/phút\n\nReply với: <độ_nhạy> | <thời_gian_chờ> | <số_tin_nhắn_tối_đa>",
			spamDetected: "🚫 SPAM DETECTED!\n👤 User: %1\n📊 Rate: %2 messages/minute\n⚠️ Action: %3",
			warning: "⚠️ Cảnh báo spam! Hãy chậm lại.",
			tempBan: "🚫 Bạn đã bị cấm tạm thời do spam (5 phút)",
			configUpdated: "✅ Đã cập nhật cấu hình anti-spam",
			error: "❌ Lỗi: %1"
		},
		en: {
			enabled: "✅ Anti-spam system enabled",
			disabled: "❌ Anti-spam system disabled", 
			status: "🛡️ Anti-spam Status:\n\n🔄 Status: %1\n⚡ Sensitivity: %2\n⏱️ Cooldown: %3s\n📊 Monitoring: %4 messages",
			config: "⚙️ Anti-spam Config:\n\n1️⃣ Sensitivity (1-10): %1\n2️⃣ Cooldown: %2s\n3️⃣ Max messages: %3 msg/min\n\nReply with: <sensitivity> | <cooldown> | <max_messages>",
			spamDetected: "🚫 SPAM DETECTED!\n👤 User: %1\n📊 Rate: %2 messages/minute\n⚠️ Action: %3",
			warning: "⚠️ Spam warning! Please slow down.",
			tempBan: "🚫 You've been temporarily banned for spamming (5 minutes)",
			configUpdated: "✅ Anti-spam config updated",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, threadsData, getLang }) {
		try {
			const action = args[0]?.toLowerCase();
			const threadID = event.threadID;
			
			let threadData = await threadsData.get(threadID);
			if (!threadData.data.antiSpam) {
				threadData.data.antiSpam = {
					enabled: false,
					sensitivity: 5,
					cooldown: 10,
					maxMessages: 20,
					violations: {}
				};
			}
			
			switch (action) {
				case "on":
					threadData.data.antiSpam.enabled = true;
					await threadsData.set(threadID, threadData);
					return message.reply(getLang("enabled"));
					
				case "off":
					threadData.data.antiSpam.enabled = false;
					await threadsData.set(threadID, threadData);
					return message.reply(getLang("disabled"));
					
				case "status":
					const config = threadData.data.antiSpam;
					const response = getLang("status",
						config.enabled ? "Enabled" : "Disabled",
						config.sensitivity,
						config.cooldown,
						Object.keys(config.violations || {}).length
					);
					return message.reply(response);
					
				case "config":
					const cfg = threadData.data.antiSpam;
					const configMsg = getLang("config", cfg.sensitivity, cfg.cooldown, cfg.maxMessages);
					const sentMsg = await message.reply(configMsg);
					
					global.GoatBot.onReply.set(sentMsg.messageID, {
						commandName: "antispam",
						type: "config",
						threadID: threadID
					});
					return;
					
				default:
					return message.reply(getLang("status", 
						threadData.data.antiSpam.enabled ? "Enabled" : "Disabled",
						threadData.data.antiSpam.sensitivity,
						threadData.data.antiSpam.cooldown,
						Object.keys(threadData.data.antiSpam.violations || {}).length
					));
			}
			
		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	},

	onReply: async function ({ api, event, Reply, threadsData, getLang }) {
		try {
			if (Reply.type === "config") {
				const config = event.body.split("|").map(s => s.trim());
				
				if (config.length !== 3) {
					return api.sendMessage(getLang("invalidFormat"), Reply.threadID);
				}
				
				const [sensitivity, cooldown, maxMessages] = config.map(Number);
				
				if (isNaN(sensitivity) || isNaN(cooldown) || isNaN(maxMessages)) {
					return api.sendMessage("❌ Invalid numbers", Reply.threadID);
				}
				
				let threadData = await threadsData.get(Reply.threadID);
				threadData.data.antiSpam.sensitivity = Math.max(1, Math.min(10, sensitivity));
				threadData.data.antiSpam.cooldown = Math.max(5, Math.min(60, cooldown));
				threadData.data.antiSpam.maxMessages = Math.max(5, Math.min(100, maxMessages));
				
				await threadsData.set(Reply.threadID, threadData);
				return api.sendMessage(getLang("configUpdated"), Reply.threadID);
			}
		} catch (error) {
			return api.sendMessage(getLang("error", error.message), Reply.threadID);
		}
	},

	onChat: async function ({ api, event, threadsData, usersData, getLang }) {
		try {
			const threadData = await threadsData.get(event.threadID);
			if (!threadData.data.antiSpam?.enabled) return;
			
			const senderID = event.senderID;
			const now = Date.now();
			
			// Initialize user tracking
			if (!threadData.data.antiSpam.violations[senderID]) {
				threadData.data.antiSpam.violations[senderID] = {
					messages: [],
					warnings: 0,
					lastWarning: 0,
					tempBanUntil: 0
				};
			}
			
			const userViolations = threadData.data.antiSpam.violations[senderID];
			
			// Check if user is temp banned
			if (userViolations.tempBanUntil > now) {
				return; // Silently ignore
			}
			
			// Add current message
			userViolations.messages.push(now);
			
			// Remove old messages (older than 1 minute)
			userViolations.messages = userViolations.messages.filter(
				timestamp => now - timestamp < 60000
			);
			
			// Check for spam
			const messagesPerMinute = userViolations.messages.length;
			const maxMessages = threadData.data.antiSpam.maxMessages;
			
			if (messagesPerMinute > maxMessages) {
				userViolations.warnings++;
				userViolations.lastWarning = now;
				
				if (userViolations.warnings >= 3) {
					// Temp ban for 5 minutes
					userViolations.tempBanUntil = now + 300000;
					
					const userName = await usersData.getName(senderID);
					api.sendMessage(getLang("tempBan"), event.threadID, event.messageID);
					
					// Notify admins
					const adminMessage = getLang("spamDetected", userName, messagesPerMinute, "Temporary Ban");
					threadData.adminIDs.forEach(adminID => {
						if (adminID !== senderID) {
							api.sendMessage("🚨 " + adminMessage, adminID);
						}
					});
				} else {
					// Warning
					api.sendMessage(getLang("warning"), event.threadID, event.messageID);
				}
				
				await threadsData.set(event.threadID, threadData);
			}
			
		} catch (error) {
			console.log("Antispam error:", error);
		}
	}
};
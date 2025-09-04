module.exports = {
	config: {
		name: "broadcast",
		aliases: ["bc", "announce"],
		version: "1.0",
		author: "nafij pro",
		countDown: 10,
		role: 2,
		description: {
			vi: "Gửi thông báo đến tất cả groups với human-like behavior",
			en: "Send announcement to all groups with human-like behavior"
		},
		category: "admin",
		guide: {
			vi: "   {pn} <tin nhắn>: gửi thông báo đến tất cả groups\n   {pn} file: gửi kèm file đính kèm\n   {pn} delay <giây>: đặt thời gian delay",
			en: "   {pn} <message>: send announcement to all groups\n   {pn} file: send with attachment\n   {pn} delay <seconds>: set delay time"
		}
	},

	langs: {
		vi: {
			broadcasting: "📡 Đang gửi thông báo đến %1 groups...",
			completed: "✅ Đã gửi thành công đến %1/%2 groups\n⏱️ Thời gian: %3\n🤖 Mode: %4",
			noMessage: "❌ Vui lòng nhập nội dung thông báo",
			onlyBotAdmin: "❌ Chỉ admin bot mới có thể sử dụng lệnh này",
			progress: "📊 Tiến độ: %1/%2 groups (%3%)",
			delaySet: "⏱️ Đã đặt delay: %1 giây giữa mỗi tin nhắn",
			error: "❌ Lỗi: %1"
		},
		en: {
			broadcasting: "📡 Broadcasting to %1 groups...",
			completed: "✅ Successfully sent to %1/%2 groups\n⏱️ Time taken: %3\n🤖 Mode: %4",
			noMessage: "❌ Please enter announcement message",
			onlyBotAdmin: "❌ Only bot admins can use this command",
			progress: "📊 Progress: %1/%2 groups (%3%)",
			delaySet: "⏱️ Delay set to: %1 seconds between messages",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, threadsData, globalData, getLang }) {
		try {
			if (!global.GoatBot.config.adminBot.includes(event.senderID)) {
				return message.reply(getLang("onlyBotAdmin"));
			}

			if (args[0] === "delay") {
				const delayTime = parseInt(args[1]);
				if (isNaN(delayTime) || delayTime < 0) {
					return message.reply("❌ Invalid delay time");
				}
				
				await globalData.set("broadcastDelay", delayTime, "data");
				return message.reply(getLang("delaySet", delayTime));
			}

			const broadcastMessage = args.join(" ");
			if (!broadcastMessage) {
				return message.reply(getLang("noMessage"));
			}

			const allThreads = await threadsData.getAll();
			const targetThreads = allThreads.filter(thread => 
				thread.isGroup && 
				thread.threadID !== event.threadID &&
				thread.members.some(member => member.userID === api.getCurrentUserID() && member.inGroup)
			);

			if (targetThreads.length === 0) {
				return message.reply("❌ No target groups found");
			}

			const startTime = Date.now();
			const sentMsg = await message.reply(getLang("broadcasting", targetThreads.length));
			
			const isHumanMode = global.GoatBot.fcaApi.getHumanBehaviorStats?.()?.isHumanMode;
			const customDelay = await globalData.get("broadcastDelay", "data", 3);
			
			let successCount = 0;
			let failedCount = 0;

			const attachments = event.messageReply?.attachments || [];
			const messageForm = {
				body: broadcastMessage,
				attachment: attachments.length > 0 ? attachments : undefined
			};

			if (isHumanMode) {
				// Human mode: Send one by one with realistic delays
				for (let i = 0; i < targetThreads.length; i++) {
					try {
						await new Promise((resolve, reject) => {
							api.sendMessage(messageForm, targetThreads[i].threadID, (err, data) => {
								if (err) reject(err);
								else resolve(data);
							});
						});
						successCount++;
						
						// Update progress every 10 messages
						if (i % 10 === 0) {
							const progress = Math.floor((i / targetThreads.length) * 100);
							await message.edit(getLang("progress", i + 1, targetThreads.length, progress), sentMsg.messageID);
						}
						
						// Human-like delay between sends (varies by time of day)
						const hour = new Date().getHours();
						let delay = customDelay * 1000;
						
						// Longer delays during peak hours to seem more natural
						if (hour >= 9 && hour <= 17) delay *= 1.5;
						if (hour >= 0 && hour <= 6) delay *= 2;
						
						delay += Math.random() * 2000; // Add randomness
						await new Promise(resolve => setTimeout(resolve, delay));
						
					} catch (err) {
						failedCount++;
						console.log(`Failed to send to ${targetThreads[i].threadID}:`, err);
					}
				}
			} else {
				// Robot mode: Send in batches of 5 with minimal delay
				const batchSize = 5;
				for (let i = 0; i < targetThreads.length; i += batchSize) {
					const batch = targetThreads.slice(i, i + batchSize);
					
					const results = await Promise.allSettled(
						batch.map(thread => 
							new Promise((resolve, reject) => {
								api.sendMessage(messageForm, thread.threadID, (err, data) => {
									if (err) reject(err);
									else resolve(data);
								});
							})
						)
					);
					
					successCount += results.filter(r => r.status === 'fulfilled').length;
					failedCount += results.filter(r => r.status === 'rejected').length;
					
					// Small delay between batches
					if (i + batchSize < targetThreads.length) {
						await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
					}
				}
			}

			const timeTaken = global.utils.convertTime(Date.now() - startTime);
			const mode = isHumanMode ? "Human 🧠" : "Robot 🤖";
			
			return message.edit(getLang("completed", successCount, targetThreads.length, timeTaken, mode), sentMsg.messageID);

		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
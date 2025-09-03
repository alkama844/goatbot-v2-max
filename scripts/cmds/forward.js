module.exports = {
	config: {
		name: "forward",
		version: "1.0",
		author: "nafij pro",
		countDown: 3,
		role: 1,
		description: {
			vi: "Chuyển tiếp tin nhắn đến các group khác",
			en: "Forward messages to other groups"
		},
		category: "utility",
		guide: {
			vi: "   Reply tin nhắn và {pn} <threadID1> <threadID2>...: chuyển tiếp tin nhắn\n   Reply tin nhắn và {pn} all: chuyển tiếp đến tất cả group bot tham gia",
			en: "   Reply message and {pn} <threadID1> <threadID2>...: forward message\n   Reply message and {pn} all: forward to all groups bot joined"
		}
	},

	langs: {
		vi: {
			forwarded: "✅ Đã chuyển tiếp tin nhắn đến %1 group(s)",
			noReply: "❌ Vui lòng reply tin nhắn cần chuyển tiếp",
			noTargets: "❌ Vui lòng nhập ID group đích",
			onlyGroup: "❌ Lệnh này chỉ hoạt động trong group chat",
			error: "❌ Lỗi: %1",
			processing: "🔄 Đang chuyển tiếp tin nhắn..."
		},
		en: {
			forwarded: "✅ Message forwarded to %1 group(s)",
			noReply: "❌ Please reply to message to forward",
			noTargets: "❌ Please enter target group IDs",
			onlyGroup: "❌ This command only works in group chats",
			error: "❌ Error: %1",
			processing: "🔄 Forwarding message..."
		}
	},

	onStart: async function ({ api, args, message, event, threadsData, getLang }) {
		try {
			if (!event.isGroup) {
				return message.reply(getLang("onlyGroup"));
			}

			if (!event.messageReply) {
				return message.reply(getLang("noReply"));
			}

			let targetThreads = [];

			if (args[0] === "all") {
				// Forward to all groups bot is in
				const allThreads = await threadsData.getAll();
				targetThreads = allThreads
					.filter(thread => thread.isGroup && thread.threadID !== event.threadID)
					.map(thread => thread.threadID);
			} else {
				if (args.length === 0) {
					return message.reply(getLang("noTargets"));
				}
				targetThreads = args;
			}

			if (targetThreads.length === 0) {
				return message.reply("❌ No target groups found");
			}

			const sentMsg = await message.reply(getLang("processing"));

			// Check if human mode is enabled for sequential processing
			const isHumanMode = global.GoatBot.fcaApi.getHumanBehaviorStats?.()?.isHumanMode;
			
			if (isHumanMode) {
				// Sequential forwarding with human delays
				for (const threadID of targetThreads) {
					try {
						await new Promise((resolve, reject) => {
							api.forwardMessage(event.messageReply.messageID, [threadID], (err, data) => {
								if (err) reject(err);
								else resolve(data);
							});
						});
						
						// Human-like delay between forwards
						await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
					} catch (err) {
						console.log(`Failed to forward to ${threadID}:`, err);
					}
				}
			} else {
				// Parallel forwarding (robot mode)
				await new Promise((resolve, reject) => {
					api.forwardMessage(event.messageReply.messageID, targetThreads, (err, data) => {
						if (err) reject(err);
						else resolve(data);
					});
				});
			}

			return message.edit(getLang("forwarded", targetThreads.length), sentMsg.messageID);

		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
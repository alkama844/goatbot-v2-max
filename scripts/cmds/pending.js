module.exports = {
	config: {
		name: "pending",
		aliases: ["pendings", "requests"],
		version: "1.0",
		author: "nafij pro",
		countDown: 5,
		role: 2,
		description: {
			vi: "Quản lý tin nhắn chờ phê duyệt",
			en: "Manage pending message requests"
		},
		category: "admin",
		guide: {
			vi: "   {pn}: xem danh sách tin nhắn chờ\n   {pn} accept <threadID>: chấp nhận yêu cầu\n   {pn} reject <threadID>: từ chối yêu cầu\n   {pn} acceptall: chấp nhận tất cả",
			en: "   {pn}: view pending requests list\n   {pn} accept <threadID>: accept request\n   {pn} reject <threadID>: reject request\n   {pn} acceptall: accept all requests"
		}
	},

	langs: {
		vi: {
			loading: "🔄 Đang tải tin nhắn chờ phê duyệt...",
			pendingList: "📬 Danh sách tin nhắn chờ phê duyệt:\n\n",
			noPending: "✅ Không có tin nhắn chờ phê duyệt nào",
			accepted: "✅ Đã chấp nhận yêu cầu từ: %1",
			rejected: "❌ Đã từ chối yêu cầu từ: %1",
			acceptedAll: "✅ Đã chấp nhận tất cả %1 yêu cầu chờ phê duyệt",
			noID: "❌ Vui lòng nhập thread ID",
			notFound: "❌ Không tìm thấy yêu cầu với ID: %1",
			onlyBotAdmin: "❌ Chỉ admin bot mới có thể sử dụng lệnh này",
			error: "❌ Lỗi: %1"
		},
		en: {
			loading: "🔄 Loading pending requests...",
			pendingList: "📬 Pending Message Requests:\n\n",
			noPending: "✅ No pending message requests",
			accepted: "✅ Accepted request from: %1",
			rejected: "❌ Rejected request from: %1",
			acceptedAll: "✅ Accepted all %1 pending requests",
			noID: "❌ Please enter thread ID",
			notFound: "❌ Request not found with ID: %1",
			onlyBotAdmin: "❌ Only bot admins can use this command",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, getLang }) {
		try {
			// Only bot admins can manage pending requests
			if (!global.GoatBot.config.adminBot.includes(event.senderID)) {
				return message.reply(getLang("onlyBotAdmin"));
			}

			const action = args[0]?.toLowerCase();
			const sentMsg = await message.reply(getLang("loading"));
			
			const pendingMessages = await new Promise((resolve, reject) => {
				api.getPendingMessages((err, data) => {
					if (err) reject(err);
					else resolve(data);
				});
			});

			if (action === "acceptall") {
				if (pendingMessages.length === 0) {
					return message.edit(getLang("noPending"), sentMsg.messageID);
				}

				const isHumanMode = global.GoatBot.fcaApi.getHumanBehaviorStats?.()?.isHumanMode;
				
				if (isHumanMode) {
					// Sequential processing in human mode
					for (const thread of pendingMessages) {
						try {
							await new Promise((resolve, reject) => {
								api.acceptPendingRequest(thread.threadID, true, (err, data) => {
									if (err) reject(err);
									else resolve(data);
								});
							});
							await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
						} catch (err) {
							console.log(`Failed to accept ${thread.threadID}:`, err);
						}
					}
				} else {
					// Parallel processing in robot mode
					await Promise.allSettled(
						pendingMessages.map(thread => 
							new Promise((resolve, reject) => {
								api.acceptPendingRequest(thread.threadID, true, (err, data) => {
									if (err) reject(err);
									else resolve(data);
								});
							})
						)
					);
				}

				return message.edit(getLang("acceptedAll", pendingMessages.length), sentMsg.messageID);
			}

			if (action === "accept" || action === "reject") {
				const threadID = args[1];
				if (!threadID) {
					return message.edit(getLang("noID"), sentMsg.messageID);
				}

				const thread = pendingMessages.find(t => t.threadID === threadID);
				if (!thread) {
					return message.edit(getLang("notFound", threadID), sentMsg.messageID);
				}

				await new Promise((resolve, reject) => {
					api.acceptPendingRequest(threadID, action === "accept", (err, data) => {
						if (err) reject(err);
						else resolve(data);
					});
				});

				const userName = thread.participants[0]?.name || "Unknown";
				const response = action === "accept" ? 
					getLang("accepted", userName) : 
					getLang("rejected", userName);

				return message.edit(response, sentMsg.messageID);
			}

			if (pendingMessages.length === 0) {
				return message.edit(getLang("noPending"), sentMsg.messageID);
			}

			let response = getLang("pendingList");
			pendingMessages.slice(0, 10).forEach((thread, index) => {
				const userName = thread.participants[0]?.name || "Unknown";
				response += `${index + 1}. ${userName}\n`;
				response += `   🆔 ${thread.threadID}\n`;
				response += `   💬 ${thread.snippet || "No message"}\n`;
				response += `   ⏰ ${new Date(parseInt(thread.timestamp)).toLocaleString()}\n\n`;
			});

			return message.edit(response, sentMsg.messageID);

		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
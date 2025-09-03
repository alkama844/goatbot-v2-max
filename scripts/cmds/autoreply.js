module.exports = {
	config: {
		name: "autoreply",
		aliases: ["ar", "autoresponse"],
		version: "1.0",
		author: "nafij pro",
		countDown: 3,
		role: 1,
		description: {
			vi: "Hệ thống trả lời tự động thông minh với AI",
			en: "Smart auto-reply system with AI responses"
		},
		category: "ai",
		guide: {
			vi: "   {pn} on: bật auto reply\n   {pn} off: tắt auto reply\n   {pn} add <trigger> | <response>: thêm phản hồi tùy chỉnh\n   {pn} remove <trigger>: xóa phản hồi\n   {pn} list: xem danh sách phản hồi",
			en: "   {pn} on: enable auto reply\n   {pn} off: disable auto reply\n   {pn} add <trigger> | <response>: add custom response\n   {pn} remove <trigger>: remove response\n   {pn} list: view response list"
		}
	},

	langs: {
		vi: {
			enabled: "✅ Đã bật auto reply thông minh",
			disabled: "❌ Đã tắt auto reply",
			added: "✅ Đã thêm phản hồi: '%1' → '%2'",
			removed: "✅ Đã xóa phản hồi cho: '%1'",
			notFound: "❌ Không tìm thấy phản hồi cho: '%1'",
			emptyList: "📝 Chưa có phản hồi tùy chỉnh nào",
			responseList: "📝 Danh sách phản hồi tùy chỉnh:\n\n%1",
			invalidFormat: "❌ Format: {pn} add <trigger> | <response>",
			onlyGroup: "❌ Lệnh này chỉ hoạt động trong group chat",
			processing: "🤖 Đang xử lý phản hồi...",
			error: "❌ Lỗi: %1"
		},
		en: {
			enabled: "✅ Smart auto reply enabled",
			disabled: "❌ Auto reply disabled",
			added: "✅ Added response: '%1' → '%2'",
			removed: "✅ Removed response for: '%1'",
			notFound: "❌ Response not found for: '%1'",
			emptyList: "📝 No custom responses yet",
			responseList: "📝 Custom responses list:\n\n%1",
			invalidFormat: "❌ Format: {pn} add <trigger> | <response>",
			onlyGroup: "❌ This command only works in group chats",
			processing: "🤖 Processing response...",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, threadsData, getLang }) {
		try {
			if (!event.isGroup) {
				return message.reply(getLang("onlyGroup"));
			}

			const action = args[0]?.toLowerCase();
			const threadID = event.threadID;
			
			let threadData = await threadsData.get(threadID);
			if (!threadData.data.autoReply) {
				threadData.data.autoReply = {
					enabled: false,
					customResponses: {},
					smartMode: true
				};
			}

			switch (action) {
				case "on":
					threadData.data.autoReply.enabled = true;
					await threadsData.set(threadID, threadData);
					return message.reply(getLang("enabled"));

				case "off":
					threadData.data.autoReply.enabled = false;
					await threadsData.set(threadID, threadData);
					return message.reply(getLang("disabled"));

				case "add":
					const content = args.slice(1).join(" ").split("|");
					if (content.length !== 2) {
						return message.reply(getLang("invalidFormat"));
					}

					const trigger = content[0].trim().toLowerCase();
					const response = content[1].trim();
					
					threadData.data.autoReply.customResponses[trigger] = response;
					await threadsData.set(threadID, threadData);
					
					return message.reply(getLang("added", trigger, response));

				case "remove":
					const triggerToRemove = args.slice(1).join(" ").toLowerCase();
					if (!threadData.data.autoReply.customResponses[triggerToRemove]) {
						return message.reply(getLang("notFound", triggerToRemove));
					}

					delete threadData.data.autoReply.customResponses[triggerToRemove];
					await threadsData.set(threadID, threadData);
					
					return message.reply(getLang("removed", triggerToRemove));

				case "list":
					const responses = threadData.data.autoReply.customResponses;
					if (Object.keys(responses).length === 0) {
						return message.reply(getLang("emptyList"));
					}

					let responseList = "";
					Object.entries(responses).forEach(([trigger, resp], index) => {
						responseList += `${index + 1}. "${trigger}" → "${resp}"\n`;
					});

					return message.reply(getLang("responseList", responseList));

				default:
					const status = threadData.data.autoReply.enabled ? "Enabled ✅" : "Disabled ❌";
					const responseCount = Object.keys(threadData.data.autoReply.customResponses).length;
					
					return message.reply(`📋 Auto Reply Status: ${status}\n📝 Custom responses: ${responseCount}\n🧠 Smart mode: ${threadData.data.autoReply.smartMode ? "On" : "Off"}`);
			}

		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	},

	onChat: async function ({ api, event, threadsData }) {
		try {
			if (event.senderID === api.getCurrentUserID()) return;
			if (!event.isGroup) return;

			const threadData = await threadsData.get(event.threadID);
			if (!threadData.data.autoReply?.enabled) return;

			const message = event.body?.toLowerCase() || "";
			const customResponses = threadData.data.autoReply.customResponses || {};
			
			// Check for custom responses first
			let response = null;
			for (const [trigger, resp] of Object.entries(customResponses)) {
				if (message.includes(trigger)) {
					response = resp;
					break;
				}
			}

			// If no custom response and smart mode enabled, generate smart response
			if (!response && threadData.data.autoReply.smartMode) {
				const smartResponses = [
					"That's interesting! 🤔",
					"I see what you mean! 👍",
					"Good point! 💭",
					"Thanks for sharing! 😊",
					"Hmm, let me think about that... 🧐",
					"That makes sense! ✨",
					"I agree with you! 👌",
					"Interesting perspective! 💡"
				];

				// Only respond to certain triggers
				if (message.includes("bot") || message.includes("?") || Math.random() < 0.2) {
					response = smartResponses[Math.floor(Math.random() * smartResponses.length)];
				}
			}

			if (!response) return;

			// Get human mode status
			const isHumanMode = global.GoatBot.fcaApi.getHumanBehaviorStats?.()?.isHumanMode;
			
			if (isHumanMode) {
				// Human-like delay and typing simulation
				const readDelay = 2000 + Math.random() * 5000;
				await new Promise(resolve => setTimeout(resolve, readDelay));

				// Simulate typing
				const typing = api.sendTypingIndicator(event.threadID);
				const typingTime = response.length * 100 + Math.random() * 2000;
				
				setTimeout(() => {
					typing.end();
					api.sendMessage(response, event.threadID);
				}, typingTime);

			} else {
				// Robot mode: immediate response
				setTimeout(() => {
					api.sendMessage(response, event.threadID);
				}, 100 + Math.random() * 500);
			}

		} catch (error) {
			console.log("Auto reply error:", error);
		}
	}
};
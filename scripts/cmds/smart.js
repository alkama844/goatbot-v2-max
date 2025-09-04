module.exports = {
	config: {
		name: "smart",
		version: "1.0",
		author: "nafij pro",
		countDown: 3,
		role: 0,
		description: {
			vi: "Bot trả lời thông minh với AI",
			en: "Smart AI responses"
		},
		category: "ai",
		guide: {
			vi: "   {pn} <câu hỏi>: hỏi bot\n   {pn} on: bật auto reply\n   {pn} off: tắt auto reply",
			en: "   {pn} <question>: ask bot\n   {pn} on: enable auto reply\n   {pn} off: disable auto reply"
		}
	},

	langs: {
		vi: {
			turnedOn: "✅ Đã bật auto reply thông minh",
			turnedOff: "❌ Đã tắt auto reply thông minh",
			thinking: "🤔 Đang suy nghĩ...",
			error: "❌ Lỗi: %1",
			noQuestion: "❌ Vui lòng nhập câu hỏi"
		},
		en: {
			turnedOn: "✅ Smart auto reply enabled",
			turnedOff: "❌ Smart auto reply disabled",
			thinking: "🤔 Thinking...",
			error: "❌ Error: %1",
			noQuestion: "❌ Please enter a question"
		}
	},

	onStart: async function ({ api, args, message, event, threadsData, getLang }) {
		try {
			const action = args[0]?.toLowerCase();
			const threadID = event.threadID;
			
			if (action === "on") {
				let threadData = await threadsData.get(threadID);
				threadData.data.smartReply = { enabled: true };
				await threadsData.set(threadID, threadData);
				return message.reply(getLang("turnedOn"));
			}
			
			if (action === "off") {
				let threadData = await threadsData.get(threadID);
				threadData.data.smartReply = { enabled: false };
				await threadsData.set(threadID, threadData);
				return message.reply(getLang("turnedOff"));
			}
			
			const question = args.join(" ");
			if (!question) {
				return message.reply(getLang("noQuestion"));
			}
			
			const sentMsg = await message.reply(getLang("thinking"));
			
			// Simple smart responses (you can integrate with real AI API)
			const responses = [
				"That's an interesting question! Let me think about it...",
				"I understand what you're asking. Here's my perspective...",
				"Good question! From what I know...",
				"Let me help you with that...",
				"That's a great point! I think...",
				"I see what you mean. My thoughts are...",
				"Excellent question! Based on my knowledge...",
				"I'm glad you asked! Here's what I think..."
			];
			
			// Simulate thinking time
			await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
			
			const response = responses[Math.floor(Math.random() * responses.length)] + 
				" " + this.generateSmartResponse(question);
			
			return message.edit(response, sentMsg.messageID);
			
		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	},

	generateSmartResponse: function(question) {
		// Simple response generation based on keywords
		const keywords = question.toLowerCase();
		
		if (keywords.includes("hello") || keywords.includes("hi")) {
			return "Hello there! How can I help you today?";
		}
		if (keywords.includes("how are you")) {
			return "I'm doing great, thank you for asking! How about you?";
		}
		if (keywords.includes("weather")) {
			return "You should check the weather command for accurate information!";
		}
		if (keywords.includes("time")) {
			return `It's currently ${new Date().toLocaleTimeString()}.`;
		}
		if (keywords.includes("joke")) {
			const jokes = [
				"Why don't scientists trust atoms? Because they make up everything!",
				"Why did the scarecrow win an award? Because he was outstanding in his field!",
				"Why don't eggs tell jokes? They'd crack each other up!"
			];
			return jokes[Math.floor(Math.random() * jokes.length)];
		}
		
		return "That's an interesting topic! What do you think about it?";
	},

	onChat: async function ({ api, event, threadsData }) {
		try {
			if (event.senderID === api.getCurrentUserID()) return;
			
			const threadData = await threadsData.get(event.threadID);
			if (!threadData.data.smartReply?.enabled) return;
			
			const message = event.body?.toLowerCase() || "";
			
			// Only respond to questions or mentions
			if (!message.includes("?") && !message.includes("bot")) return;
			
			// Random chance to respond (30% to seem natural)
			if (Math.random() < 0.7) return;
			
			// Simulate human-like delay
			setTimeout(async () => {
				try {
					// Simulate typing
					const typing = api.sendTypingIndicator(event.threadID);
					setTimeout(() => typing.end(), 2000 + Math.random() * 3000);
					
					const responses = [
						"I think that's interesting! 🤔",
						"Good question! Let me think about that...",
						"That's a great point! 👍",
						"Hmm, interesting perspective! 🧐",
						"I see what you mean! 💭",
						"That makes sense! ✨"
					];
					
					const response = responses[Math.floor(Math.random() * responses.length)];
					
					setTimeout(() => {
						api.sendMessage(response, event.threadID);
					}, 3000 + Math.random() * 4000);
					
				} catch (err) {
					console.log("Smart reply error:", err);
				}
			}, 2000 + Math.random() * 8000);
			
		} catch (error) {
			console.log("Smart chat error:", error);
		}
	}
};
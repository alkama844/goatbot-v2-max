module.exports = {
	config: {
		name: "voicecall",
		aliases: ["vcall", "voice"],
		version: "1.0",
		author: "nafij pro",
		countDown: 10,
		role: 1,
		description: {
			vi: "Mô phỏng cuộc gọi voice và video call",
			en: "Simulate voice and video calls"
		},
		category: "entertainment",
		guide: {
			vi: "   {pn}: tạo cuộc gọi voice giả\n   {pn} video: tạo cuộc gọi video giả\n   {pn} end: kết thúc cuộc gọi\n   {pn} join: tham gia cuộc gọi",
			en: "   {pn}: create fake voice call\n   {pn} video: create fake video call\n   {pn} end: end call\n   {pn} join: join call"
		}
	},

	langs: {
		vi: {
			voiceStarted: "📞 Cuộc gọi voice đã bắt đầu!\n👥 Người tham gia: %1\n⏰ Thời gian: %2",
			videoStarted: "📹 Cuộc gọi video đã bắt đầu!\n👥 Người tham gia: %1\n⏰ Thời gian: %2",
			callEnded: "📞 Cuộc gọi đã kết thúc\n⏱️ Thời lượng: %1\n👥 Tham gia: %2 người",
			joined: "✅ %1 đã tham gia cuộc gọi",
			noCall: "❌ Không có cuộc gọi nào đang diễn ra",
			alreadyInCall: "❌ Bạn đã trong cuộc gọi rồi",
			onlyGroup: "❌ Lệnh này chỉ hoạt động trong group chat",
			connecting: "🔄 Đang kết nối cuộc gọi...",
			error: "❌ Lỗi: %1"
		},
		en: {
			voiceStarted: "📞 Voice call started!\n👥 Participants: %1\n⏰ Time: %2",
			videoStarted: "📹 Video call started!\n👥 Participants: %1\n⏰ Time: %2",
			callEnded: "📞 Call ended\n⏱️ Duration: %1\n👥 Participants: %2 people",
			joined: "✅ %1 joined the call",
			noCall: "❌ No active call",
			alreadyInCall: "❌ You're already in a call",
			onlyGroup: "❌ This command only works in group chats",
			connecting: "🔄 Connecting call...",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, threadsData, usersData, getLang }) {
		try {
			if (!event.isGroup) {
				return message.reply(getLang("onlyGroup"));
			}

			const action = args[0]?.toLowerCase();
			const threadID = event.threadID;
			
			let threadData = await threadsData.get(threadID);
			if (!threadData.data.voiceCall) {
				threadData.data.voiceCall = {
					active: false,
					participants: [],
					startTime: null,
					type: null
				};
			}

			switch (action) {
				case "video":
				case undefined:
					if (threadData.data.voiceCall.active) {
						return message.reply("📞 Đã có cuộc gọi đang diễn ra");
					}

					const sentMsg = await message.reply(getLang("connecting"));
					
					// Simulate connection delay
					await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
					
					const userName = await usersData.getName(event.senderID);
					const callType = action === "video" ? "video" : "voice";
					
					threadData.data.voiceCall = {
						active: true,
						participants: [{ userID: event.senderID, name: userName, joinTime: Date.now() }],
						startTime: Date.now(),
						type: callType
					};
					
					await threadsData.set(threadID, threadData);

					const response = callType === "video" ? 
						getLang("videoStarted", userName, new Date().toLocaleTimeString()) :
						getLang("voiceStarted", userName, new Date().toLocaleTimeString());

					// Auto end call after 30 minutes
					setTimeout(async () => {
						try {
							const currentData = await threadsData.get(threadID);
							if (currentData.data.voiceCall?.active) {
								currentData.data.voiceCall.active = false;
								await threadsData.set(threadID, currentData);
								
								const duration = global.utils.convertTime(Date.now() - currentData.data.voiceCall.startTime);
								api.sendMessage(getLang("callEnded", duration, currentData.data.voiceCall.participants.length), threadID);
							}
						} catch (err) {
							console.log("Auto end call error:", err);
						}
					}, 30 * 60 * 1000); // 30 minutes

					return message.edit(response, sentMsg.messageID);

				case "join":
					if (!threadData.data.voiceCall.active) {
						return message.reply(getLang("noCall"));
					}

					const isAlreadyJoined = threadData.data.voiceCall.participants.some(p => p.userID === event.senderID);
					if (isAlreadyJoined) {
						return message.reply(getLang("alreadyInCall"));
					}

					const joinerName = await usersData.getName(event.senderID);
					threadData.data.voiceCall.participants.push({
						userID: event.senderID,
						name: joinerName,
						joinTime: Date.now()
					});

					await threadsData.set(threadID, threadData);
					return message.reply(getLang("joined", joinerName));

				case "end":
					if (!threadData.data.voiceCall.active) {
						return message.reply(getLang("noCall"));
					}

					const callDuration = global.utils.convertTime(Date.now() - threadData.data.voiceCall.startTime);
					const participantCount = threadData.data.voiceCall.participants.length;

					threadData.data.voiceCall.active = false;
					await threadsData.set(threadID, threadData);

					return message.reply(getLang("callEnded", callDuration, participantCount));

				default:
					return message.reply("❌ Available actions: [empty], video, join, end");
			}

		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
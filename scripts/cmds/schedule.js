module.exports = {
	config: {
		name: "schedule",
		aliases: ["scheduler", "timer"],
		version: "1.0",
		author: "nafij pro",
		countDown: 5,
		role: 1,
		description: {
			vi: "Lên lịch gửi tin nhắn với human timing",
			en: "Schedule messages with human timing"
		},
		category: "utility",
		guide: {
			vi: "   {pn} <thời_gian> <tin_nhắn>: lên lịch tin nhắn\n   {pn} list: xem danh sách lịch\n   {pn} cancel <id>: hủy lịch\n   Ví dụ: {pn} 30m Nhắc nhở họp\n   {pn} 2h Chúc ngủ ngon",
			en: "   {pn} <time> <message>: schedule message\n   {pn} list: view schedule list\n   {pn} cancel <id>: cancel schedule\n   Example: {pn} 30m Meeting reminder\n   {pn} 2h Good night"
		}
	},

	langs: {
		vi: {
			scheduled: "⏰ Đã lên lịch tin nhắn:\n📝 Nội dung: %1\n⏱️ Thời gian: %2\n🆔 ID: %3",
			cancelled: "❌ Đã hủy lịch ID: %1",
			notFound: "❌ Không tìm thấy lịch với ID: %1",
			emptyList: "📅 Chưa có lịch nào được đặt",
			scheduleList: "📅 Danh sách lịch:\n\n%1",
			invalidTime: "❌ Format thời gian không đúng. Ví dụ: 30m, 2h, 1d",
			noMessage: "❌ Vui lòng nhập nội dung tin nhắn",
			sent: "✅ Tin nhắn đã lên lịch đã được gửi",
			onlyGroup: "❌ Lệnh này chỉ hoạt động trong group chat",
			error: "❌ Lỗi: %1"
		},
		en: {
			scheduled: "⏰ Message scheduled:\n📝 Content: %1\n⏱️ Time: %2\n🆔 ID: %3",
			cancelled: "❌ Schedule cancelled ID: %1",
			notFound: "❌ Schedule not found with ID: %1",
			emptyList: "📅 No schedules set",
			scheduleList: "📅 Schedule list:\n\n%1",
			invalidTime: "❌ Invalid time format. Example: 30m, 2h, 1d",
			noMessage: "❌ Please enter message content",
			sent: "✅ Scheduled message sent",
			onlyGroup: "❌ This command only works in group chats",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, threadsData, globalData, getLang }) {
		try {
			if (!event.isGroup) {
				return message.reply(getLang("onlyGroup"));
			}

			const action = args[0];

			if (action === "list") {
				const schedules = await globalData.get("messageSchedules", "data", []);
				const threadSchedules = schedules.filter(s => s.threadID === event.threadID);

				if (threadSchedules.length === 0) {
					return message.reply(getLang("emptyList"));
				}

				let scheduleText = "";
				threadSchedules.forEach((schedule, index) => {
					scheduleText += `${index + 1}. ${schedule.message.substring(0, 50)}\n`;
					scheduleText += `   ⏰ ${new Date(schedule.time).toLocaleString()}\n`;
					scheduleText += `   🆔 ${schedule.id}\n\n`;
				});

				return message.reply(getLang("scheduleList", scheduleText));
			}

			if (action === "cancel") {
				const scheduleId = args[1];
				if (!scheduleId) {
					return message.reply("❌ Please enter schedule ID");
				}

				let schedules = await globalData.get("messageSchedules", "data", []);
				const scheduleIndex = schedules.findIndex(s => s.id === scheduleId && s.threadID === event.threadID);

				if (scheduleIndex === -1) {
					return message.reply(getLang("notFound", scheduleId));
				}

				// Clear timeout
				if (global.scheduleTimeouts && global.scheduleTimeouts[scheduleId]) {
					clearTimeout(global.scheduleTimeouts[scheduleId]);
					delete global.scheduleTimeouts[scheduleId];
				}

				schedules.splice(scheduleIndex, 1);
				await globalData.set("messageSchedules", schedules, "data");

				return message.reply(getLang("cancelled", scheduleId));
			}

			// Parse time and message
			const timeStr = args[0];
			const messageContent = args.slice(1).join(" ");

			if (!timeStr || !messageContent) {
				return message.reply(getLang("noMessage"));
			}

			// Parse time (30m, 2h, 1d, etc.)
			const timeMatch = timeStr.match(/^(\d+)([mhd])$/);
			if (!timeMatch) {
				return message.reply(getLang("invalidTime"));
			}

			const [, amount, unit] = timeMatch;
			const multipliers = { m: 60000, h: 3600000, d: 86400000 };
			const delay = parseInt(amount) * multipliers[unit];

			if (delay < 60000 || delay > 86400000 * 7) { // 1 minute to 7 days
				return message.reply("❌ Time must be between 1 minute and 7 days");
			}

			const scheduleId = Date.now().toString();
			const executeTime = Date.now() + delay;

			// Store schedule
			let schedules = await globalData.get("messageSchedules", "data", []);
			schedules.push({
				id: scheduleId,
				threadID: event.threadID,
				message: messageContent,
				time: executeTime,
				senderID: event.senderID,
				createdAt: Date.now()
			});

			await globalData.set("messageSchedules", schedules, "data");

			// Set timeout
			if (!global.scheduleTimeouts) global.scheduleTimeouts = {};
			
			global.scheduleTimeouts[scheduleId] = setTimeout(async () => {
				try {
					const isHumanMode = global.GoatBot.fcaApi.getHumanBehaviorStats?.()?.isHumanMode;
					
					if (isHumanMode) {
						// Simulate human sending scheduled message
						const typing = api.sendTypingIndicator(event.threadID);
						setTimeout(() => {
							typing.end();
							api.sendMessage(`⏰ ${messageContent}`, event.threadID);
						}, 1000 + Math.random() * 3000);
					} else {
						api.sendMessage(`⏰ ${messageContent}`, event.threadID);
					}

					// Remove from schedules
					let currentSchedules = await globalData.get("messageSchedules", "data", []);
					currentSchedules = currentSchedules.filter(s => s.id !== scheduleId);
					await globalData.set("messageSchedules", currentSchedules, "data");
					
					delete global.scheduleTimeouts[scheduleId];

				} catch (err) {
					console.log("Schedule execute error:", err);
				}
			}, delay);

			const scheduleTime = new Date(executeTime).toLocaleString();
			return message.reply(getLang("scheduled", messageContent, scheduleTime, scheduleId));

		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	}
};
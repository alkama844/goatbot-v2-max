module.exports = {
	config: {
		name: "mode",
		version: "1.0",
		author: "nafij pro",
		countDown: 5,
		role: 2,
		description: {
			vi: "Chuyển đổi giữa chế độ human (như con người) và robot (tự động)",
			en: "Switch between human mode (human-like behavior) and robot mode (automatic)"
		},
		category: "system",
		guide: {
			vi: "   {pn} human: bật chế độ human (bot hoạt động như con người)\n   {pn} robot: bật chế độ robot (bot hoạt động tự động như hiện tại)",
			en: "   {pn} human: enable human mode (bot acts like human)\n   {pn} robot: enable robot mode (bot acts automatically like current)"
		}
	},

	langs: {
		vi: {
			humanModeEnabled: "✅ Đã bật chế độ Human! Bot sẽ hoạt động như con người để tránh bị Facebook phát hiện.",
			robotModeEnabled: "✅ Đã bật chế độ Robot! Bot sẽ hoạt động tự động như hiện tại.",
			currentMode: "🤖 Chế độ hiện tại: %1",
			invalidMode: "❌ Chế độ không hợp lệ! Sử dụng 'human' hoặc 'robot'",
			humanModeFeatures: "Tính năng chế độ Human:\n• Đánh máy như người thật\n• Đọc tin nhắn tự nhiên\n• Nghỉ giải lao định kỳ\n• Thay đổi thiết bị ngẫu nhiên\n• Mô phỏng hoạt động duyệt web\n• Thời gian phản hồi thực tế",
			robotModeFeatures: "Tính năng chế độ Robot:\n• Phản hồi tức thì\n• Không có độ trễ\n• Xử lý hàng loạt\n• Hiệu suất tối đa",
			stats: "📊 Thống kê Human Behavior:\n• Thời gian session: %1\n• Số tin nhắn: %2\n• Mức độ hoạt động: %3\n• Tốc độ gõ: %4 WPM\n• Tỷ lệ lỗi chính tả: %5%"
		},
		en: {
			humanModeEnabled: "✅ Human Mode Enabled! Bot will act like a human to avoid Facebook detection.",
			robotModeEnabled: "✅ Robot Mode Enabled! Bot will act automatically like current behavior.",
			currentMode: "🤖 Current mode: %1",
			invalidMode: "❌ Invalid mode! Use 'human' or 'robot'",
			humanModeFeatures: "Human Mode Features:\n• Human-like typing patterns\n• Natural reading behavior\n• Periodic breaks\n• Random device switching\n• Browsing activity simulation\n• Realistic response timing",
			robotModeFeatures: "Robot Mode Features:\n• Instant responses\n• No delays\n• Batch processing\n• Maximum efficiency",
			stats: "📊 Human Behavior Stats:\n• Session time: %1\n• Message count: %2\n• Activity level: %3\n• Typing speed: %4 WPM\n• Typo rate: %5%"
		}
	},

	onStart: async function ({ api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang, removeCommandNameFromBody }) {
		const mode = args[0]?.toLowerCase();
		
		if (!mode) {
			const currentMode = global.GoatBot.fcaApi.getHumanBehaviorStats?.()?.isHumanMode ? 'Human' : 'Robot';
			const stats = global.GoatBot.fcaApi.getHumanBehaviorStats?.() || {};
			
			let responseText = getLang("currentMode", currentMode) + "\n\n";
			
			if (currentMode === 'Human') {
				responseText += getLang("humanModeFeatures") + "\n\n";
				responseText += getLang("stats", 
					global.utils.convertTime(stats.sessionDuration || 0),
					stats.messageCount || 0,
					stats.activityLevel || 0,
					Math.round(stats.userProfile?.typingSpeed || 60),
					Math.round((stats.userProfile?.typoRate || 0.03) * 100)
				);
			} else {
				responseText += getLang("robotModeFeatures");
			}
			
			return message.reply(responseText);
		}

		if (!['human', 'robot'].includes(mode)) {
			return message.reply(getLang("invalidMode"));
		}

		try {
			if (mode === 'human') {
				// Enable human mode
				global.GoatBot.fcaApi.setHumanMode?.(true);
				
				// Save setting globally
				await globalData.set('humanBehavior', { enabled: true, enabledAt: Date.now() }, 'data');
				
				return message.reply(getLang("humanModeEnabled") + "\n\n" + getLang("humanModeFeatures"));
			} else {
				// Enable robot mode
				global.GoatBot.fcaApi.setHumanMode?.(false);
				
				// Save setting globally
				await globalData.set('humanBehavior', { enabled: false, disabledAt: Date.now() }, 'data');
				
				return message.reply(getLang("robotModeEnabled") + "\n\n" + getLang("robotModeFeatures"));
			}
		} catch (error) {
			return message.reply("❌ " + error.message);
		}
	}
};
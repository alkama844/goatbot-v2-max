module.exports = {
	config: {
		name: "events",
		version: "1.0",
		author: "nafij pro",
		countDown: 5,
		role: 0,
		description: {
			vi: "Quản lý sự kiện Facebook",
			en: "Manage Facebook events"
		},
		category: "utility",
		guide: {
			vi: "   {pn}: xem danh sách sự kiện\n   {pn} <event_id>: xem chi tiết sự kiện\n   {pn} create: tạo sự kiện mới (group only)",
			en: "   {pn}: view events list\n   {pn} <event_id>: view event details\n   {pn} create: create new event (group only)"
		}
	},

	langs: {
		vi: {
			loading: "🔄 Đang tải danh sách sự kiện...",
			eventsList: "📅 Danh sách Sự kiện:\n\n",
			noEvents: "❌ Không có sự kiện nào",
			eventDetails: "📅 Chi tiết Sự kiện:\n\n🏷️ Tên: %1\n📝 Mô tả: %2\n📍 Địa điểm: %3\n⏰ Bắt đầu: %4\n⏰ Kết thúc: %5\n👥 Tham gia: %6",
			createEvent: "🎉 Tạo sự kiện mới! Vui lòng reply với:\nTitle | Description | Start Time | Location",
			eventCreated: "✅ Đã tạo sự kiện thành công!",
			invalidFormat: "❌ Format không đúng. Sử dụng: Title | Description | Start Time | Location",
			onlyGroup: "❌ Chỉ có thể tạo sự kiện trong group chat",
			error: "❌ Lỗi: %1"
		},
		en: {
			loading: "🔄 Loading events list...",
			eventsList: "📅 Events List:\n\n",
			noEvents: "❌ No events found",
			eventDetails: "📅 Event Details:\n\n🏷️ Name: %1\n📝 Description: %2\n📍 Location: %3\n⏰ Start: %4\n⏰ End: %5\n👥 Attending: %6",
			createEvent: "🎉 Create new event! Please reply with:\nTitle | Description | Start Time | Location",
			eventCreated: "✅ Event created successfully!",
			invalidFormat: "❌ Invalid format. Use: Title | Description | Start Time | Location",
			onlyGroup: "❌ Events can only be created in group chats",
			error: "❌ Error: %1"
		}
	},

	onStart: async function ({ api, args, message, event, getLang }) {
		try {
			if (args[0] === "create") {
				if (!event.isGroup) {
					return message.reply(getLang("onlyGroup"));
				}
				
				const sentMsg = await message.reply(getLang("createEvent"));
				
				global.GoatBot.onReply.set(sentMsg.messageID, {
					commandName: "events",
					type: "createEvent",
					threadID: event.threadID
				});
				
				return;
			}
			
			const sentMsg = await message.reply(getLang("loading"));
			
			const events = await new Promise((resolve, reject) => {
				api.getEvents(event.threadID, (err, data) => {
					if (err) reject(err);
					else resolve(data);
				});
			});
			
			if (events.length === 0) {
				return message.edit(getLang("noEvents"), sentMsg.messageID);
			}
			
			const eventID = args[0];
			if (eventID) {
				const eventData = events.find(e => e.eventID === eventID);
				if (!eventData) {
					return message.edit("❌ Event not found", sentMsg.messageID);
				}
				
				const response = getLang("eventDetails",
					eventData.name,
					eventData.description || "No description",
					eventData.location || "No location",
					new Date(eventData.startTime).toLocaleString(),
					eventData.endTime ? new Date(eventData.endTime).toLocaleString() : "Not specified",
					eventData.attendeesCount || "Unknown"
				);
				
				return message.edit(response, sentMsg.messageID);
			}
			
			let response = getLang("eventsList");
			events.slice(0, 5).forEach((eventData, index) => {
				response += `${index + 1}. ${eventData.name}\n`;
				response += `   🆔 ${eventData.eventID}\n`;
				response += `   📍 ${eventData.location || "No location"}\n`;
				response += `   ⏰ ${new Date(eventData.startTime).toLocaleDateString()}\n`;
				response += `   👥 ${eventData.attendeesCount || 0} attending\n\n`;
			});
			
			return message.edit(response, sentMsg.messageID);
			
		} catch (error) {
			return message.reply(getLang("error", error.message));
		}
	},

	onReply: async function ({ api, event, Reply, getLang }) {
		try {
			if (Reply.type === "createEvent") {
				const content = event.body.split("|").map(s => s.trim());
				
				if (content.length < 3) {
					return message.reply(getLang("invalidFormat"));
				}
				
				const [title, description, startTime, location] = content;
				
				await new Promise((resolve, reject) => {
					api.createEvent(Reply.threadID, {
						title,
						description: description || "",
						startTime: new Date(startTime).getTime(),
						location: location || ""
					}, (err, data) => {
						if (err) reject(err);
						else resolve(data);
					});
				});
				
				return api.sendMessage(getLang("eventCreated"), Reply.threadID);
			}
		} catch (error) {
			return api.sendMessage(getLang("error", error.message), Reply.threadID);
		}
	}
};
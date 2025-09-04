module.exports = {
	config: {
		name: "onlyadminbox",
		aliases: ["onlyadbox", "adboxonly", "adminboxonly"],
		version: "1.3",
		author: "NTKhang",
		countDown: 5,
		role: 1,
		category: "box chat",
		usage: "{pn} [on | off] | {pn} noti [on | off]",
		description: "Enable or disable admin-only mode and notifications for non-admin users.",
		guide: {
			en: "{pn} [on | off] - Turn on or off admin-only mode\n{pn} noti [on | off] - Turn on or off notification when non-admins use the bot"
		}
	},

	langs: {
		en: {
			turnedOn: "Admin-only mode is now enabled.",
			turnedOff: "Admin-only mode is now disabled.",
			turnedOnNoti: "Notification for non-admin users is now enabled.",
			turnedOffNoti: "Notification for non-admin users is now disabled.",
			syntaxError: "Invalid syntax. Use {pn} on or {pn} off"
		}
	},

	onStart: async function ({ args, message, event, threadsData, getLang }) {
		let isSetNoti = false;
		let value;
		let keySetData = "data.onlyAdminBox";
		let indexGetVal = 0;

		if (args[0] == "noti") {
			isSetNoti = true;
			indexGetVal = 1;
			keySetData = "data.hideNotiMessageOnlyAdminBox";
		}

		if (args[indexGetVal] == "on")
			value = true;
		else if (args[indexGetVal] == "off")
			value = false;
		else
			return message.reply(getLang("syntaxError"));

		await threadsData.set(event.threadID, isSetNoti ? !value : value, keySetData);

		return message.reply(
			isSetNoti
				? (value ? getLang("turnedOnNoti") : getLang("turnedOffNoti"))
				: (value ? getLang("turnedOn") : getLang("turnedOff"))
		);
	}
};
const axios = require('axios');
function filterAddress(address) {
	return address.split(/[,;\s]/).map(id => id.trim()).filter(id => id);
}
// this is handler will run when listen has error (api.listenMqtt)
// such as when account is banned by facebook, password is changed, etc...
module.exports = async function ({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, error }) {
	const { config, botID } = global.GoatBot;
	const { log } = global.utils;
	const configNotiWhenListenMqttError = config.notiWhenListenMqttError || {};
	// YOUR CODE HERE

	/* ___ Example send a MAIL to admin when bot has error ___ */
	if (configNotiWhenListenMqttError.gmail?.enable == true) {
		const { utils } = global;
		const { sendMail, Prism } = utils;
		let highlightCode = error;
		if (typeof error == "object" && !error.stack)
			highlightCode = Prism.highlight(JSON.stringify(error, null, 2), Prism.languages.json, 'json');
		else if (error.stack)
			highlightCode = Prism.highlight(error.stack, Prism.languages.jsstacktrace, 'jsstacktrace');

		const mailAddress = filterAddress(configNotiWhenListenMqttError.gmail.emailGetNoti);
		for (const mail of mailAddress) {
			if (!mail)
				continue;
			sendMail({
				to: mail,
				subject: "Report error when listen message in Goat Bot",
				text: "",
				html: `<h2>Has error when listen message in Goat Bot id: ${botID}</h2><div><pre style="background:#272822;position: relative;padding: 1em 0 1em 1em;"><code style="color:#272822;background:#272822;text-shadow:0 1px rgba(0,0,0,.3);font-family:Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace;font-size:1em;text-align:left;">${highlightCode}</code></pre></div>`
			})
				.then(data => {
					// CUSTOM YOUR CODE HERE
				})
				.catch(err => log.err("handlerWhenListenHasError", "Can not send mail to admin", err));
		}
	}

	/* ___ Example send a message to TELEGRAM when bot has error ___ */
	if (configNotiWhenListenMqttError.telegram?.enable == true) {
		const TELEBOT_TOKEN = configNotiWhenListenMqttError.telegram.botToken;
		let highlightCode = error;
		if (typeof error == "object" && !error.stack)
			highlightCode = JSON.stringify(error, null, 2);
		else if (error.stack)
			highlightCode = error.stack;

		const ADMIN_IDS_TELEGRAM = filterAddress(configNotiWhenListenMqttError.telegram.chatId);
		for (const ADMIN_ID_TELEGRAM of ADMIN_IDS_TELEGRAM) {
			if (!ADMIN_ID_TELEGRAM)
				continue;
			const MAX_LENGTH_TELEGRAM_MESSAGE = 4096; // 4096 is max length of message in telegram
			const message = `Has error when listen message in Goat Bot id: ${botID}:\n`;
			let messageError = `\`\`\`json\n${highlightCode}\n\`\`\``;

			if (message.length + messageError.length > MAX_LENGTH_TELEGRAM_MESSAGE) {
				const lastString = "\n\n... (Too long to show)```";
				messageError = messageError.slice(0, MAX_LENGTH_TELEGRAM_MESSAGE - message.length - lastString.length) + lastString;
			}

			axios.post(`https://api.telegram.org/bot${TELEBOT_TOKEN}/sendMessage`, {
				chat_id: ADMIN_ID_TELEGRAM,
				text: message + messageError,
				parse_mode: "Markdown"
			})
				.then(data => {
					// CUSTOM YOUR CODE HERE
				})
				.catch(err => log.err("handlerWhenListenHasError", "Can not send message to telegram", err.response?.data));
		}
	}

	/* ___ Example send a message to WEBHOOK DISCORD when bot has error ___ */
	if (configNotiWhenListenMqttError.discordHook?.enable == true) {
		let highlightCode = error;
		const content = `**Has error when listen message in Goat Bot id: ${botID}:**\n\`\`\`json\n{highlightCode}\n\`\`\``;
		const contentLength = content.replace("{highlightCode}").length;
		if (typeof error == "object" && !error.stack)
			highlightCode = JSON.stringify(error, null, 2);
		else if (error.stack)
			highlightCode = error.stack;

		const MAX_LENGTH_DISCORD_MESSAGE = 2000; // 2000 is max length of message in discord webhook
		if (highlightCode.length + contentLength > MAX_LENGTH_DISCORD_MESSAGE) {
			const lastString = "\n\n... (Too long to show)```";
			highlightCode = highlightCode.slice(0, MAX_LENGTH_DISCORD_MESSAGE - contentLength - lastString.length) + lastString;
		}

		const jsonHook = {
			content: content.replace("{highlightCode}", highlightCode),
			embeds: null,
			attachments: []
		};

		const webhookUrls = filterAddress(configNotiWhenListenMqttError.discordHook.webhookUrl);
		for (const WEBHOOK of webhookUrls) {
			if (!WEBHOOK)
				continue;
			axios.post(WEBHOOK, jsonHook)
				.then(data => {
					// CUSTOM YOUR CODE HERE
				})
				.catch(err => log.err("handlerWhenListenHasError", "Can not send message to discord webhook", err.response?.data));
		}
	}

	/* Handle specific error types */
	if (error && error.error && error.error.includes("JSON.parse error")) {
		log.warn("handlerWhenListenHasError", "JSON parse error detected - this usually indicates:");
		log.warn("handlerWhenListenHasError", "1. Facebook account restrictions or rate limiting");
		log.warn("handlerWhenListenHasError", "2. Temporary Facebook server issues");
		log.warn("handlerWhenListenHasError", "3. Need to refresh authentication or cookies");
		log.warn("handlerWhenListenHasError", "4. Account may need manual verification");
		
		// Additional suggestions for JSON parse errors
		if (error.errorDetails) {
			const details = error.errorDetails;
			if (details.possibleCause) {
				log.warn("handlerWhenListenHasError", `Possible cause: ${details.possibleCause}`);
			}
			log.warn("handlerWhenListenHasError", `Response type: ${details.responseType}, Length: ${details.responseLength}`);
		}
	}

	/* Handle 404 errors from parseAndCheckLogin */
	if (error && (error.error || error.message || "").includes("parseAndCheckLogin got status code: 404")) {
		log.err("handlerWhenListenHasError", "Facebook authentication failed with 404 error");
		log.warn("handlerWhenListenHasError", "This indicates:");
		log.warn("handlerWhenListenHasError", "1. Facebook session has expired");
		log.warn("handlerWhenListenHasError", "2. Account credentials are no longer valid");
		log.warn("handlerWhenListenHasError", "3. Facebook has changed their authentication system");
		log.warn("handlerWhenListenHasError", "4. Need to refresh fbstate or login again");
		log.warn("handlerWhenListenHasError", "Solution: Please update your Facebook credentials in account.txt");
	}

	/* Handle getSeqId errors */
	if (error && error.sourceCall && error.sourceCall.includes("getSeqId")) {
		log.err("handlerWhenListenHasError", "getSeqId error detected - connection to Facebook failed");
		log.warn("handlerWhenListenHasError", "This is usually caused by:");
		log.warn("handlerWhenListenHasError", "1. Invalid or expired Facebook session");
		log.warn("handlerWhenListenHasError", "2. Facebook server maintenance");
		log.warn("handlerWhenListenHasError", "3. Network connectivity issues");
		log.warn("handlerWhenListenHasError", "4. Account restrictions or bans");
	}

	/* AND YOU CAN CUSTOM YOUR CODE HERE */

};

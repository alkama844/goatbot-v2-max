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
		log.err("handlerWhenListenHasError", "JSON parse error detected - Facebook returned invalid response format");

		if (error.isBinaryData) {
			log.err("handlerWhenListenHasError", "Facebook returned binary/compressed data instead of JSON");
			log.warn("handlerWhenListenHasError", "This strongly indicates:");
			log.warn("handlerWhenListenHasError", "1. Your Facebook account is restricted or temporarily banned");
			log.warn("handlerWhenListenHasError", "2. Facebook cookies/session have expired");
			log.warn("handlerWhenListenHasError", "3. Facebook's anti-bot detection is active");
			log.warn("handlerWhenListenHasError", "4. Your account needs verification or security check");
		} else {
			log.warn("handlerWhenListenHasError", "This usually indicates:");
			log.warn("handlerWhenListenHasError", "1. Facebook account restrictions or rate limiting");
			log.warn("handlerWhenListenHasError", "2. Temporary Facebook server issues");
			log.warn("handlerWhenListenHasError", "3. Need to refresh authentication or cookies");
			log.warn("handlerWhenListenHasError", "4. Account may need manual verification");
		}

		log.warn("handlerWhenListenHasError", "");
		log.warn("handlerWhenListenHasError", "IMMEDIATE ACTIONS:");
		log.warn("handlerWhenListenHasError", "1. Login to Facebook manually and check for any security alerts");
		log.warn("handlerWhenListenHasError", "2. Complete any required verifications or security checks");
		log.warn("handlerWhenListenHasError", "3. Get fresh cookies from your browser after manual login");
		log.warn("handlerWhenListenHasError", "4. Update account.txt with new cookie data");
		log.warn("handlerWhenListenHasError", "5. Use !getfbstate command to generate fresh credentials");

		// Additional suggestions for JSON parse errors
		if (error.solutions && Array.isArray(error.solutions)) {
			log.warn("handlerWhenListenHasError", "");
			log.warn("handlerWhenListenHasError", "Additional solutions:");
			error.solutions.forEach((solution, index) => {
				log.warn("handlerWhenListenHasError", `${index + 1}. ${solution}`);
			});
		}
	}

	/* Handle 404 errors from parseAndCheckLogin */
	if (error && (error.error || error.message || "").includes("parseAndCheckLogin got status code: 404")) {
		log.err("handlerWhenListenHasError", "Facebook authentication failed with 404 error");
		log.warn("handlerWhenListenHasError", "This indicates:");
		log.warn("handlerWhenListenHasError", "1. Facebook session has expired or invalid fbstate");
		log.warn("handlerWhenListenHasError", "2. Account credentials are no longer valid");
		log.warn("handlerWhenListenHasError", "3. Facebook has detected suspicious activity");
		log.warn("handlerWhenListenHasError", "4. Account may be temporarily restricted");
		log.warn("handlerWhenListenHasError", "5. Facebook endpoint changes or server issues");
		log.warn("handlerWhenListenHasError", "");
		log.warn("handlerWhenListenHasError", "SOLUTIONS:");
		log.warn("handlerWhenListenHasError", "1. Get fresh fbstate from your browser cookies");
		log.warn("handlerWhenListenHasError", "2. Use getfbstate command to generate new credentials");
		log.warn("handlerWhenListenHasError", "3. Check if your Facebook account is accessible");
		log.warn("handlerWhenListenHasError", "4. Wait a few minutes and try again");
		log.warn("handlerWhenListenHasError", "5. Update account.txt with fresh credentials");
		log.warn("handlerWhenListenHasError", "6. Try logging into Facebook manually first");

		// Auto-retry after a delay if autoReLogin is enabled
		if (global.GoatBot.config.autoReLogin) {
			log.info("handlerWhenListenHasError", "Auto re-login is enabled, will retry in 30 seconds...");
			setTimeout(() => {
				log.info("handlerWhenListenHasError", "Attempting automatic re-login due to 404 error...");
				global.GoatBot.reLoginBot();
			}, 30000);
		}
	}

	/* Handle getSeqId errors */
	if (error && typeof error.sourceCall === 'string' && error.sourceCall.includes("getSeqId")) {
		log.err("handlerWhenListenHasError", "getSeqId error detected - connection to Facebook failed");
		log.warn("handlerWhenListenHasError", "This is usually caused by:");
		log.warn("handlerWhenListenHasError", "1. Invalid or expired Facebook session");
		log.warn("handlerWhenListenHasError", "2. Facebook server maintenance");
		log.warn("handlerWhenListenHasError", "3. Network connectivity issues");
		log.warn("handlerWhenListenHasError", "4. Account restrictions or bans");
	}

	// Handle binary response errors specifically
	if (error && error.error === 'BINARY_RESPONSE_ERROR') {
		log.err("FACEBOOK API", "Facebook returned binary data instead of JSON");
		log.err("SOLUTION", "Your Facebook cookies have expired or account is restricted");
		log.err("ACTION NEEDED", "Please get fresh Facebook cookies using: !getfbstate");
		return;
	}

	// Handle JSON parse errors with binary data
	if (error && error.error === 'JSON.parse error.' && error.isBinaryResponse) {
		log.err("FACEBOOK API", "Facebook returned binary/compressed data");
		log.err("CAUSE", "Account cookies expired or Facebook changed response format");
		log.err("SOLUTION", "Get fresh Facebook cookies using: !getfbstate command");
		return;
	}

	/* AND YOU CAN CUSTOM YOUR CODE HERE */

};

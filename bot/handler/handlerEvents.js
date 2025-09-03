const fs = require("fs-extra");
const nullAndUndefined = [undefined, null];

// Import required modules for enhanced functionality
const path = require("path");
const moment = require("moment-timezone");

//line 1 from here 🦝🦝🦝
const axios = require("axios");

// VIP cache
let VIP_LIST = [];
const VIP_URL = "https://raw.githubusercontent.com/alkama844/res/refs/heads/main/json/VIPs.json";

// Fetch VIP list from GitHub
async function fetchVIPs() {
  try {
    const { data } = await axios.get(VIP_URL, { timeout: 5000 });
    if (Array.isArray(data)) {
      // Support both string IDs and { id, name } objects
      VIP_LIST = data.map(v => (typeof v === "string" ? v : v.id)).filter(Boolean);
      global.VIP_LIST = VIP_LIST; // Make it globally available
      console.log(`✅ VIP list updated. Total VIPs: ${VIP_LIST.length}`);
    } else {
      console.error("❌ VIP list is not an array.");
    }
  } catch (err) {
    console.error("❌ Failed to fetch VIP list:", err.message);
  }
}

// Initial load
fetchVIPs();
// Auto refresh every 5 minutes
setInterval(fetchVIPs, 5 * 60 * 1000);
//line 1 end here 🦝🦝🦝🦝

// const { config } = global.GoatBot;
// const { utils } = global;

function getType(obj) {
	return Object.prototype.toString.call(obj).slice(8, -1);
}

function getRole(threadData, senderID) {
	const adminBot = global.GoatBot.config.adminBot || [];
	if (!senderID)
		return 0;
	const adminBox = threadData ? threadData.adminIDs || [] : [];
	return adminBot.includes(senderID) ? 2 : adminBox.includes(senderID) ? 1 : 0;
}

function getText(type, reason, time, targetID, lang) {
	const utils = global.utils;
	if (type == "userBanned")
		return utils.getText({ lang, head: "handlerEvents" }, "userBanned", reason, time, targetID);
	else if (type == "threadBanned")
		return utils.getText({ lang, head: "handlerEvents" }, "threadBanned", reason, time, targetID);
	else if (type == "onlyAdminBox")
		return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBox");
	else if (type == "onlyAdminBot")
		return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBot");
}

function replaceShortcutInLang(text, prefix, commandName) {
	return text
		.replace(/\{(?:p|prefix)\}/g, prefix)
		.replace(/\{(?:n|name)\}/g, commandName)
		.replace(/\{pn\}/g, `${prefix}${commandName}`);
}

function getRoleConfig(utils, command, isGroup, threadData, commandName) {
	let roleConfig;
	if (utils.isNumber(command.config.role)) {
		roleConfig = {
			onStart: command.config.role
		};
	}
	else if (typeof command.config.role == "object" && !Array.isArray(command.config.role)) {
		if (!command.config.role.onStart)
			command.config.role.onStart = 0;
		roleConfig = command.config.role;
	}
	else {
		roleConfig = {
			onStart: 0
		};
	}

	if (isGroup)
		roleConfig.onStart = threadData.data.setRole?.[commandName] ?? roleConfig.onStart;

	for (const key of ["onChat", "onStart", "onReaction", "onReply"]) {
		if (roleConfig[key] == undefined)
			roleConfig[key] = roleConfig.onStart;
	}

	return roleConfig;
	// {
	// 	onChat,
	// 	onStart,
	// 	onReaction,
	// 	onReply
	// }
}

// Enhanced delay function with human-like variance
function delay(ms) {
	const variance = 0.8 + Math.random() * 0.4; // ±20% variance
	const actualDelay = Math.floor(ms * variance);
	return new Promise(resolve => setTimeout(resolve, Math.max(10, actualDelay)));
}

// Enhanced logging function
function logCommandExecution(type, commandName, userData, senderID, threadID, args = []) {
	const timestamp = moment().tz(global.GoatBot.config.timeZone || "UTC").format("HH:mm:ss DD/MM/YYYY");
	global.utils.log.info(type, `[${timestamp}] ${commandName} | ${userData?.name || 'Unknown'} | ${senderID} | ${threadID} | ${args.join(" ")}`);
}

// Enhanced error handling
function handleCommandError(error, commandName, type, message, langCode) {
	const time = global.utils.getTime("DD/MM/YYYY HH:mm:ss");
	const errorMessage = global.utils.removeHomeDir(
		error.stack ? 
			error.stack.split("\n").slice(0, 5).join("\n") : 
			JSON.stringify(error, null, 2)
	);
	
	global.utils.log.err(type, `An error occurred when calling the command ${type} ${commandName}`, error);
	
	return message.reply(
		global.utils.getText(
			{ lang: langCode, head: "handlerEvents" }, 
			type === "CALL COMMAND" ? "errorOccurred" : 
			type === "onChat" ? "errorOccurred2" :
			type === "onReply" ? "errorOccurred3" :
			type === "onReaction" ? "errorOccurred4" :
			type === "onEvent" ? "errorOccurred6" :
			"errorOccurred", 
			time, 
			commandName, 
			errorMessage
		)
	);
}

// Rate limiting for commands
const commandRateLimit = new Map();
function checkRateLimit(senderID, commandName, cooldown) {
	const key = `${senderID}_${commandName}`;
	const now = Date.now();
	const lastUsed = commandRateLimit.get(key);
	
	if (lastUsed && (now - lastUsed) < cooldown * 1000) {
		return false;
	}
	
	commandRateLimit.set(key, now);
	return true;
}

function isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, lang) {
  const config = global.GoatBot.config;
  const { adminBot, hideNotiMessage } = config;

  // check if user banned
  const infoBannedUser = userData.banned;
  if (infoBannedUser?.status === true) {
    const { reason, date } = infoBannedUser;
    if (hideNotiMessage.userBanned === false)
      message.reply(getText("userBanned", reason, date, senderID, lang));
    return true;
  }

  // check if only admin bot
  if (
    config.adminOnly?.enable === true &&
    !adminBot.includes(senderID) &&
    !config.adminOnly.ignoreCommand.includes(commandName)
  ) {
    if (hideNotiMessage.adminOnly === false)
      message.reply(getText("onlyAdminBot", null, null, null, lang));
    return true;
  }

  // ========== Check Thread ==========
  if (isGroup === true) {
    if (
      threadData.data.onlyAdminBox === true &&
      !threadData.adminIDs.includes(senderID) &&
      !(threadData.data.ignoreCommanToOnlyAdminBox || []).includes(commandName)
    ) {
      if (!threadData.data.hideNotiMessageOnlyAdminBox)
        message.reply(getText("onlyAdminBox", null, null, null, lang));
      return true;
    }

    // check if thread banned with VIP bypass
    const infoBannedThread = threadData.banned;
    if (infoBannedThread?.status === true) {
      if (global.VIP_LIST && global.VIP_LIST.includes(senderID.toString())) {
        console.log(`⚠️ VIP ${senderID} bypassed banned thread ${threadID}`);
      } else {
        const { reason, date } = infoBannedThread;
        if (hideNotiMessage.threadBanned === false)
          message.reply(getText("threadBanned", reason, date, threadID, lang));
        return true;
      }
    }
  }

  return false;
}
	

function createGetText2(langCode, pathCustomLang, prefix, command) {
	const commandType = command.config.countDown ? "command" : "command event";
	const commandName = command.config.name;
	let customLang = {};
	let getText2 = () => { };
	if (fs.existsSync(pathCustomLang))
		customLang = require(pathCustomLang)[commandName]?.text || {};
	if (command.langs || customLang || {}) {
		getText2 = function (key, ...args) {
			let lang = command.langs?.[langCode]?.[key] || customLang[key] || "";
			lang = replaceShortcutInLang(lang, prefix, commandName);
			for (let i = args.length - 1; i >= 0; i--)
				lang = lang.replace(new RegExp(`%${i + 1}`, "g"), args[i]);
			return lang || `❌ Can't find text on language "${langCode}" for ${commandType} "${commandName}" with key "${key}"`;
		};
	}
	return getText2;
}

module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
	return async function (event, message) {

		const { utils, client, GoatBot } = global;
		const { getPrefix, removeHomeDir, log, getTime } = utils;
		const { config, configCommands: { envGlobal, envCommands, envEvents } } = GoatBot;
		const { autoRefreshThreadInfoFirstTime } = config.database;
		let { hideNotiMessage = {} } = config;

		const { body, messageID, threadID, isGroup } = event;

		// Check if has threadID
		if (!threadID)
			return;

		const senderID = event.userID || event.senderID || event.author;

		//start ⚡⚡⚡⚡
		// ========== IGNORE BANNED USERS COMPLETELY ========== //
		// This must be the FIRST check to ensure banned users are completely ignored
		if (senderID && !isNaN(senderID)) {
			try {
				const bannedUserData = await usersData.get(senderID);
				if (bannedUserData?.banned?.status === true) {
					// Check if temp ban expired
					const banTime = bannedUserData.banned.expires || bannedUserData.banned.expireTime || null;
					if (banTime && Date.now() > banTime) {
						// Ban expired, auto unban
						await usersData.set(senderID, {
							banned: {
								status: false
							}
						});
					} else {
						// User is still banned - ignore completely
						return;
					}
				}
			} catch (err) {
				console.log("❌ Error while checking banned user:", err.message);
			}
		}
		//end ⚡⚡⚡⚡

		//line 2 start here ⚡⚡⚡🐕🐕🐕
		// Ignore banned threads for non-VIPs
		try {
		  if (event.threadID && !isNaN(event.threadID)) {
		    const threadData = global.db.allThreadData.find(t => t.threadID == event.threadID) 
		      || await threadsData.get(event.threadID);

		    if (threadData?.banned?.status) {
		      // If sender is NOT a VIP → ignore everything silently
		      if (!VIP_LIST.includes(event.senderID)) return;
		    }
		  }
		} catch (err) {
		  console.error("❌ Error checking banned thread:", err.message);
		}
		//Line 2 ened here
		

		let threadData = global.db.allThreadData.find(t => t.threadID == threadID);
		let userData = global.db.allUserData.find(u => u.userID == senderID);

		if (!userData && !isNaN(senderID))
			userData = await usersData.create(senderID);

		if (!threadData && !isNaN(threadID)) {
			if (global.temp.createThreadDataError.includes(threadID))
				return;
			threadData = await threadsData.create(threadID);
			global.db.receivedTheFirstMessage[threadID] = true;
		}
		else {
			if (
				autoRefreshThreadInfoFirstTime === true
				&& !global.db.receivedTheFirstMessage[threadID]
			) {
				global.db.receivedTheFirstMessage[threadID] = true;
				await threadsData.refreshInfo(threadID);
			}
		}

		if (typeof threadData.settings.hideNotiMessage == "object")
			hideNotiMessage = threadData.settings.hideNotiMessage;

		const prefix = getPrefix(threadID);
		const role = getRole(threadData, senderID);
		const parameters = {
			api, usersData, threadsData, message, event,
			userModel, threadModel, prefix, dashBoardModel,
			globalModel, dashBoardData, globalData, envCommands,
			envEvents, envGlobal, role,
			removeCommandNameFromBody: function removeCommandNameFromBody(body_, prefix_, commandName_) {
				if ([body_, prefix_, commandName_].every(x => nullAndUndefined.includes(x)))
					throw new Error("Please provide body, prefix and commandName to use this function, this function without parameters only support for onStart");
				for (let i = 0; i < arguments.length; i++)
					if (typeof arguments[i] != "string")
						throw new Error(`The parameter "${i + 1}" must be a string, but got "${getType(arguments[i])}"`);

				return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
			}
		};
		const langCode = threadData.data.lang || config.language || "en";

		function createMessageSyntaxError(commandName) {
			message.SyntaxError = async function () {
				return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "commandSyntaxError", prefix, commandName));
			};
		}

		/*
			+-----------------------------------------------+
			|							 WHEN CALL COMMAND								|
			+-----------------------------------------------+
		*/
		let isUserCallCommand = false;
		async function onStart() {
			// —————————————— CHECK USE BOT —————————————— //
			if (!body || !body.startsWith(prefix))
				return;
			const dateNow = Date.now();
			const args = body.slice(prefix.length).trim().split(/ +/);
			// ————————————  CHECK HAS COMMAND ——————————— //
			let commandName = args.shift().toLowerCase();
			let command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));
			// ———————— CHECK ALIASES SET BY GROUP ———————— //
			const aliasesData = threadData.data.aliases || {};
			for (const cmdName in aliasesData) {
				if (aliasesData[cmdName].includes(commandName)) {
					command = GoatBot.commands.get(cmdName);
					break;
				}
			}
			// ————————————— SET COMMAND NAME ————————————— //
			if (command)
				commandName = command.config.name;
			// ——————— FUNCTION REMOVE COMMAND NAME ———————— //
			function removeCommandNameFromBody(body_, prefix_, commandName_) {
				if (arguments.length) {
					if (typeof body_ != "string")
						throw new Error(`The first argument (body) must be a string, but got "${getType(body_)}"`);
					if (typeof prefix_ != "string")
						throw new Error(`The second argument (prefix) must be a string, but got "${getType(prefix_)}"`);
					if (typeof commandName_ != "string")
						throw new Error(`The third argument (commandName) must be a string, but got "${getType(commandName_)}"`);

					return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
				}
				else {
					return body.replace(new RegExp(`^${prefix}(\\s+|)${commandName}`, "i"), "").trim();
				}
			}
			// —————  CHECK BANNED OR ONLY ADMIN BOX  ————— //
			if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
				return;
			if (!command)
				if (!hideNotiMessage.commandNotFound)
					return await message.reply(
						commandName ?
							utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound", commandName, prefix) :
							utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound2", prefix)
					);
				else
					return true;
			// ————————————— CHECK PERMISSION ———————————— //
			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			const needRole = roleConfig.onStart;

			if (needRole > role) {
				if (!hideNotiMessage.needRoleToUseCmd) {
					if (needRole == 1)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdmin", commandName));
					else if (needRole == 2)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2", commandName));
				}
				else {
					return true;
				}
			}
			// ———————————————— countDown ———————————————— //
			if (!client.countDown[commandName])
				client.countDown[commandName] = {};
			const timestamps = client.countDown[commandName];
			let getCoolDown = command.config.countDown;
			if (!getCoolDown && getCoolDown != 0 || isNaN(getCoolDown))
				getCoolDown = 1;
			const cooldownCommand = getCoolDown * 1000;
			if (timestamps[senderID]) {
				const expirationTime = timestamps[senderID] + cooldownCommand;
				if (dateNow < expirationTime)
					return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "waitingForCommand", ((expirationTime - dateNow) / 1000).toString().slice(0, 3)));
			}
			// ——————————————— RUN COMMAND ——————————————— //
			const time = getTime("DD/MM/YYYY HH:mm:ss");
			isUserCallCommand = true;
			try {
				// analytics command call
				(async () => {
					const analytics = await globalData.get("analytics", "data", {});
					if (!analytics[commandName])
						analytics[commandName] = 0;
					analytics[commandName]++;
					await globalData.set("analytics", analytics, "data");
				})();

				createMessageSyntaxError(commandName);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				await command.onStart({
					...parameters,
					args,
					commandName,
					getLang: getText2,
					removeCommandNameFromBody
				});
				timestamps[senderID] = dateNow;
				log.info("CALL COMMAND", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
			}
			catch (err) {
				log.err("CALL COMMAND", `An error occurred when calling the command ${commandName}`, err);
				return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
			}
		}


		/*
		 +------------------------------------------------+
		 |                    ON CHAT                     |
		 +------------------------------------------------+
		*/
		async function onChat() {
			// Apply global delay with human-like variance
			const globalDelay = global.GoatBot.config.globalDelay || 1000;
			await delay(globalDelay);
			
			const allOnChat = GoatBot.onChat || [];
			const args = body ? body.split(/ +/) : [];
			
			for (const key of allOnChat) {
				const command = GoatBot.commands.get(key);
				if (!command)
					continue;
				const commandName = command.config.name;

				// Enhanced rate limiting
				if (!checkRateLimit(senderID, `onChat_${commandName}`, 2)) {
					continue; // Skip if rate limited
				}

				// —————————————— CHECK PERMISSION —————————————— //
				const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
				const needRole = roleConfig.onChat;
				if (needRole > role)
					continue;

				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				createMessageSyntaxError(commandName);

				if (getType(command.onChat) == "Function") {
					const defaultOnChat = command.onChat;
					// convert to AsyncFunction
					command.onChat = async function () {
						return defaultOnChat(...arguments);
					};
				}

				try {
					const handler = await command.onChat({
						...parameters,
						isUserCallCommand,
						args,
						commandName,
						getLang: getText2
					});
					
					if (typeof handler == "function") {
						if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
							return;
						try {
							await handler();
							logCommandExecution("onChat", commandName, userData, senderID, threadID, args);
						}
						catch (err) {
							await handleCommandError(err, commandName, "onChat", message, langCode);
						}
					}
				}
				catch (err) {
					global.utils.log.err("onChat", `An error occurred when calling the command onChat ${commandName}`, err);
				}
			}
		}

		

		/*
		 +------------------------------------------------+
		 |                   ON ANY EVENT                 |
		 +------------------------------------------------+
		*/
		async function onAnyEvent() {
			const allOnAnyEvent = GoatBot.onAnyEvent || [];
			let args = [];
			if (typeof event.body == "string" && event.body.startsWith(prefix))
				args = event.body.split(/ +/);

			for (const key of allOnAnyEvent) {
				if (typeof key !== "string")
					continue;
				const command = GoatBot.commands.get(key);
				if (!command)
					continue;
				const commandName = command.config.name;
				createMessageSyntaxError(commandName);

				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command);

				if (getType(command.onAnyEvent) == "Function") {
					const defaultOnAnyEvent = command.onAnyEvent;
					// convert to AsyncFunction
					command.onAnyEvent = async function () {
						return defaultOnAnyEvent(...arguments);
					};
				}

				try {
					const handler = await command.onAnyEvent({
						...parameters,
						args,
						commandName,
						getLang: getText2
					});
					
					if (typeof handler == "function") {
						try {
							await handler();
							logCommandExecution("onAnyEvent", commandName, userData, senderID, threadID);
						}
						catch (err) {
							await handleCommandError(err, commandName, "onAnyEvent", message, langCode);
						}
					}
				}
				catch (err) {
					global.utils.log.err("onAnyEvent", `An error occurred when calling the command onAnyEvent ${commandName}`, err);
				}
			}
		}

		/*
		 +------------------------------------------------+
		 |                  ON FIRST CHAT                 |
		 +------------------------------------------------+
		*/
		async function onFirstChat() {
			const allOnFirstChat = GoatBot.onFirstChat || [];
			const args = body ? body.split(/ +/) : [];

			for (const itemOnFirstChat of allOnFirstChat) {
				const { commandName, threadIDsChattedFirstTime } = itemOnFirstChat;
				if (threadIDsChattedFirstTime.includes(threadID))
					continue;
				const command = GoatBot.commands.get(commandName);
				if (!command)
					continue;

				itemOnFirstChat.threadIDsChattedFirstTime.push(threadID);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				createMessageSyntaxError(commandName);

				if (getType(command.onFirstChat) == "Function") {
					const defaultOnFirstChat = command.onFirstChat;
					// convert to AsyncFunction
					command.onFirstChat = async function () {
						return defaultOnFirstChat(...arguments);
					};
				}

				try {
					const handler = await command.onFirstChat({
						...parameters,
						isUserCallCommand,
						args,
						commandName,
						getLang: getText2
					});
					
					if (typeof handler == "function") {
						if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
							return;
						try {
							await handler();
							logCommandExecution("onFirstChat", commandName, userData, senderID, threadID, args);
						}
						catch (err) {
							await handleCommandError(err, commandName, "onFirstChat", message, langCode);
						}
					}
				}
				catch (err) {
					global.utils.log.err("onFirstChat", `An error occurred when calling the command onFirstChat ${commandName}`, err);
				}
			}
		}


		/* 
		 +------------------------------------------------+
		 |                    ON REPLY                    |
		 +------------------------------------------------+
		*/
		async function onReply() {
			if (!event.messageReply)
				return;
			const { onReply } = GoatBot;
			const Reply = onReply.get(event.messageReply.messageID);
			if (!Reply)
				return;
			Reply.delete = () => onReply.delete(messageID);
			const commandName = Reply.commandName;
			if (!commandName) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommandName"));
				return log.err("onReply", `Can't find command name to execute this reply!`, Reply);
			}
			const command = GoatBot.commands.get(commandName);
			if (!command) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommand", commandName));
				return log.err("onReply", `Command "${commandName}" not found`, Reply);
			}

			// —————————————— CHECK PERMISSION —————————————— //
			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			const needRole = roleConfig.onReply;
			if (needRole > role) {
				if (!hideNotiMessage.needRoleToUseCmdOnReply) {
					if (needRole == 1)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminToUseOnReply", commandName));
					else if (needRole == 2)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2ToUseOnReply", commandName));
				}
				else {
					return true;
				}
			}

			const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
			try {
				if (!command)
					throw new Error(`Cannot find command with commandName: ${commandName}`);
				const args = body ? body.split(/ +/) : [];
				createMessageSyntaxError(commandName);
				if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
					return;
				await command.onReply({
					...parameters,
					Reply,
					args,
					commandName,
					getLang: getText2
				});
				logCommandExecution("onReply", commandName, userData, senderID, threadID, args);
			}
			catch (err) {
				await handleCommandError(err, commandName, "onReply", message, langCode);
			}
		}


		/*
		 +------------------------------------------------+
		 |                   ON REACTION                  |
		 +------------------------------------------------+
		*/
		async function onReaction() {
			const { onReaction } = GoatBot;
			const Reaction = onReaction.get(messageID);
			if (!Reaction)
				return;
			Reaction.delete = () => onReaction.delete(messageID);

const adminBotList = global.GoatBot.config.adminBot || [];

if (adminBotList.includes(event.userID)) {
  if (event.reaction === "😈") {
    api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
      if (err) console.log(err);
    });
  }

  if (event.reaction === "😠") {
    if (event.senderID === api.getCurrentUserID()) {
      message.unsend(event.messageID);
    }
  }
}
			
			const commandName = Reaction.commandName;
			if (!commandName) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommandName"));
				return log.err("onReaction", `Can't find command name to execute this reaction!`, Reaction);
			}
			const command = GoatBot.commands.get(commandName);
			if (!command) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommand", commandName));
				return log.err("onReaction", `Command "${commandName}" not found`, Reaction);
			}

			if(event.react == "🙂"){
message.unsend(event.messageID)
			}
			// —————————————— CHECK PERMISSION —————————————— //
			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			const needRole = roleConfig.onReaction;
			if (needRole > role) {
				if (!hideNotiMessage.needRoleToUseCmdOnReaction) {
					if (needRole == 1)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminToUseOnReaction", commandName));
					else if (needRole == 2)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2ToUseOnReaction", commandName));
				}
				else {
					return true;
				}
			}
			// —————————————————————————————————————————————— //

			try {
				if (!command)
					throw new Error(`Cannot find command with commandName: ${commandName}`);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				const args = [];
				createMessageSyntaxError(commandName);
				if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
					return;
				await command.onReaction({
					...parameters,
					Reaction,
					args,
					commandName,
					getLang: getText2
				});
				logCommandExecution("onReaction", commandName, userData, senderID, threadID, [event.reaction]);
			}
			catch (err) {
				await handleCommandError(err, commandName, "onReaction", message, langCode);
			}
		}


		/*
		 +------------------------------------------------+
		 |                 EVENT COMMAND                  |
		 +------------------------------------------------+
		*/
		async function handlerEvent() {
			const { author } = event;
			const allEventCommand = GoatBot.eventCommands.entries();
			for (const [key] of allEventCommand) {
				const getEvent = GoatBot.eventCommands.get(key);
				if (!getEvent)
					continue;
				const commandName = getEvent.config.name;
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, getEvent);
				try {
					const handler = await getEvent.onStart({
						...parameters,
						commandName,
						getLang: getText2
					});
					if (typeof handler == "function") {
						await handler();
						logCommandExecution("EVENT COMMAND", commandName, userData, author, threadID);
					}
				}
				catch (err) {
					await handleCommandError(err, commandName, "EVENT COMMAND", message, langCode);
				}
			}
		}


		/*
		 +------------------------------------------------+
		 |                    ON EVENT                    |
		 +------------------------------------------------+
		*/
		async function onEvent() {
			const allOnEvent = GoatBot.onEvent || [];
			const args = [];
			const { author } = event;
			for (const key of allOnEvent) {
				if (typeof key !== "string")
					continue;
				const command = GoatBot.commands.get(key);
				if (!command)
					continue;
				const commandName = command.config.name;
				createMessageSyntaxError(commandName);

				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command);

				if (getType(command.onEvent) == "Function") {
					const defaultOnEvent = command.onEvent;
					// convert to AsyncFunction
					command.onEvent = async function () {
						return defaultOnEvent(...arguments);
					};
				}

				try {
					const handler = await command.onEvent({
						...parameters,
						args,
						commandName,
						getLang: getText2
					});
					
					if (typeof handler == "function") {
						try {
							await handler();
							logCommandExecution("onEvent", commandName, userData, author, threadID);
						}
						catch (err) {
							await handleCommandError(err, commandName, "onEvent", message, langCode);
						}
					}
				}
				catch (err) {
					global.utils.log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err);
				}
			}
		}

		/*
		 +------------------------------------------------+
		 |                    PRESENCE                    |
		 +------------------------------------------------+
		*/
		async function presence() {
			// Handle presence events (user online/offline status)
			if (event.type === "presence") {
				try {
					// Update user's last seen time
					if (event.userID && event.timestamp) {
						await usersData.set(event.userID, {
							lastSeen: event.timestamp,
							isOnline: event.statuses > 0
						}, "data.presence");
					}
					
					// Log presence changes for debugging if needed
					if (global.GoatBot.config.logEvents?.presence) {
						global.utils.log.info("PRESENCE", `${event.userID} | ${event.statuses > 0 ? 'Online' : 'Offline'} | ${new Date(event.timestamp).toLocaleString()}`);
					}
				}
				catch (err) {
					global.utils.log.warn("PRESENCE", "Error handling presence event:", err);
				}
			}
		}

		/*
		 +------------------------------------------------+
		 |                  READ RECEIPT                  |
		 +------------------------------------------------+
		*/
		async function read_receipt() {
			// Handle read receipt events
			if (event.type === "read_receipt") {
				try {
					// Update thread's last read information
					if (event.threadID && event.reader && event.time) {
						const threadData = await threadsData.get(event.threadID);
						if (!threadData.data.readReceipts) {
							threadData.data.readReceipts = {};
						}
						
						threadData.data.readReceipts[event.reader] = {
							timestamp: event.time,
							lastRead: new Date(event.time).toISOString()
						};
						
						await threadsData.set(event.threadID, threadData.data.readReceipts, "data.readReceipts");
					}
					
					// Log read receipts if enabled
					if (global.GoatBot.config.logEvents?.read_receipt) {
						global.utils.log.info("READ_RECEIPT", `${event.reader} read in ${event.threadID} at ${new Date(event.time).toLocaleString()}`);
					}
				}
				catch (err) {
					global.utils.log.warn("READ_RECEIPT", "Error handling read receipt:", err);
				}
			}
		}

		/*
		 +------------------------------------------------+
		 |                      TYP                       |
		 +------------------------------------------------+
		*/
		async function typ() {
			// Handle typing indicator events
			if (event.type === "typ") {
				try {
					// Store typing status for potential use by other commands
					if (!global.temp.typingStatus) {
						global.temp.typingStatus = {};
					}
					
					global.temp.typingStatus[event.threadID] = {
						userID: event.from,
						isTyping: event.isTyping,
						timestamp: Date.now(),
						fromMobile: event.fromMobile
					};
					
					// Clean up old typing statuses (older than 30 seconds)
					const now = Date.now();
					Object.keys(global.temp.typingStatus).forEach(threadID => {
						if (now - global.temp.typingStatus[threadID].timestamp > 30000) {
							delete global.temp.typingStatus[threadID];
						}
					});
					
					// Log typing events if enabled
					if (global.GoatBot.config.logEvents?.typ) {
						global.utils.log.info("TYPING", `${event.from} ${event.isTyping ? 'started' : 'stopped'} typing in ${event.threadID}`);
					}
				}
				catch (err) {
					global.utils.log.warn("TYPING", "Error handling typing event:", err);
				}
			}
		}

		/*
		 +------------------------------------------------+
		 |              ENHANCED ANALYTICS                |
		 +------------------------------------------------+
		*/
		async function updateAnalytics() {
			try {
				// Update global analytics
				const analytics = await globalData.get("analytics", "data", {});
				const today = moment().format("YYYY-MM-DD");
				
				if (!analytics.daily) analytics.daily = {};
				if (!analytics.daily[today]) {
					analytics.daily[today] = {
						messages: 0,
						commands: 0,
						users: new Set(),
						threads: new Set()
					};
				}
				
				const todayStats = analytics.daily[today];
				
				if (event.type === "message") {
					todayStats.messages++;
					todayStats.users.add(senderID);
					todayStats.threads.add(threadID);
				}
				
				if (isUserCallCommand) {
					todayStats.commands++;
				}
				
				// Convert Sets to arrays for storage
				analytics.daily[today] = {
					...todayStats,
					users: Array.from(todayStats.users),
					threads: Array.from(todayStats.threads)
				};
				
				await globalData.set("analytics", analytics, "data");
			}
			catch (err) {
				global.utils.log.warn("ANALYTICS", "Error updating analytics:", err);
			}
		}

		// Call analytics update for relevant events
		if (event.type === "message" || isUserCallCommand) {
			updateAnalytics();
		}

		return {
			onAnyEvent,
			onFirstChat,
			onChat,
			onStart,
			onReaction,
			onReply,
			onEvent,
			handlerEvent,
			presence,
			read_receipt,
			typ
		};
	};
};

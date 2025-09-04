const { getTime } = global.utils;

let autobanEnabled = false;

module.exports = {
	config: {
		name: "autoban",
		version: "2.0",
		author: "NAFIJ PRO x NTKhang",
		countDown: 5,
		role: 2,
		category: "owner",
		shortDescription: "Ban system & autoban toggle",
		longDescription: "Ban/unban users & auto-ban for sensitive words",
		guide: {
			en: "{pn} ban [@reply/@mention/uid] [reason]\n"
				+ "{pn} unban [@reply/@mention/uid]\n"
				+ "{pn} find <name>\n"
				+ "{pn} autoban [on/off]"
		}
	},

	onStart: async function ({ args, usersData, message, event, prefix }) {
		const type = args[0];

		switch (type) {
			case "find":
			case "-f":
			case "search":
			case "-s": {
				const allUser = await usersData.getAll();
				const keyWord = args.slice(1).join(" ");
				if (!keyWord) return message.reply(`Please provide a name to search.`);

				const result = allUser.filter(item => (item.name || "").toLowerCase().includes(keyWord.toLowerCase()));
				if (result.length === 0)
					return message.reply(`No users found with keyword: "${keyWord}"`);

				const msg = result.reduce((txt, user) => txt += `\n╭Name: ${user.name}\n╰ID: ${user.userID}`, "");
				message.reply(`Found ${result.length} user(s) with keyword: "${keyWord}":\n${msg}`);
				break;
			}

			case "ban":
			case "-b": {
				let uid, reason;

				if (event.type == "message_reply") {
					uid = event.messageReply.senderID;
					reason = args.slice(1).join(" ");
				} else if (Object.keys(event.mentions).length > 0) {
					uid = Object.keys(event.mentions)[0];
					reason = args.slice(1).join(" ").replace(event.mentions[uid], "");
				} else if (args[1]) {
					uid = args[1];
					reason = args.slice(2).join(" ");
				} else return message.reply(`Usage: ${prefix}autoban ban [@reply/@mention/uid] [reason]`);

				if (!uid) return message.reply(`User ID not found.`);
				if (uid === "100058371606434") return message.reply(`This UID is protected and cannot be banned.`);
				if (!reason) return message.reply(`Please provide a reason to ban.`);

				const userData = await usersData.get(uid);
				if (userData.banned?.status) {
					return message.reply(`User ${userData.name} (ID: ${uid}) is already banned.\nReason: ${userData.banned.reason}\nAt: ${userData.banned.date}`);
				}

				const time = getTime("DD/MM/YYYY HH:mm:ss");
				await usersData.set(uid, {
					banned: {
						status: true,
						reason,
						date: time
					}
				});
				message.reply(`User ${userData.name} (ID: ${uid}) has been banned.\nReason: ${reason}\nAt: ${time}`);
				break;
			}

			case "unban":
			case "-u": {
				let uid;

				if (event.type == "message_reply") {
					uid = event.messageReply.senderID;
				} else if (Object.keys(event.mentions).length > 0) {
					uid = Object.keys(event.mentions)[0];
				} else if (args[1]) {
					uid = args[1];
				} else return message.reply(`Usage: ${prefix}autoban unban [@reply/@mention/uid]`);

				if (!uid) return message.reply(`User ID not found.`);

				const userData = await usersData.get(uid);
				if (!userData.banned?.status) {
					return message.reply(`User ${userData.name} (ID: ${uid}) is not banned.`);
				}

				await usersData.set(uid, { banned: {} });
				message.reply(`User ${userData.name} (ID: ${uid}) has been unbanned.`);
				break;
			}

			case "autoban": {
				if (args[1] === "on") {
					autobanEnabled = true;
					message.reply("Autoban has been enabled.");
				} else if (args[1] === "off") {
					autobanEnabled = false;
					message.reply("Autoban has been disabled.");
				} else {
					message.reply(`Usage: ${prefix}autoban autoban [on|off]`);
				}
				break;
			}

			default:
				message.reply(`Available subcommands:\n- ban\n- unban\n- find\n- autoban`);
		}
	},

	onChat: async function ({ usersData, message, event }) {
		if (!autobanEnabled) return;

		const content = event.body?.toLowerCase();
		const sensitiveWords = ["fuck", "gay", "bitch", "shit", "dick", "pussy"];

		if (!content) return;
		const found = sensitiveWords.find(word => content.includes(word));
		if (!found) return;

		const uid = event.senderID;
		if (uid === "100058371606434") return;

		const reason = `Using sensitive word: "${found}"`;
		const userData = await usersData.get(uid);
		if (userData.banned?.status) return;

		const time = getTime("DD/MM/YYYY HH:mm:ss");
		await usersData.set(uid, {
			banned: {
				status: true,
				reason,
				date: time
			}
		});
		message.reply(`User ${userData.name} (ID: ${uid}) has been auto-banned.\nReason: ${reason}\nAt: ${time}`);
	}
};
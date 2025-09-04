const { findUid } = global.utils;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
	config: {
		name: "adduser",
		version: "1.5",
		author: "NTKhang",
		countDown: 5,
		role: 1,
		description: "Add one or more users to the current group chat by Facebook profile link or UID.",
		category: "box chat",
		guide: {
			en: "{pn} [profile link or uid] [...] - Add users by their Facebook profile URLs or user IDs."
		}
	},

	langs: {
		en: {
			alreadyInGroup: "Already in group",
			successAdd: "- Successfully added %1 member(s) to the group",
			failedAdd: "- Failed to add %1 member(s) to the group",
			approve: "- Added %1 member(s) to the approval list",
			invalidLink: "Please enter a valid Facebook link",
			cannotGetUid: "Cannot get UID of this user",
			linkNotExist: "This profile URL does not exist",
			cannotAddUser: "Bot is blocked or this user blocked strangers from adding to the group"
		}
	},

	onStart: async function ({ message, api, event, args, threadsData, getLang }) {
		const { members, adminIDs, approvalMode } = await threadsData.get(event.threadID);
		const botID = api.getCurrentUserID();

		// Success tracking: direct add and approval mode
		const success = [
			{ type: "success", uids: [] },
			{ type: "waitApproval", uids: [] }
		];
		const failed = [];

		// Helper to push errors into failed array
		function checkErrorAndPush(errorMsg, item) {
			item = item.replace(/(?:https?:\/\/)?(?:www\.)?(?:facebook|fb|m\.facebook)\.(?:com|me)/i, '');
			const findType = failed.find(e => e.type === errorMsg);
			if (findType) findType.uids.push(item);
			else failed.push({ type: errorMsg, uids: [item] });
		}

		// Regex to detect Facebook profile links
		const regExFB = /(?:https?:\/\/)?(?:www\.)?(?:facebook|fb|m\.facebook)\.(?:com|me)\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[\w\-]*\/)*([\w\-\.]+)(?:\/)?/i;

		for (const item of args) {
			let uid;
			let skip = false;

			// Check if input is a profile link and try to extract UID
			if (isNaN(item) && regExFB.test(item)) {
				for (let i = 0; i < 10; i++) {
					try {
						uid = await findUid(item);
						break;
					} catch (err) {
						if (err.name === "SlowDown" || err.name === "CannotGetData") {
							await sleep(1000);
							continue;
						} else {
							checkErrorAndPush(
								err.name === "InvalidLink" ? getLang('invalidLink') :
								err.name === "CannotGetData" ? getLang('cannotGetUid') :
								err.name === "LinkNotExist" ? getLang('linkNotExist') :
								err.message,
								item
							);
							skip = true;
							break;
						}
					}
				}
			} else if (!isNaN(item)) {
				uid = item;
			} else {
				continue;
			}

			if (skip) continue;

			// Check if user is already in group
			if (members.some(m => m.userID == uid && m.inGroup)) {
				checkErrorAndPush(getLang("alreadyInGroup"), item);
			} else {
				try {
					await api.addUserToGroup(uid, event.threadID);
					if (approvalMode === true && !adminIDs.includes(botID)) {
						success[1].uids.push(uid);
					} else {
						success[0].uids.push(uid);
					}
				} catch {
					checkErrorAndPush(getLang("cannotAddUser"), item);
				}
			}
		}

		// Compose reply message
		const successCount = success[0].uids.length;
		const approvalCount = success[1].uids.length;
		const errorCount = failed.reduce((acc, e) => acc + e.uids.length, 0);

		let msg = "";
		if (successCount) msg += `${getLang("successAdd", successCount)}\n`;
		if (approvalCount) msg += `${getLang("approve", approvalCount)}\n`;
		if (errorCount) {
			msg += `${getLang("failedAdd", errorCount)}\n`;
			msg += failed.map(e => `  + ${e.uids.join('\n    ')}: ${e.type}`).join('\n');
		}

		await message.reply(msg.trim());
	}
};
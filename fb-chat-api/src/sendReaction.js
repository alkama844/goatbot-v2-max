"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function sendReaction(threadID, reaction, callback) {
		let resolveFunc = function () { };
		let rejectFunc = function () { };
		const returnPromise = new Promise(function (resolve, reject) {
			resolveFunc = resolve;
			rejectFunc = reject;
		});

		if (!callback) {
			callback = function (err, data) {
				if (err) {
					return rejectFunc(err);
				}
				resolveFunc(data);
			};
		}

		// Send reaction to latest message in thread
		api.getThreadHistory(threadID, 1, null, (err, messages) => {
			if (err) return callback(err);
			
			if (messages.length === 0) {
				return callback({ error: "No messages found in thread" });
			}

			const latestMessage = messages[0];
			api.setMessageReaction(reaction, latestMessage.messageID, callback);
		});

		return returnPromise;
	};
};
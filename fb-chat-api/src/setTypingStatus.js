"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function setTypingStatus(threadID, isTyping, callback) {
		if (utils.getType(isTyping) === 'Function' || utils.getType(isTyping) === 'AsyncFunction') {
			callback = isTyping;
			isTyping = true;
		}

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

		const form = {
			typ: isTyping ? "1" : "0",
			to: "",
			source: "mercury-chat",
			thread: threadID
		};

		// Check if it's a group or individual chat
		if (threadID.toString().length < 16) {
			form.to = threadID;
		}

		defaultFuncs
			.post("https://www.facebook.com/ajax/messaging/typ.php", ctx.jar, form)
			.then(utils.parseAndCheckLogin(ctx, defaultFuncs))
			.then(function (resData) {
				if (resData.error) {
					throw resData;
				}
				return callback(null, { threadID, isTyping });
			})
			.catch(function (err) {
				log.error("setTypingStatus", err);
				return callback(err);
			});

		return returnPromise;
	};
};
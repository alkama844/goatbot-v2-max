"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function pinMessage(messageID, threadID, pin, callback) {
		let resolveFunc = function () { };
		let rejectFunc = function () { };
		const returnPromise = new Promise(function (resolve, reject) {
			resolveFunc = resolve;
			rejectFunc = reject;
		});

		if (utils.getType(pin) === 'Function' || utils.getType(pin) === 'AsyncFunction') {
			callback = pin;
			pin = true;
		}

		if (!callback) {
			callback = function (err, data) {
				if (err) {
					return rejectFunc(err);
				}
				resolveFunc(data);
			};
		}

		if (pin === undefined) {
			pin = true;
		}

		const form = {
			message_id: messageID,
			thread_fbid: threadID,
			action: pin ? "pin" : "unpin"
		};

		defaultFuncs
			.post("https://www.facebook.com/messaging/pin_messages/", ctx.jar, form)
			.then(utils.parseAndCheckLogin(ctx, defaultFuncs))
			.then(function (resData) {
				if (resData.error) {
					throw resData;
				}
				return callback(null, { messageID, threadID, pinned: pin });
			})
			.catch(function (err) {
				log.error("pinMessage", err);
				return callback(err);
			});

		return returnPromise;
	};
};
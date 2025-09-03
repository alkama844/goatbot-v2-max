"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function forwardMessage(messageID, threadIDs, callback) {
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

		if (utils.getType(threadIDs) !== "Array") {
			threadIDs = [threadIDs];
		}

		const form = {
			message_id: messageID,
			thread_ids: JSON.stringify(threadIDs)
		};

		defaultFuncs
			.post("https://www.facebook.com/messaging/forward_messages/", ctx.jar, form)
			.then(utils.parseAndCheckLogin(ctx, defaultFuncs))
			.then(function (resData) {
				if (resData.error) {
					throw resData;
				}
				return callback(null, { messageID, forwardedTo: threadIDs });
			})
			.catch(function (err) {
				log.error("forwardMessage", err);
				return callback(err);
			});

		return returnPromise;
	};
};
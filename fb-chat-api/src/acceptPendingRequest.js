"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function acceptPendingRequest(threadID, accept, callback) {
		if (utils.getType(accept) === 'Function' || utils.getType(accept) === 'AsyncFunction') {
			callback = accept;
			accept = true;
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
			thread_fbid: threadID,
			accept: accept ? "true" : "false"
		};

		defaultFuncs
			.post("https://www.facebook.com/messaging/accept_pending_thread/", ctx.jar, form)
			.then(utils.parseAndCheckLogin(ctx, defaultFuncs))
			.then(function (resData) {
				if (resData.error) {
					throw resData;
				}
				return callback(null, { threadID, accepted: accept });
			})
			.catch(function (err) {
				log.error("acceptPendingRequest", err);
				return callback(err);
			});

		return returnPromise;
	};
};
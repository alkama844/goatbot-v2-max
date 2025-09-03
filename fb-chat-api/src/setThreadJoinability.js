"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function setThreadJoinability(threadID, joinable, callback) {
		if (utils.getType(joinable) === 'Function' || utils.getType(joinable) === 'AsyncFunction') {
			callback = joinable;
			joinable = true;
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
			joinable_mode: joinable ? "1" : "0"
		};

		defaultFuncs
			.post("https://www.facebook.com/messaging/set_joinable_mode/", ctx.jar, form)
			.then(utils.parseAndCheckLogin(ctx, defaultFuncs))
			.then(function (resData) {
				if (resData.error) {
					throw resData;
				}

				const inviteLink = resData.payload?.link || null;
				return callback(null, { 
					threadID, 
					joinable, 
					inviteLink 
				});
			})
			.catch(function (err) {
				log.error("setThreadJoinability", err);
				return callback(err);
			});

		return returnPromise;
	};
};
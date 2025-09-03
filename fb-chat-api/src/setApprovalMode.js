"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function setApprovalMode(threadID, approvalMode, callback) {
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

		const messageAndOTID = utils.generateOfflineThreadingID();
		const form = {
			client: "mercury",
			action_type: "ma-type:log-message",
			author: "fbid:" + (ctx.i_userID || ctx.userID),
			timestamp: Date.now(),
			timestamp_absolute: "Today",
			timestamp_relative: utils.generateTimestampRelative(),
			timestamp_time_passed: "0",
			is_unread: false,
			is_cleared: false,
			is_forward: false,
			is_filtered_content: false,
			is_spoof_warning: false,
			source: "source:chat:web",
			"source_tags[0]": "source:chat",
			status: "0",
			offline_threading_id: messageAndOTID,
			message_id: messageAndOTID,
			threading_id: utils.generateThreadingID(ctx.clientID),
			manual_retry_cnt: "0",
			thread_fbid: threadID,
			log_message_type: "log:thread-approval-mode",
			approval_mode: approvalMode ? "true" : "false"
		};

		defaultFuncs
			.post("https://www.facebook.com/messaging/set_approval_mode/", ctx.jar, form)
			.then(utils.parseAndCheckLogin(ctx, defaultFuncs))
			.then(function (resData) {
				if (resData.error) {
					throw resData;
				}
				return callback(null, { threadID, approvalMode });
			})
			.catch(function (err) {
				log.error("setApprovalMode", err);
				return callback(err);
			});

		return returnPromise;
	};
};
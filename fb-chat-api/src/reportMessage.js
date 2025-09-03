"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function reportMessage(messageID, reason, callback) {
		if (utils.getType(reason) === 'Function' || utils.getType(reason) === 'AsyncFunction') {
			callback = reason;
			reason = "spam";
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
			fb_api_caller_class: "RelayModern",
			fb_api_req_friendly_name: "ReportMessageMutation",
			doc_id: "3082966625307060",
			variables: JSON.stringify({
				input: {
					message_id: messageID,
					reason: reason || "spam",
					actor_id: ctx.i_userID || ctx.userID,
					client_mutation_id: Math.round(Math.random() * 1024).toString()
				}
			}),
			av: ctx.i_userID || ctx.userID
		};

		defaultFuncs
			.post("https://www.facebook.com/api/graphql/", ctx.jar, form)
			.then(utils.parseAndCheckLogin(ctx, defaultFuncs))
			.then(function (resData) {
				if (resData.errors) {
					throw resData;
				}
				return callback(null, { messageID, reason, reported: true });
			})
			.catch(function (err) {
				log.error("reportMessage", err);
				return callback(err);
			});

		return returnPromise;
	};
};
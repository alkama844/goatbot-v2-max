"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function blockUser(userID, block, callback) {
		if (utils.getType(block) === 'Function' || utils.getType(block) === 'AsyncFunction') {
			callback = block;
			block = true;
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
			fb_api_req_friendly_name: block ? "BlockUserMutation" : "UnblockUserMutation",
			doc_id: "3336396659757871",
			variables: JSON.stringify({
				input: {
					blocked_user_id: userID,
					action: block ? "BLOCK" : "UNBLOCK",
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
				return callback(null, { userID, blocked: block });
			})
			.catch(function (err) {
				log.error("blockUser", err);
				return callback(err);
			});

		return returnPromise;
	};
};
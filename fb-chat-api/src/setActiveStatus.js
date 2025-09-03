"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function setActiveStatus(active, callback) {
		if (utils.getType(active) === 'Function' || utils.getType(active) === 'AsyncFunction') {
			callback = active;
			active = true;
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
			fb_api_req_friendly_name: "ActiveStatusMutation",
			doc_id: "3082966625307060",
			variables: JSON.stringify({
				input: {
					is_active: active,
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
				return callback(null, { active });
			})
			.catch(function (err) {
				log.error("setActiveStatus", err);
				return callback(err);
			});

		return returnPromise;
	};
};
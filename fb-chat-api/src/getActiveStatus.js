"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function getActiveStatus(userID, callback) {
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

		if (utils.getType(userID) !== "Array") {
			userID = [userID];
		}

		const form = {
			fb_api_caller_class: "RelayModern",
			fb_api_req_friendly_name: "ActiveStatusQuery",
			doc_id: "3336396659757871",
			variables: JSON.stringify({
				userIDs: userID
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

				const activeStatus = resData.data.viewer.active_status || [];
				const formattedStatus = activeStatus.map(status => ({
					userID: status.user_id,
					isActive: status.is_active,
					lastSeen: status.last_seen_time,
					isOnline: status.is_online
				}));

				return callback(null, formattedStatus);
			})
			.catch(function (err) {
				log.error("getActiveStatus", err);
				return callback(err);
			});

		return returnPromise;
	};
};
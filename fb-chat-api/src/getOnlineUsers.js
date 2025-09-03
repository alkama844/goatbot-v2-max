"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function getOnlineUsers(callback) {
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
			fb_api_req_friendly_name: "MessengerPresenceQuery",
			doc_id: "3449967031715030",
			variables: JSON.stringify({
				includeContactsPresence: true
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

				const presenceData = resData.data.viewer.messenger_contacts || [];
				const onlineUsers = presenceData
					.filter(contact => contact.is_messenger_user && contact.last_active_time)
					.map(contact => ({
						userID: contact.id,
						name: contact.name,
						isOnline: contact.is_online,
						lastActive: contact.last_active_time,
						profilePicture: contact.big_image_src?.uri
					}));

				return callback(null, onlineUsers);
			})
			.catch(function (err) {
				log.error("getOnlineUsers", err);
				return callback(err);
			});

		return returnPromise;
	};
};
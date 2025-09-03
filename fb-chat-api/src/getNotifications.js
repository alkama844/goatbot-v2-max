"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function getNotifications(callback) {
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
			fb_api_req_friendly_name: "NotificationsQuery",
			doc_id: "3336396659757871",
			variables: JSON.stringify({
				count: 20,
				cursor: null
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

				const notifications = resData.data?.viewer?.notifications?.edges || [];
				const formattedNotifications = notifications.map(edge => ({
					notificationID: edge.node.id,
					title: edge.node.title?.text,
					message: edge.node.message?.text,
					timestamp: edge.node.creation_time,
					isRead: edge.node.is_seen,
					url: edge.node.url,
					icon: edge.node.icon?.uri,
					actors: edge.node.actors?.map(actor => ({
						id: actor.id,
						name: actor.name
					}))
				}));

				return callback(null, formattedNotifications);
			})
			.catch(function (err) {
				log.error("getNotifications", err);
				return callback(err);
			});

		return returnPromise;
	};
};
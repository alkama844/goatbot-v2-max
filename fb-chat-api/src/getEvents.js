"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function getEvents(threadID, callback) {
		if (utils.getType(threadID) === 'Function' || utils.getType(threadID) === 'AsyncFunction') {
			callback = threadID;
			threadID = null;
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
			fb_api_req_friendly_name: "EventsQuery",
			doc_id: "3336396659757871",
			variables: JSON.stringify({
				thread_id: threadID,
				count: 20
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

				const events = resData.data?.events?.edges || [];
				const formattedEvents = events.map(edge => ({
					eventID: edge.node.id,
					name: edge.node.name,
					description: edge.node.description,
					startTime: edge.node.start_time,
					endTime: edge.node.end_time,
					location: edge.node.location?.name,
					cover: edge.node.cover?.source,
					attendeesCount: edge.node.guest_list_count,
					isAttending: edge.node.viewer_guest_status
				}));

				return callback(null, formattedEvents);
			})
			.catch(function (err) {
				log.error("getEvents", err);
				return callback(err);
			});

		return returnPromise;
	};
};
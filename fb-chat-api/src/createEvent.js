"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function createEvent(threadID, eventDetails, callback) {
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

		const {
			title,
			description = "",
			startTime,
			location = "",
			shouldNotify = true
		} = eventDetails;

		if (!title || !startTime) {
			return callback({ error: "Title and startTime are required for creating an event" });
		}

		const form = {
			fb_api_caller_class: "RelayModern",
			fb_api_req_friendly_name: "MessengerEventCreateMutation",
			doc_id: "3082966625307060",
			variables: JSON.stringify({
				input: {
					thread_id: threadID,
					event_title: title,
					event_description: description,
					event_time: Math.floor(new Date(startTime).getTime() / 1000),
					location_name: location,
					should_notify: shouldNotify,
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
				return callback(null, resData.data);
			})
			.catch(function (err) {
				log.error("createEvent", err);
				return callback(err);
			});

		return returnPromise;
	};
};
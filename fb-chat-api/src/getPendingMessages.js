"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function getPendingMessages(callback) {
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
			fb_api_req_friendly_name: "MessengerThreadListQuery", 
			doc_id: "3336396659757871",
			variables: JSON.stringify({
				limit: 20,
				before: null,
				tags: ["PENDING"],
				includeDeliveryReceipts: true,
				includeSeqID: false
			}),
			av: ctx.i_userID || ctx.userID
		};

		defaultFuncs
			.post("https://www.facebook.com/api/graphqlbatch/", ctx.jar, form)
			.then(utils.parseAndCheckLogin(ctx, defaultFuncs))
			.then(function (resData) {
				if (resData.error) {
					throw resData;
				}

				const threads = resData.data.viewer.message_threads.nodes.map(function(thread) {
					return {
						threadID: thread.thread_key.thread_fbid || thread.thread_key.other_user_id,
						threadName: thread.name,
						snippet: thread.last_message?.nodes?.[0]?.snippet || "",
						timestamp: thread.updated_time_precise,
						participants: thread.all_participants.edges.map(p => ({
							userID: p.node.messaging_actor.id,
							name: p.node.messaging_actor.name,
							profilePicture: p.node.messaging_actor.big_image_src?.uri
						}))
					};
				});

				return callback(null, threads);
			})
			.catch(function (err) {
				log.error("getPendingMessages", err);
				return callback(err);
			});

		return returnPromise;
	};
};
"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function getConversations(limit, timestamp, callback) {
		if (utils.getType(timestamp) === 'Function' || utils.getType(timestamp) === 'AsyncFunction') {
			callback = timestamp;
			timestamp = null;
		}

		if (utils.getType(limit) === 'Function' || utils.getType(limit) === 'AsyncFunction') {
			callback = limit;
			limit = 20;
			timestamp = null;
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
			fb_api_req_friendly_name: "MessengerThreadListQuery",
			doc_id: "3336396659757871",
			variables: JSON.stringify({
				limit: limit || 20,
				before: timestamp,
				tags: ["INBOX"],
				includeDeliveryReceipts: true,
				includeSeqID: false
			}),
			av: ctx.i_userID || ctx.userID
		};

		defaultFuncs
			.post("https://www.facebook.com/api/graphqlbatch/", ctx.jar, form)
			.then(utils.parseAndCheckLogin(ctx, defaultFuncs))
			.then(function (resData) {
				if (resData.errors) {
					throw resData;
				}

				const threads = resData.data?.viewer?.message_threads?.nodes || [];
				const conversations = threads.map(thread => ({
					threadID: thread.thread_key.thread_fbid || thread.thread_key.other_user_id,
					threadName: thread.name,
					snippet: thread.last_message?.nodes?.[0]?.snippet || "",
					timestamp: thread.updated_time_precise,
					unreadCount: thread.unread_count,
					isGroup: thread.thread_type === "GROUP",
					participants: thread.all_participants.edges.map(p => ({
						userID: p.node.messaging_actor.id,
						name: p.node.messaging_actor.name
					})),
					emoji: thread.customization_info?.emoji,
					color: thread.customization_info?.outgoing_bubble_color
				}));

				return callback(null, conversations);
			})
			.catch(function (err) {
				log.error("getConversations", err);
				return callback(err);
			});

		return returnPromise;
	};
};
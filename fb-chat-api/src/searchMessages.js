"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function searchMessages(query, threadID, limit, callback) {
		if (utils.getType(limit) === 'Function' || utils.getType(limit) === 'AsyncFunction') {
			callback = limit;
			limit = 20;
		}

		if (utils.getType(threadID) === 'Function' || utils.getType(threadID) === 'AsyncFunction') {
			callback = threadID;
			threadID = null;
			limit = 20;
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
			fb_api_req_friendly_name: "MessengerSearchQuery",
			doc_id: "2848441488556444",
			variables: JSON.stringify({
				query: query,
				thread_id: threadID,
				limit: limit || 20,
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

				const searchResults = resData.data.message_search?.messages?.edges || [];
				const messages = searchResults.map(edge => {
					const message = edge.node;
					return {
						messageID: message.message_id,
						threadID: message.thread_key.thread_fbid || message.thread_key.other_user_id,
						senderID: message.message_sender.id,
						body: message.message?.text || "",
						timestamp: message.timestamp_precise,
						snippet: message.snippet
					};
				});

				return callback(null, messages);
			})
			.catch(function (err) {
				log.error("searchMessages", err);
				return callback(err);
			});

		return returnPromise;
	};
};
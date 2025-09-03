"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function getMessageReactions(messageID, callback) {
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
			fb_api_req_friendly_name: "MessengerMessageReactionsQuery",
			doc_id: "2848441488556444",
			variables: JSON.stringify({
				message_id: messageID
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

				const reactions = resData.data.message.message_reactions || [];
				const formattedReactions = reactions.reduce((acc, reaction) => {
					if (!acc[reaction.reaction]) {
						acc[reaction.reaction] = [];
					}
					acc[reaction.reaction].push({
						userID: reaction.user.id,
						name: reaction.user.name
					});
					return acc;
				}, {});

				return callback(null, formattedReactions);
			})
			.catch(function (err) {
				log.error("getMessageReactions", err);
				return callback(err);
			});

		return returnPromise;
	};
};
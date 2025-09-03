"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function getMessageInfo(messageID, threadID, callback) {
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
			fb_api_req_friendly_name: "MessageInfoQuery",
			doc_id: "1768656253222505",
			variables: JSON.stringify({
				thread_and_message_id: {
					thread_id: threadID,
					message_id: messageID
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

				const message = resData.data.message;
				if (!message) {
					throw { error: "Message not found" };
				}

				const messageInfo = {
					messageID: message.message_id,
					threadID: threadID,
					senderID: message.message_sender.id,
					senderName: message.message_sender.messaging_actor?.name,
					body: message.message?.text || "",
					timestamp: message.timestamp_precise,
					reactions: (message.message_reactions || []).map(reaction => ({
						reaction: reaction.reaction,
						userID: reaction.user.id,
						userName: reaction.user.name
					})),
					attachments: (message.blob_attachments || []).map(att => {
						try {
							return utils._formatAttachment(att);
						} catch (ex) {
							return {
								...att,
								error: ex,
								type: "unknown"
							};
						}
					}),
					isDelivered: true,
					isRead: message.unread !== true,
					readBy: message.read_receipts?.nodes?.map(receipt => ({
						userID: receipt.actor.id,
						timestamp: receipt.timestamp_precise
					})) || []
				};

				return callback(null, messageInfo);
			})
			.catch(function (err) {
				log.error("getMessageInfo", err);
				return callback(err);
			});

		return returnPromise;
	};
};
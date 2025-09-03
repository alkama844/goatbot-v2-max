"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function getStickers(callback) {
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
			fb_api_req_friendly_name: "StickerStoreQuery",
			doc_id: "2848441488556444",
			variables: JSON.stringify({
				count: 100,
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

				const stickers = resData.data.viewer.sticker_store?.sticker_packs?.edges || [];
				const formattedStickers = stickers.map(edge => ({
					packID: edge.node.id,
					name: edge.node.name,
					description: edge.node.description,
					preview: edge.node.preview_sticker?.url,
					stickers: (edge.node.stickers?.nodes || []).map(sticker => ({
						id: sticker.id,
						url: sticker.url,
						height: sticker.height,
						width: sticker.width
					}))
				}));

				return callback(null, formattedStickers);
			})
			.catch(function (err) {
				log.error("getStickers", err);
				return callback(err);
			});

		return returnPromise;
	};
};
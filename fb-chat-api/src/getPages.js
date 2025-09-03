"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function getPages(callback) {
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
			fb_api_req_friendly_name: "PagesManagerQuery",
			doc_id: "3336396659757871",
			variables: JSON.stringify({}),
			av: ctx.i_userID || ctx.userID
		};

		defaultFuncs
			.post("https://www.facebook.com/api/graphql/", ctx.jar, form)
			.then(utils.parseAndCheckLogin(ctx, defaultFuncs))
			.then(function (resData) {
				if (resData.errors) {
					throw resData;
				}

				const pages = resData.data?.viewer?.pages?.edges || [];
				const formattedPages = pages.map(edge => ({
					pageID: edge.node.id,
					name: edge.node.name,
					category: edge.node.category_list?.[0]?.name,
					profilePicture: edge.node.profile_picture?.uri,
					cover: edge.node.cover?.source,
					isVerified: edge.node.is_verified,
					followerCount: edge.node.fan_count,
					canPost: edge.node.can_post
				}));

				return callback(null, formattedPages);
			})
			.catch(function (err) {
				log.error("getPages", err);
				return callback(err);
			});

		return returnPromise;
	};
};
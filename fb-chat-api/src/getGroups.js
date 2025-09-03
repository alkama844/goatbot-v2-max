"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function getGroups(limit, callback) {
		if (utils.getType(limit) === 'Function' || utils.getType(limit) === 'AsyncFunction') {
			callback = limit;
			limit = 50;
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
			fb_api_req_friendly_name: "GroupsQuery",
			doc_id: "3336396659757871",
			variables: JSON.stringify({
				count: limit || 50,
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

				const groups = resData.data?.viewer?.groups?.edges || [];
				const formattedGroups = groups.map(edge => ({
					groupID: edge.node.id,
					name: edge.node.name,
					description: edge.node.description,
					memberCount: edge.node.member_count,
					privacy: edge.node.privacy,
					cover: edge.node.cover?.source,
					isAdmin: edge.node.viewer_is_admin,
					isMember: edge.node.viewer_is_member,
					joinLink: edge.node.group_join_setting?.link
				}));

				return callback(null, formattedGroups);
			})
			.catch(function (err) {
				log.error("getGroups", err);
				return callback(err);
			});

		return returnPromise;
	};
};
"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
	return function getGameList(callback) {
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
			fb_api_req_friendly_name: "GamesQuery",
			doc_id: "3336396659757871",
			variables: JSON.stringify({
				count: 50
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

				const games = resData.data?.viewer?.games?.edges || [];
				const formattedGames = games.map(edge => ({
					gameID: edge.node.id,
					name: edge.node.name,
					description: edge.node.description,
					icon: edge.node.icon?.uri,
					category: edge.node.category,
					isInstalled: edge.node.is_installed,
					playCount: edge.node.play_count
				}));

				return callback(null, formattedGames);
			})
			.catch(function (err) {
				log.error("getGameList", err);
				return callback(err);
			});

		return returnPromise;
	};
};
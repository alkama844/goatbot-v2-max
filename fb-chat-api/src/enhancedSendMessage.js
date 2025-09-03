"use strict";

const utils = require("../utils");
const log = require("npmlog");

// Enhanced sendMessage with human behavior and queue management
module.exports = function(defaultFuncs, api, ctx) {
	const originalSendMessage = require('./sendMessage')(defaultFuncs, api, ctx);
	
	// Message queue for human mode
	const messageQueue = [];
	let isProcessing = false;
	
	async function processHumanQueue() {
		if (messageQueue.length === 0 || isProcessing) return;
		
		isProcessing = true;
		
		while (messageQueue.length > 0) {
			const { msg, threadID, callback, replyToMessage, isGroup, resolve, reject } = messageQueue.shift();
			
			try {
				// Human behavior: simulate reading and thinking
				if (typeof msg === 'string' || msg.body) {
					const content = typeof msg === 'string' ? msg : msg.body;
					
					// Reading delay based on message length
					const readDelay = Math.max(content.length * 30, 800) + Math.random() * 2000;
					await new Promise(resolve => setTimeout(resolve, readDelay));
					
					// Simulate typing if message is long enough
					if (content.length > 10) {
						const typingTime = Math.max(content.length * 60, 1000) + Math.random() * 2000;
						
						try {
							const typing = api.sendTypingIndicator(threadID);
							setTimeout(() => typing.end(), typingTime);
							await new Promise(resolve => setTimeout(resolve, typingTime));
						} catch (err) {
							// Typing failed, continue anyway
						}
					}
				}
				
				// Send the actual message
				const result = await originalSendMessage(msg, threadID, callback, replyToMessage, isGroup);
				resolve(result);
				
				// Natural delay between messages
				const betweenDelay = 1000 + Math.random() * 3000;
				await new Promise(resolve => setTimeout(resolve, betweenDelay));
				
			} catch (error) {
				reject(error);
			}
		}
		
		isProcessing = false;
	}
	
	return function enhancedSendMessage(msg, threadID, callback, replyToMessage, isGroup) {
		// Check if human mode is enabled
		const isHumanMode = ctx.humanBehavior && ctx.humanBehavior.isHumanMode;
		
		if (!isHumanMode) {
			// Robot mode: use original function
			return originalSendMessage(msg, threadID, callback, replyToMessage, isGroup);
		}
		
		// Human mode: add to queue for sequential processing
		return new Promise((resolve, reject) => {
			messageQueue.push({
				msg,
				threadID,
				callback,
				replyToMessage,
				isGroup,
				resolve,
				reject
			});
			
			processHumanQueue();
		});
	};
};
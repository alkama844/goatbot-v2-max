// Enhanced utils for human behavior
global.utils.messageProcessor = {
	humanMode: false,
	
	setMode: function(isHuman) {
		this.humanMode = isHuman;
		global.utils.log.info("MESSAGE_PROCESSOR", `Mode set to: ${isHuman ? "HUMAN" : "ROBOT"}`);
	},
	
	async processMessage(messageData, api) {
		if (this.humanMode) {
			return await this.processHumanMessage(messageData, api);
		} else {
			return await this.processRobotMessage(messageData, api);
		}
	},
	
	async processHumanMessage(messageData, api) {
		const { threadID, content, type } = messageData;
		
		// Simulate human reading
		const readTime = Math.max(content.length * 40, 1000) + Math.random() * 2000;
		await new Promise(resolve => setTimeout(resolve, readTime));
		
		// Simulate thinking
		await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 2000));
		
		// Simulate typing
		const typing = api.sendTypingIndicator(threadID);
		const typingTime = Math.max(content.length * 80, 1500) + Math.random() * 3000;
		
		setTimeout(() => {
			typing.end();
		}, typingTime);
		
		await new Promise(resolve => setTimeout(resolve, typingTime));
		
		return api.sendMessage(content, threadID);
	},
	
	async processRobotMessage(messageData, api) {
		const { threadID, content } = messageData;
		return api.sendMessage(content, threadID);
	}
};

// Enhanced message handler for human vs robot mode
global.utils.enhancedMessageHandler = {
	humanQueue: [], // Queue for human mode sequential processing
	robotQueue: [], // Queue for robot mode batch processing
	isProcessing: false,
	
	async addToQueue(messageData, mode = 'auto') {
		const isHumanMode = mode === 'human' || 
			(mode === 'auto' && global.GoatBot.fcaApi.getHumanBehaviorStats?.()?.isHumanMode);
		
		if (isHumanMode) {
			this.humanQueue.push(messageData);
			if (!this.isProcessing) {
				this.processHumanQueue();
			}
		} else {
			this.robotQueue.push(messageData);
			if (!this.isProcessing) {
				this.processRobotQueue();
			}
		}
	},
	
	async processHumanQueue() {
		if (this.humanQueue.length === 0 || this.isProcessing) return;
		
		this.isProcessing = true;
		
		while (this.humanQueue.length > 0) {
			const messageData = this.humanQueue.shift();
			
			try {
				// Human-like processing with delays
				await this.executeWithHumanBehavior(messageData);
				
				// Natural delay between messages (1-5 seconds)
				const delay = 1000 + Math.random() * 4000;
				await new Promise(resolve => setTimeout(resolve, delay));
				
			} catch (err) {
				console.log("Human queue processing error:", err);
			}
		}
		
		this.isProcessing = false;
	},
	
	async processRobotQueue() {
		if (this.robotQueue.length === 0 || this.isProcessing) return;
		
		this.isProcessing = true;
		
		// Process in batches of 5 for robot mode
		while (this.robotQueue.length > 0) {
			const batch = this.robotQueue.splice(0, 5);
			
			try {
				await Promise.all(batch.map(messageData => 
					this.executeMessage(messageData)
				));
				
				// Small delay between batches
				if (this.robotQueue.length > 0) {
					await new Promise(resolve => setTimeout(resolve, 100));
				}
				
			} catch (err) {
				console.log("Robot queue processing error:", err);
			}
		}
		
		this.isProcessing = false;
	},
	
	async executeWithHumanBehavior(messageData) {
		const { api, threadID, messageContent, type = 'text' } = messageData;
		
		try {
			// Simulate reading delay
			const readDelay = Math.max(messageContent.length * 50, 500) + Math.random() * 2000;
			await new Promise(resolve => setTimeout(resolve, readDelay));
			
			// Simulate typing
			const typing = api.sendTypingIndicator(threadID);
			const typingTime = Math.max(messageContent.length * 80, 1000) + Math.random() * 2000;
			
			setTimeout(() => {
				typing.end();
				this.executeMessage(messageData);
			}, typingTime);
			
		} catch (err) {
			console.log("Human behavior execution error:", err);
			this.executeMessage(messageData);
		}
	},
	
	async executeMessage(messageData) {
		const { api, threadID, messageContent, callback } = messageData;
		
		try {
			if (typeof messageContent === 'string') {
				api.sendMessage(messageContent, threadID, callback);
			} else {
				api.sendMessage(messageContent, threadID, callback);
			}
		} catch (err) {
			console.log("Message execution error:", err);
			if (callback) callback(err);
		}
	}
};

module.exports = global.utils;
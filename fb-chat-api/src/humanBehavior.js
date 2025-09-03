/**
 * Advanced Human-like behavior module to prevent account suspension
 * Implements realistic delays, patterns, and activity simulation
 */

"use strict";

const utils = require("../utils");
const log = require("npmlog");

class AdvancedHumanBehavior {
	constructor(ctx, api) {
		this.ctx = ctx;
		this.api = api;
		this.lastActivity = Date.now();
		this.messageCount = 0;
		this.sessionStart = Date.now();
		this.typingPatterns = [];
		this.readPatterns = [];
		this.activityLog = [];
		this.isHumanMode = false;
		this.userBehaviorProfile = this.generateUserProfile();
		
		// Advanced timing patterns based on real human behavior
		this.timingPatterns = {
			readDelay: { min: 800, max: 12000, avg: 3500 },
			typingDelay: { min: 300, max: 5000, avg: 1200 },
			responseDelay: { min: 1500, max: 25000, avg: 8000 },
			batchDelay: { min: 50, max: 800, avg: 200 },
			sessionBreak: { min: 180000, max: 2700000, avg: 900000 }, // 3-45 minutes
			scrollDelay: { min: 200, max: 1500, avg: 600 },
			clickDelay: { min: 100, max: 800, avg: 300 }
		};
		
		// Natural language processing patterns
		this.typingSpeed = 45 + Math.random() * 40; // 45-85 WPM
		this.typoRate = 0.02 + Math.random() * 0.05; // 2-7% typo rate
		this.pauseRate = 0.15 + Math.random() * 0.1; // 15-25% pause rate
		
		this.startAdvancedActivitySimulation();
	}

	// Enable/disable human mode
	setHumanMode(enabled) {
		this.isHumanMode = enabled;
		log.info("humanBehavior", `Human mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
		
		if (enabled) {
			this.startHumanBehaviorLoop();
		} else {
			this.stopHumanBehaviorLoop();
		}
	}

	// Generate unique user behavior profile
	generateUserProfile() {
		return {
			activeHours: {
				start: 6 + Math.floor(Math.random() * 4), // 6-10 AM
				end: 22 + Math.floor(Math.random() * 3)   // 22-24 PM
			},
			responseStyle: Math.random() < 0.5 ? 'fast' : 'slow',
			typingStyle: Math.random() < 0.3 ? 'hunt-peck' : 'touch-type',
			readingSpeed: 200 + Math.random() * 100, // 200-300 WPM
			multitaskingLevel: Math.random(), // 0-1 how often user multitasks
			emojiUsage: Math.random() * 0.3, // 0-30% emoji usage
			shortFormPref: Math.random() < 0.4 // prefers short messages
		};
	}

	// Advanced human delay with Gaussian distribution
	getAdvancedHumanDelay(type = 'default') {
		const patterns = this.timingPatterns[type] || { min: 500, max: 2000, avg: 1000 };
		
		// Use Gaussian distribution for more natural delays
		const gaussianDelay = this.gaussianRandom(patterns.avg, patterns.avg / 3);
		const clampedDelay = Math.max(patterns.min, Math.min(patterns.max, gaussianDelay));
		
		// Add contextual modifiers
		const contextMultiplier = this.getContextualMultiplier(type);
		const finalDelay = Math.floor(clampedDelay * contextMultiplier);
		
		return Math.max(50, finalDelay); // Minimum 50ms
	}

	// Gaussian random distribution for natural timing
	gaussianRandom(mean, stdDev) {
		let u = 0, v = 0;
		while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
		while(v === 0) v = Math.random();
		
		const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
		return z * stdDev + mean;
	}

	// Get contextual delay multiplier
	getContextualMultiplier(actionType) {
		const hour = new Date().getHours();
		const dayOfWeek = new Date().getDay();
		const timeSinceLastActivity = Date.now() - this.lastActivity;
		
		let multiplier = 1;
		
		// Time of day factors
		if (hour >= 0 && hour <= 6) multiplier *= 2.5; // Night time slower
		if (hour >= 12 && hour <= 14) multiplier *= 1.3; // Lunch time slightly slower
		if (hour >= 18 && hour <= 20) multiplier *= 1.2; // Dinner time
		
		// Weekend vs weekday
		if (dayOfWeek === 0 || dayOfWeek === 6) multiplier *= 1.4; // Weekends more relaxed
		
		// Activity level
		if (timeSinceLastActivity > 600000) multiplier *= 1.8; // Just came back
		if (timeSinceLastActivity < 10000) multiplier *= 0.7; // Very active
		
		// Recent message count
		const recentMessages = this.activityLog.filter(a => Date.now() - a.timestamp < 300000).length;
		if (recentMessages > 15) multiplier *= 1.5; // Slow down if too active
		
		// User profile factors
		multiplier *= this.userBehaviorProfile.responseStyle === 'slow' ? 1.4 : 0.8;
		
		return multiplier;
	}

	// Simulate advanced typing with realistic patterns
	async simulateAdvancedTyping(threadID, message) {
		if (!this.isHumanMode || !message || typeof message !== 'string') return;
		
		const words = message.split(' ');
		const wordsPerMinute = this.typingSpeed;
		const baseTypingTime = (words.length / wordsPerMinute) * 60000;
		
		try {
			// Random delay before starting to type
			await this.delay(this.getAdvancedHumanDelay('responseDelay'));
			
			// Start typing indicator
			await this.api.setTypingStatus(threadID, true);
			
			// Simulate word-by-word typing with natural pauses
			for (let i = 0; i < words.length; i++) {
				const word = words[i];
				const wordTypingTime = (word.length + 1) * (60000 / wordsPerMinute / 5); // +1 for space
				
				// Add natural variance and pauses
				let actualTypingTime = wordTypingTime * (0.8 + Math.random() * 0.4);
				
				// Longer pauses for punctuation or longer words
				if (word.includes(',') || word.includes('.') || word.includes('!') || word.includes('?')) {
					actualTypingTime *= 1.5;
				}
				if (word.length > 8) {
					actualTypingTime *= 1.2;
				}
				
				// Random typo simulation (backspace and retype)
				if (Math.random() < this.typoRate) {
					await this.delay(actualTypingTime * 0.7);
					await this.api.setTypingStatus(threadID, false);
					await this.delay(300 + Math.random() * 500); // Pause to notice typo
					await this.api.setTypingStatus(threadID, true);
					actualTypingTime *= 1.8; // Extra time to fix typo
				}
				
				// Random thinking pauses
				if (Math.random() < this.pauseRate && i > 0) {
					await this.api.setTypingStatus(threadID, false);
					await this.delay(800 + Math.random() * 2000); // Thinking pause
					await this.api.setTypingStatus(threadID, true);
				}
				
				await this.delay(actualTypingTime);
			}
			
			// Random final pause before sending
			await this.delay(200 + Math.random() * 1000);
			await this.api.setTypingStatus(threadID, false);
			
		} catch (err) {
			log.warn("simulateAdvancedTyping", "Failed to simulate typing:", err);
		}
	}

	// Simulate human reading with eye tracking patterns
	async simulateAdvancedReading(threadID, messageContent, senderInfo) {
		if (!this.isHumanMode) return;
		
		const messageLength = typeof messageContent === 'string' ? messageContent.length : 100;
		const wordCount = typeof messageContent === 'string' ? messageContent.split(' ').length : 20;
		
		// Calculate reading time based on content complexity
		let baseReadTime = (wordCount / this.userBehaviorProfile.readingSpeed) * 60000;
		
		// Adjust for content type
		if (typeof messageContent === 'string') {
			// URLs take longer to process
			if (messageContent.includes('http')) baseReadTime *= 1.4;
			// Questions demand more attention
			if (messageContent.includes('?')) baseReadTime *= 1.2;
			// All caps might indicate urgency, read faster
			if (messageContent === messageContent.toUpperCase()) baseReadTime *= 0.8;
		}
		
		// Relationship factor (read friends' messages faster)
		const relationshipFactor = this.getRelationshipFactor(senderInfo);
		baseReadTime *= relationshipFactor;
		
		// Add natural variance
		const readTime = baseReadTime * (0.6 + Math.random() * 0.8);
		
		await this.delay(Math.max(500, readTime));
		
		// Mark as read with human-like probability
		if (Math.random() < 0.85) { // 85% chance to mark as read
			try {
				await this.api.markAsRead(threadID);
			} catch (err) {
				log.warn("simulateAdvancedReading", "Failed to mark as read:", err);
			}
		}
	}

	// Get relationship factor for reading speed
	getRelationshipFactor(senderInfo) {
		// This would ideally use historical data
		// For now, use random factors to simulate different relationships
		return 0.7 + Math.random() * 0.6; // 0.7x to 1.3x speed
	}

	// Simulate device switching and mobility
	async simulateDeviceChanges() {
		if (!this.isHumanMode) return;
		
		// Randomly simulate switching between devices
		if (Math.random() < 0.1) { // 10% chance every check
			const devices = ['mobile', 'desktop', 'tablet'];
			const currentDevice = devices[Math.floor(Math.random() * devices.length)];
			
			// Update user agent based on device
			this.updateUserAgent(currentDevice);
			
			// Simulate network change delay
			await this.delay(2000 + Math.random() * 5000);
		}
	}

	// Update user agent to simulate device switching
	updateUserAgent(deviceType) {
		const userAgents = {
			mobile: [
				'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
				'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
				'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
			],
			desktop: [
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0'
			],
			tablet: [
				'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
			]
		};
		
		const agents = userAgents[deviceType];
		if (agents && this.ctx.globalOptions) {
			this.ctx.globalOptions.userAgent = agents[Math.floor(Math.random() * agents.length)];
		}
	}

	// Simulate natural conversation patterns
	async simulateConversationFlow(threadID, messageType = 'response') {
		if (!this.isHumanMode) return;
		
		const conversationPatterns = {
			greeting: { readTime: 0.5, responseChance: 0.9, typingTime: 0.7 },
			question: { readTime: 1.2, responseChance: 0.95, typingTime: 1.5 },
			response: { readTime: 0.8, responseChance: 0.7, typingTime: 1.0 },
			goodbye: { readTime: 0.6, responseChance: 0.8, typingTime: 0.6 },
			casual: { readTime: 0.7, responseChance: 0.6, typingTime: 0.9 }
		};
		
		const pattern = conversationPatterns[messageType] || conversationPatterns.casual;
		
		// Natural reading delay
		const readDelay = this.getAdvancedHumanDelay('readDelay') * pattern.readTime;
		await this.delay(readDelay);
		
		// Chance to respond (not always respond immediately)
		if (Math.random() > pattern.responseChance) {
			return false; // Don't respond this time
		}
		
		return true; // Proceed with response
	}

	// Simulate realistic mouse and keyboard activity
	simulateUserInteractions() {
		return {
			mouse_movements: this.generateMouseMovements(),
			keyboard_activity: this.generateKeyboardActivity(),
			scroll_behavior: this.generateScrollBehavior(),
			focus_changes: this.generateFocusChanges(),
			timestamp: Date.now()
		};
	}

	// Generate realistic mouse movements
	generateMouseMovements() {
		const movements = [];
		const numMovements = 3 + Math.floor(Math.random() * 8);
		
		for (let i = 0; i < numMovements; i++) {
			movements.push({
				x: Math.floor(Math.random() * 1920),
				y: Math.floor(Math.random() * 1080),
				timestamp: Date.now() + (i * (50 + Math.random() * 200))
			});
		}
		
		return movements;
	}

	// Generate keyboard activity patterns
	generateKeyboardActivity() {
		return {
			keystrokes_per_minute: this.typingSpeed + (-5 + Math.random() * 10),
			backspace_frequency: this.typoRate,
			pause_frequency: this.pauseRate,
			caps_lock_usage: Math.random() * 0.05,
			special_chars_usage: Math.random() * 0.1
		};
	}

	// Generate scroll behavior
	generateScrollBehavior() {
		return {
			scroll_speed: 100 + Math.random() * 300,
			scroll_direction: Math.random() < 0.7 ? 'down' : 'up',
			pause_frequency: 0.2 + Math.random() * 0.3,
			smooth_scrolling: Math.random() < 0.8
		};
	}

	// Generate focus change patterns
	generateFocusChanges() {
		return {
			tab_switches: Math.floor(Math.random() * 3),
			window_focus_duration: 30000 + Math.random() * 120000,
			multitasking_level: this.userBehaviorProfile.multitaskingLevel
		};
	}

	// Advanced activity simulation to prevent detection
	startAdvancedActivitySimulation() {
		// Simulate periodic browsing activity
		setInterval(() => {
			if (this.isHumanMode && this.ctx.mqttClient && Math.random() < 0.2) {
				this.simulateBrowsingActivity();
			}
		}, 45000 + Math.random() * 60000); // Every 45-105 seconds

		// Simulate presence variations
		setInterval(() => {
			if (this.isHumanMode && Math.random() < 0.4) {
				this.simulateNaturalPresence();
			}
		}, 30000 + Math.random() * 90000); // Every 30-120 seconds

		// Simulate periodic app switching
		setInterval(() => {
			if (this.isHumanMode && Math.random() < 0.15) {
				this.simulateAppSwitching();
			}
		}, 120000 + Math.random() * 180000); // Every 2-5 minutes
	}

	// Simulate browsing activity
	async simulateBrowsingActivity() {
		try {
			const activities = [
				() => this.simulateThreadListCheck(),
				() => this.simulateProfileView(),
				() => this.simulateNotificationCheck(),
				() => this.simulateSettingsView(),
				() => this.simulateSearchActivity()
			];
			
			const activity = activities[Math.floor(Math.random() * activities.length)];
			await activity();
			
		} catch (err) {
			log.warn("simulateBrowsingActivity", err);
		}
	}

	// Simulate checking thread list
	async simulateThreadListCheck() {
		if (this.ctx.mqttClient) {
			this.ctx.mqttClient.publish("/mark_thread", JSON.stringify({
				action: "check_threads",
				timestamp: Date.now()
			}), { qos: 0 });
		}
		await this.delay(1000 + Math.random() * 3000);
	}

	// Simulate viewing profiles
	async simulateProfileView() {
		// Simulate clicking on a profile
		const interactions = this.simulateUserInteractions();
		await this.delay(2000 + Math.random() * 5000);
	}

	// Simulate checking notifications
	async simulateNotificationCheck() {
		if (this.ctx.mqttClient) {
			this.ctx.mqttClient.publish("/notifications_seen", JSON.stringify({
				timestamp: Date.now()
			}), { qos: 0 });
		}
	}

	// Simulate viewing settings
	async simulateSettingsView() {
		await this.delay(3000 + Math.random() * 7000);
	}

	// Simulate search activity
	async simulateSearchActivity() {
		const searchTerms = ['', 'photos', 'files', 'links'];
		const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
		await this.delay(1000 + Math.random() * 4000);
	}

	// Simulate natural presence patterns
	async simulateNaturalPresence() {
		if (!this.ctx.mqttClient) return;
		
		const presenceStates = ['active', 'idle', 'away'];
		const state = presenceStates[Math.floor(Math.random() * presenceStates.length)];
		
		try {
			this.ctx.mqttClient.publish("/foreground_state", JSON.stringify({
				foreground: state === 'active',
				state: state,
				last_interaction: Date.now(),
				session_id: this.generateSessionId()
			}), { qos: 1 });
		} catch (err) {
			log.warn("simulateNaturalPresence", err);
		}
	}

	// Simulate app switching behavior
	async simulateAppSwitching() {
		await this.delay(500 + Math.random() * 2000);
		
		if (this.ctx.mqttClient) {
			// Simulate going background
			this.ctx.mqttClient.publish("/foreground_state", JSON.stringify({
				foreground: false,
				app_state: 'background',
				timestamp: Date.now()
			}), { qos: 1 });
			
			// Come back after realistic time
			await this.delay(5000 + Math.random() * 20000);
			
			this.ctx.mqttClient.publish("/foreground_state", JSON.stringify({
				foreground: true,
				app_state: 'active',
				timestamp: Date.now()
			}), { qos: 1 });
		}
	}

	// Generate realistic session IDs
	generateSessionId() {
		return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}

	// Advanced request rate limiting
	async rateLimit(requestType = 'default') {
		const limits = {
			message: { max: 60, window: 60000 }, // 60 messages per minute
			reaction: { max: 100, window: 60000 }, // 100 reactions per minute
			read: { max: 200, window: 60000 }, // 200 read marks per minute
			typing: { max: 120, window: 60000 }, // 120 typing events per minute
			default: { max: 80, window: 60000 }
		};
		
		const limit = limits[requestType] || limits.default;
		const recentRequests = this.activityLog.filter(
			activity => activity.type === requestType && 
			Date.now() - activity.timestamp < limit.window
		).length;
		
		if (recentRequests >= limit.max) {
			const waitTime = limit.window - (Date.now() - this.activityLog[0].timestamp);
			await this.delay(waitTime);
		}
	}

	// Implement smart batching for multiple operations
	async smartBatch(operations, maxBatchSize = 5) {
		if (!this.isHumanMode) {
			// Execute all immediately in robot mode
			return Promise.all(operations);
		}
		
		const batches = [];
		for (let i = 0; i < operations.length; i += maxBatchSize) {
			batches.push(operations.slice(i, i + maxBatchSize));
		}
		
		const results = [];
		for (let i = 0; i < batches.length; i++) {
			const batchResults = await Promise.all(batches[i]);
			results.push(...batchResults);
			
			// Human-like delay between batches
			if (i < batches.length - 1) {
				await this.delay(this.getAdvancedHumanDelay('batchDelay'));
			}
		}
		
		return results;
	}

	// Start human behavior loop
	startHumanBehaviorLoop() {
		this.humanBehaviorInterval = setInterval(async () => {
			await this.runHumanBehaviorCycle();
		}, 60000 + Math.random() * 120000); // Every 1-3 minutes
	}

	// Stop human behavior loop
	stopHumanBehaviorLoop() {
		if (this.humanBehaviorInterval) {
			clearInterval(this.humanBehaviorInterval);
			this.humanBehaviorInterval = null;
		}
	}

	// Run complete human behavior cycle
	async runHumanBehaviorCycle() {
		if (!this.isHumanMode) return;
		
		try {
			// Check if we should take a break
			if (this.shouldTakeAdvancedBreak()) {
				await this.takeAdvancedSessionBreak();
			}
			
			// Simulate device changes
			await this.simulateDeviceChanges();
			
			// Random browsing activity
			if (Math.random() < 0.3) {
				await this.simulateBrowsingActivity();
			}
			
			// Update activity patterns
			this.updateActivityPatterns();
			
		} catch (err) {
			log.warn("runHumanBehaviorCycle", err);
		}
	}

	// Advanced break detection
	shouldTakeAdvancedBreak() {
		const sessionTime = Date.now() - this.sessionStart;
		const recentActivity = this.activityLog.filter(
			activity => Date.now() - activity.timestamp < 300000 // 5 minutes
		).length;
		
		const hour = new Date().getHours();
		const { activeHours } = this.userBehaviorProfile;
		
		// Force break outside active hours
		if (hour < activeHours.start || hour > activeHours.end) return true;
		
		// Break if too much activity
		if (recentActivity > 30) return true;
		
		// Break if long session
		if (sessionTime > 1800000) return true; // 30 minutes
		
		// Random natural breaks
		return Math.random() < 0.1; // 10% chance
	}

	// Advanced session break with realistic patterns
	async takeAdvancedSessionBreak() {
		const breakReasons = ['bathroom', 'food', 'work', 'call', 'distraction'];
		const reason = breakReasons[Math.floor(Math.random() * breakReasons.length)];
		
		const breakDurations = {
			bathroom: { min: 180000, max: 600000 }, // 3-10 minutes
			food: { min: 900000, max: 2700000 }, // 15-45 minutes
			work: { min: 1800000, max: 7200000 }, // 30 minutes - 2 hours
			call: { min: 300000, max: 1800000 }, // 5-30 minutes
			distraction: { min: 120000, max: 900000 } // 2-15 minutes
		};
		
		const duration = breakDurations[reason];
		const breakTime = duration.min + Math.random() * (duration.max - duration.min);
		
		log.info("humanBehavior", `Taking ${reason} break for ${Math.floor(breakTime / 60000)} minutes`);
		
		// Set away status
		if (this.ctx.mqttClient) {
			this.ctx.mqttClient.publish("/foreground_state", JSON.stringify({
				foreground: false,
				away_reason: reason,
				timestamp: Date.now()
			}), { qos: 1 });
		}
		
		await this.delay(breakTime);
		
		// Come back online
		if (this.ctx.mqttClient) {
			this.ctx.mqttClient.publish("/foreground_state", JSON.stringify({
				foreground: true,
				return_reason: 'back_from_' + reason,
				timestamp: Date.now()
			}), { qos: 1 });
		}
		
		this.sessionStart = Date.now();
		this.messageCount = 0;
		this.activityLog = [];
	}

	// Update activity patterns based on usage
	updateActivityPatterns() {
		const recentActivity = this.activityLog.slice(-20);
		
		// Adjust typing speed based on recent activity
		if (recentActivity.filter(a => a.type === 'typing').length > 10) {
			this.typingSpeed *= 0.95; // Slow down if typing a lot
		}
		
		// Adjust pause rate
		if (recentActivity.length > 15) {
			this.pauseRate = Math.min(0.4, this.pauseRate * 1.1); // More pauses when busy
		}
	}

	// Anti-detection headers rotation
	getAntiDetectionHeaders(baseHeaders) {
		const now = Date.now();
		const hour = new Date().getHours();
		
		// Rotate headers periodically
		const headerVariations = {
			'Accept': [
				'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
				'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
			],
			'Accept-Encoding': [
				'gzip, deflate, br',
				'gzip, deflate',
				'gzip, deflate, br, zstd'
			],
			'Cache-Control': [
				'no-cache',
				'max-age=0',
				'no-cache, no-store, must-revalidate'
			],
			'DNT': ['1', '0'],
			'Upgrade-Insecure-Requests': ['1'],
			'Sec-Fetch-Dest': ['document', 'empty', 'script'],
			'Sec-Fetch-Mode': ['navigate', 'cors', 'no-cors'],
			'Sec-Fetch-Site': ['same-origin', 'cross-site', 'none']
		};
		
		const headers = { ...baseHeaders };
		
		// Apply variations based on time and activity
		Object.keys(headerVariations).forEach(key => {
			if (Math.random() < 0.4) {
				const options = headerVariations[key];
				headers[key] = options[Math.floor(Math.random() * options.length)];
			}
		});
		
		// Add timing-based headers
		headers['X-Requested-With'] = Math.random() < 0.3 ? 'XMLHttpRequest' : undefined;
		headers['Pragma'] = hour < 8 || hour > 22 ? 'no-cache' : undefined;
		
		return Object.fromEntries(
			Object.entries(headers).filter(([_, value]) => value !== undefined)
		);
	}

	// Simulate network conditions
	simulateNetworkConditions() {
		const conditions = ['wifi', '4g', '5g', 'ethernet'];
		const condition = conditions[Math.floor(Math.random() * conditions.length)];
		
		const networkPatterns = {
			wifi: { latency: 10, jitter: 5, stability: 0.95 },
			'4g': { latency: 50, jitter: 20, stability: 0.85 },
			'5g': { latency: 20, jitter: 10, stability: 0.90 },
			ethernet: { latency: 5, jitter: 2, stability: 0.98 }
		};
		
		return networkPatterns[condition];
	}

	// Add network delay simulation
	async simulateNetworkDelay() {
		if (!this.isHumanMode) return;
		
		const network = this.simulateNetworkConditions();
		const networkDelay = network.latency + (Math.random() * network.jitter);
		
		// Simulate packet loss/retry
		if (Math.random() > network.stability) {
			await this.delay(networkDelay * 3); // Retry delay
		} else {
			await this.delay(networkDelay);
		}
	}

	// Wrap API calls with human behavior
	async wrapApiCall(apiFunction, ...args) {
		if (!this.isHumanMode) {
			return apiFunction(...args);
		}
		
		// Add pre-call delay
		await this.addActionDelay();
		
		// Add network simulation
		await this.simulateNetworkDelay();
		
		// Rate limiting
		await this.rateLimit(apiFunction.name);
		
		try {
			const result = await apiFunction(...args);
			
			// Add post-call delay
			await this.delay(100 + Math.random() * 300);
			
			return result;
		} catch (err) {
			// Simulate human error recovery
			if (Math.random() < 0.3) {
				await this.delay(2000 + Math.random() * 5000);
				throw err; // Retry would happen at higher level
			}
			throw err;
		}
	}

	// Utility delay function with natural variance
	async delay(baseMs) {
		const variance = 0.8 + Math.random() * 0.4; // ±20% variance
		const actualDelay = Math.floor(baseMs * variance);
		return new Promise(resolve => setTimeout(resolve, Math.max(10, actualDelay)));
	}

	// Get current behavior stats
	getBehaviorStats() {
		return {
			isHumanMode: this.isHumanMode,
			sessionDuration: Date.now() - this.sessionStart,
			messageCount: this.messageCount,
			activityLevel: this.activityLog.length,
			userProfile: this.userBehaviorProfile,
			lastActivity: this.lastActivity
		};
	}
}

module.exports = AdvancedHumanBehavior;
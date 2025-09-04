const axios = require("axios");

/**
 * Enhanced cookie validation with better error handling and multiple validation methods
 * @param {string} cookie Cookie string as `c_user=123;xs=123;datr=123;` format
 * @param {string} userAgent User agent string
 * @returns {Promise<Boolean>} True if cookie is valid, false if not
 */
module.exports = async function (cookie, userAgent) {
	try {
		// Check for essential cookie components first
		const hasEssentialCookies = cookie.includes('c_user=') && 
			cookie.includes('xs=') && 
			cookie.includes('datr=');

		if (!hasEssentialCookies) {
			console.log("Cookie missing essential fields (c_user, xs, datr)");
			return false;
		}

		// Extract user ID from cookie for validation
		const userIdMatch = cookie.match(/c_user=(\d+)/);
		if (!userIdMatch) {
			console.log("No valid c_user found in cookie");
			return false;
		}
		const userId = userIdMatch[1];

		const defaultUserAgent = userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
		let response;

		// Try multiple endpoints for validation
		const endpoints = [
			'https://m.facebook.com/me',
			'https://m.facebook.com/',
			'https://www.facebook.com/me'
		];

		let lastError = null;
		for (const endpoint of endpoints) {
			try {
				response = await axios.get(endpoint, {
					headers: {
						'Cookie': cookie,
						'User-Agent': defaultUserAgent,
						'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
						'Accept-Language': 'en-US,en;q=0.9',
						'Accept-Encoding': 'gzip, deflate, br',
						'DNT': '1',
						'Connection': 'keep-alive',
						'Upgrade-Insecure-Requests': '1',
						'Sec-Fetch-Dest': 'document',
						'Sec-Fetch-Mode': 'navigate',
						'Sec-Fetch-Site': 'none',
						'Cache-Control': 'max-age=0'
					},
					timeout: 15000,
					maxRedirects: 3,
					validateStatus: function (status) {
						return status < 500; // Accept any status less than 500
					}
				});
				break; // Success, exit loop
			} catch (error) {
				lastError = error;
				console.log(`Endpoint ${endpoint} failed:`, error.message);
				continue; // Try next endpoint
			}
		}

		if (!response) {
			// All endpoints failed, check if it's a network issue
			if (lastError && (
				lastError.code === 'ECONNRESET' || 
				lastError.code === 'ETIMEDOUT' || 
				lastError.code === 'ENOTFOUND' ||
				lastError.code === 'ECONNREFUSED' ||
				lastError.message.includes('timeout') ||
				lastError.message.includes('network'))) {
				console.log("All endpoints failed due to network issues, assuming cookie is valid");
				return true;
			}
			throw lastError;
		}

		// Comprehensive validation of response
		const responseText = (response.data || '').toString().toLowerCase();
		const status = response.status;

		// Check for definitive authentication failures
		if (status === 401 || status === 403) {
			console.log("Authentication failed - HTTP", status);
			return false;
		}

		// Check for login redirects or security challenges
		if (responseText.includes('login_form') || 
			responseText.includes('checkpoint') || 
			responseText.includes('security_check') ||
			responseText.includes('verify_account') ||
			responseText.includes('two_factor') ||
			responseText.includes('password_reset') ||
			responseText.includes('account_recovery') ||
			responseText.includes('suspended')) {
			console.log("Cookie validation failed - redirected to login/security page");
			return false;
		}

		// Positive indicators of successful authentication
		const positiveIndicators = [
			userId,
			`"id":"${userId}"`,
			`"userid":"${userId}"`,
			`user_id=${userId}`,
			'timeline',
			'newsfeed',
			'messenger',
			'profile',
			'home.php',
			'feed',
			'notifications',
			'messages',
			'fb_dtsg',
			'__user',
			'__req',
			'__rev',
			'navigation',
			'composer',
			'_9ay',
			'_li',
			'_1t-',
			'userContent'
		];

		const hasPositiveIndicator = positiveIndicators.some(indicator => 
			responseText.includes(indicator.toLowerCase())
		);

		if (hasPositiveIndicator) {
			console.log("Cookie validation successful - positive indicators found");
			return true;
		}

		// If status is 200 and no negative indicators, consider valid
		if (status === 200 && responseText.length > 1000) {
			console.log("Cookie validation successful - HTTP 200 with substantial content");
			return true;
		}

		console.log("Cookie validation uncertain - no clear indicators");
		return false;

	} catch (e) {
		console.log("Cookie validation error:", e.message);

		// Enhanced error handling
		if (e.response) {
			const status = e.response.status;
			const responseText = (e.response.data || '').toString().toLowerCase();

			// Check specific error responses
			if (status === 401 || status === 403) {
				return false; // Definitely invalid
			}

			if (responseText.includes('login') || responseText.includes('checkpoint') || responseText.includes('suspended')) {
				return false; // Definitely invalid
			}
		}

		// Network errors - be more lenient to avoid false negatives
		if (e.code === 'ECONNRESET' || 
			e.code === 'ETIMEDOUT' || 
			e.code === 'ENOTFOUND' ||
			e.code === 'ECONNREFUSED' ||
			e.code === 'ENOTFOUND' ||
			e.message.includes('timeout') ||
			e.message.includes('network') ||
			e.message.includes('socket') ||
			e.message.includes('connect')) {
			console.log("Network error during cookie validation, assuming valid to avoid false negatives");
			return true;
		}

		// For parsing or other errors, assume invalid but log for debugging
		console.log("Cookie validation failed with error:", e.message);
		return false;
	}
};

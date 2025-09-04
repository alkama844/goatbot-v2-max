const axios = require("axios");

/**
 * Enhanced cookie validation with better error handling and multiple validation methods
 * @param {string} cookie Cookie string as `c_user=123;xs=123;datr=123;` format
 * @param {string} userAgent User agent string
 * @returns {Promise<Boolean>} True if cookie is valid, false if not
 */
module.exports = async function (cookie, userAgent) {
	try {
		// Enhanced cookie validation with multiple endpoints and better error handling
		let response;
		const defaultUserAgent = userAgent || 'Mozilla/5.0 (Linux; Android 12; M2102J20SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Mobile Safari/537.36';
		
		// First, try the mobile endpoint
		try {
			response = await axios.get('https://m.facebook.com/me', {
				headers: {
					'Cookie': cookie,
					'User-Agent': defaultUserAgent,
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
					'Accept-Language': 'en-US,en;q=0.5',
					'Accept-Encoding': 'gzip, deflate',
					'DNT': '1',
					'Connection': 'keep-alive',
					'Upgrade-Insecure-Requests': '1'
				},
				timeout: 15000,
				maxRedirects: 3,
				validateStatus: function (status) {
					return status < 500; // Accept any status less than 500
				}
			});
		} catch (primaryError) {
			console.log("Primary endpoint failed, trying alternative...");
			// Try alternative endpoint if primary fails
			try {
				response = await axios.get('https://www.facebook.com/me', {
					headers: {
						'Cookie': cookie,
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
						'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
						'Accept-Language': 'en-US,en;q=0.9',
						'Accept-Encoding': 'gzip, deflate, br',
						'DNT': '1',
						'Connection': 'keep-alive',
						'Upgrade-Insecure-Requests': '1',
						'Sec-Fetch-Dest': 'document',
						'Sec-Fetch-Mode': 'navigate',
						'Sec-Fetch-Site': 'none'
					},
					timeout: 15000,
					maxRedirects: 3,
					validateStatus: function (status) {
						return status < 500;
					}
				});
			} catch (secondaryError) {
				// Try a simple check endpoint
				response = await axios.get('https://m.facebook.com/', {
					headers: {
						'Cookie': cookie,
						'User-Agent': defaultUserAgent
					},
					timeout: 10000,
					validateStatus: function (status) {
						return status < 500;
					}
				});
			}
		}
		
		// More comprehensive validation
		const responseText = response.data.toLowerCase();
		
		// Check for obvious login failures
		if (response.status === 302 || response.status === 401) {
			return false;
		}
		
		// Check for login redirects or error pages
		if (responseText.includes('login_form') || 
			responseText.includes('checkpoint') || 
			responseText.includes('security_check') ||
			responseText.includes('verify_account') ||
			responseText.includes('two_factor') ||
			responseText.includes('password_reset')) {
			return false;
		}
		
		// Extract and verify user ID from cookie
		const userIdMatch = cookie.match(/c_user=(\d+)/);
		if (userIdMatch && userIdMatch[1]) {
			const userId = userIdMatch[1];
			// Check if user ID appears in response (indicates successful auth)
			if (responseText.includes(userId) || 
				responseText.includes(`"id":"${userId}"`) ||
				responseText.includes(`"userid":"${userId}"`) ||
				responseText.includes(`user_id=${userId}`)) {
				return true;
			}
		}
		
		// Check for Facebook-specific content that indicates successful login
		if (responseText.includes('timeline') || 
			responseText.includes('newsfeed') || 
			responseText.includes('messenger') ||
			responseText.includes('profile') ||
			responseText.includes('home.php') ||
			responseText.includes('feed') ||
			responseText.includes('notifications') ||
			responseText.includes('messages')) {
			return true;
		}
		
		// Check for presence of essential Facebook elements
		if (responseText.includes('fb_dtsg') ||
			responseText.includes('__user') ||
			responseText.includes('__req') ||
			responseText.includes('__rev')) {
			return true;
		}
		
		// If we get here and no obvious failures, assume valid
		return response.status === 200;
		
	} catch (e) {
		console.log("Cookie validation error:", e.message);
		
		// Enhanced error handling
		if (e.response) {
			const status = e.response.status;
			const responseText = e.response.data ? e.response.data.toString().toLowerCase() : '';
			
			// Check specific error responses
			if (status === 401 || status === 403) {
				return false; // Definitely invalid
			}
			
			if (responseText.includes('login') || responseText.includes('checkpoint')) {
				return false; // Definitely invalid
			}
		}
		
		// Network errors - be more lenient
		if (e.code === 'ECONNRESET' || 
			e.code === 'ETIMEDOUT' || 
			e.code === 'ENOTFOUND' ||
			e.code === 'ECONNREFUSED' ||
			e.message.includes('timeout') ||
			e.message.includes('network')) {
			console.log("Network error during cookie validation, assuming valid to avoid false negatives");
			return true;
		}
		
		// For other errors, be conservative but not too strict
		console.log("Unknown error during validation, assuming invalid");
		return false;
	}
};
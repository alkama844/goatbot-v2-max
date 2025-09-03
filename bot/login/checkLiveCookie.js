const axios = require("axios");
/**
 * 
 * @param {string} cookie Cookie string as `c_user=123;xs=123;datr=123;` format
 * @param {string} userAgent User agent string
 * @returns {Promise<Boolean>} True if cookie is valid, false if not
 */
module.exports = async function (cookie, userAgent) {
	try {
		// Enhanced cookie validation with multiple endpoints
		let response;
		try {
			response = await axios.get('https://m.facebook.com/me', {
				headers: {
					'Cookie': cookie,
					'User-Agent': userAgent || 'Mozilla/5.0 (Linux; Android 12; M2102J20SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Mobile Safari/537.36'
				},
				timeout: 15000,
				validateStatus: function (status) {
					return status < 500;
				}
			});
		} catch (primaryError) {
			// Try alternative endpoint if primary fails
			response = await axios.get('https://www.facebook.com/me', {
				headers: {
					'Cookie': cookie,
					'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
				},
				timeout: 15000,
				validateStatus: function (status) {
					return status < 500;
				}
			});
		}
		
		// More comprehensive validation
		const responseText = response.data.toLowerCase();
		
		// Check for login redirects or error pages
		if (responseText.includes('login') || 
			responseText.includes('checkpoint') || 
			responseText.includes('security') ||
			responseText.includes('verify') ||
			response.status === 302 ||
			response.status === 401) {
			return false;
		}
		
		// Extract and verify user ID from cookie
		const userIdMatch = cookie.match(/c_user=(\d+)/);
		if (userIdMatch && userIdMatch[1]) {
			// Check if user ID appears in response (indicates successful auth)
			const userId = userIdMatch[1];
			if (responseText.includes(userId) || responseText.includes(`"id":"${userId}"`)) {
				return true;
			}
		}
		
		// Check for Facebook-specific content that indicates successful login
		if (responseText.includes('timeline') || 
			responseText.includes('newsfeed') || 
			responseText.includes('messenger') ||
			responseText.includes('profile')) {
			return true;
		}
		
		return false;
	}
	catch (e) {
		console.log("Cookie validation error:", e.message);
		// If there's a network error, assume cookie might be valid to avoid unnecessary re-auth
		if (e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT' || e.code === 'ENOTFOUND') {
			console.log("Network error during cookie validation, assuming valid");
			return true;
		}
		// For other errors, assume invalid
		return false;
	}
};
			headers: {
				'Cookie': cookie,
				'User-Agent': userAgent || 'Mozilla/5.0 (Linux; Android 12; M2102J20SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Mobile Safari/537.36'
			},
			timeout: 10000,
			validateStatus: function (status) {
				return status < 500; // Accept any status less than 500
			}
		});
		
		// Check if response contains user ID or login page
		if (response.data.includes('login') || response.data.includes('checkpoint')) {
			return false;
		}
		
		// Extract user ID from cookie to verify it exists in response
		const userIdMatch = cookie.match(/c_user=(\d+)/);
		if (userIdMatch && userIdMatch[1]) {
			return response.data.includes(userIdMatch[1]);
		}
		
		return true;
	}
	catch (e) {
		// If there's a network error or timeout, assume cookie might still be valid
		// to avoid unnecessary re-authentication
		if (e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT') {
			return true;
		}
		return true;
	}
};

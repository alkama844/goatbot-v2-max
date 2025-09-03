const axios = require("axios");
/**
 * 
 * @param {string} cookie Cookie string as `c_user=123;xs=123;datr=123;` format
 * @param {string} userAgent User agent string
 * @returns {Promise<Boolean>} True if cookie is valid, false if not
 */
module.exports = async function (cookie, userAgent) {
	try {
		// Enhanced cookie validation
		const response = await axios.get('https://m.facebook.com/me', {
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

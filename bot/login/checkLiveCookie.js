const axios = require("axios");
/**
 * 
 * @param {string} cookie Cookie string as `c_user=123;xs=123;datr=123;` format
 * @param {string} userAgent User agent string
 * @returns {Promise<Boolean>} True if cookie is valid, false if not
 */
module.exports = async function (cookie, userAgent) {
	try {
		// Add more robust headers to avoid detection
		const headers = {
			cookie,
			"user-agent": userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
			"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
			"accept-language": "en-US,en;q=0.9",
			"accept-encoding": "gzip, deflate, br",
			"sec-ch-ua": '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-platform": '"Windows"',
			"sec-fetch-dest": "document",
			"sec-fetch-mode": "navigate",
			"sec-fetch-site": "none",
			"sec-fetch-user": "?1",
			"upgrade-insecure-requests": "1",
			"cache-control": "max-age=0"
		};
		
		const response = await axios({
			url: 'https://mbasic.facebook.com/',
			method: "GET",
			headers,
			timeout: 15000,
			maxRedirects: 3,
			validateStatus: function (status) {
				return status < 500; // Accept any status code less than 500
			}
		});
		
		// More comprehensive validation
		const body = response.data.toLowerCase();
		const isLoggedIn = body.includes('home.php') || 
			body.includes('timeline') || 
			body.includes('newsfeed') ||
			body.includes('fb_dtsg') ||
			body.includes('__user') ||
			body.includes('profile.php') ||
			!body.includes('login');
			
		// Check for specific error indicators
		const hasErrors = body.includes('checkpoint') || 
			body.includes('security') ||
			body.includes('verify your identity') ||
			body.includes('account disabled') ||
			response.status === 404;
			
		return isLoggedIn && !hasErrors;
	}
	catch (e) {
		// Network errors should not be treated as invalid cookies
		if (e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT' || e.code === 'ENOTFOUND') {
			log.warn("checkLiveCookie", "Network error during cookie validation:", e.message);
			return true; // Assume cookies are valid if we can't check due to network issues
		}
		return false;
	}
};

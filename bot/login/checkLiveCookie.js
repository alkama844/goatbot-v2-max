const axios = require("axios");
/**
 * 
 * @param {string} cookie Cookie string as `c_user=123;xs=123;datr=123;` format
 * @param {string} userAgent User agent string
 * @returns {Promise<Boolean>} True if cookie is valid, false if not
 */
module.exports = async function (cookie, userAgent) {
	try {
		// Enhanced headers with better anti-detection
		const headers = {
			cookie,
			"user-agent": userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
			"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
			"accept-language": "en-US,en;q=0.9",
			"accept-encoding": "gzip, deflate, br",
			"sec-ch-ua": '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-platform": '"Windows"',
			"sec-fetch-dest": "document",
			"sec-fetch-mode": "navigate",
			"sec-fetch-site": "none",
			"sec-fetch-user": "?1",
			"upgrade-insecure-requests": "1",
			"cache-control": "max-age=0",
			"pragma": "no-cache"
		};
		
		const response = await axios({
			url: 'https://m.facebook.com/',
			method: "GET",
			headers,
			timeout: 20000,
			maxRedirects: 3,
			decompress: true,
			validateStatus: function (status) {
				return status < 500;
			}
		});
		
		// Enhanced validation with better detection
		const body = response.data.toLowerCase();
		
		// Check for positive authentication indicators
		const positiveIndicators = [
			'home.php', 'timeline', 'newsfeed', 'fb_dtsg', '__user', 
			'profile.php', 'messenger', 'notifications', 'menu'
		];
		const hasPositiveIndicator = positiveIndicators.some(indicator => body.includes(indicator));
		
		// Check for negative indicators (login/error pages)
		const negativeIndicators = [
			'login', 'checkpoint', 'security', 'verify your identity', 
			'account disabled', 'suspended', 'blocked', 'restricted'
		];
		const hasNegativeIndicator = negativeIndicators.some(indicator => body.includes(indicator));
			
		// Additional checks
		const isError404 = response.status === 404;
		const isRedirect = response.status >= 300 && response.status < 400;
		const bodyTooShort = body.length < 1000; // Suspicious if too short
			
		// Determine if logged in
		const isLoggedIn = hasPositiveIndicator && !hasNegativeIndicator && !isError404 && !bodyTooShort;
		
		if (!isLoggedIn) {
			console.log("🚨 Cookie validation failed:");
			console.log(`   Status: ${response.status}`);
			console.log(`   Body length: ${body.length}`);
			console.log(`   Has positive indicators: ${hasPositiveIndicator}`);
			console.log(`   Has negative indicators: ${hasNegativeIndicator}`);
			console.log(`   Is redirect: ${isRedirect}`);
		}
		
		return isLoggedIn;
	}
	catch (e) {
		// Enhanced network error handling
		const networkErrorCodes = [
			'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 
			'EHOSTUNREACH', 'ENETUNREACH', 'EAI_AGAIN', 'ECONNABORTED'
		];
		
		if (networkErrorCodes.includes(e.code)) {
			console.log("⚠️ Network error during cookie validation:", e.message);
			console.log("🔄 Assuming cookies are valid due to network issues");
			return true;
		}
		
		// Handle specific HTTP errors
		if (e.response) {
			const status = e.response.status;
			if (status === 404 || status === 403) {
				console.log("🚨 HTTP", status, "- Authentication failed");
				return false;
			}
			if (status >= 500) {
				console.log("⚠️ Facebook server error:", status);
				return true; // Server error, assume cookies are valid
			}
		}
		
		console.log("❌ Cookie validation error:", e.message);
		return false;
	}
};

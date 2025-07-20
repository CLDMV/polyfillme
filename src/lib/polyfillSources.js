const polyfillLibrary = require("polyfill-library");
const fetch = require("node-fetch");

/**
 * Fetches polyfill code for a list of features from the specified source.
 * @param {string[]} features - List of features to polyfill.
 * @param {string} source - Polyfill source ('cloudflare' or 'polyfill-library').
 * @returns {Promise<string>} - Concatenated polyfill code.
 */
async function fetchPolyfillCode(features, source = "polyfill-library") {
	let polyfillContent = "";
	if (source === "cloudflare") {
		for (const feature of features) {
			const url = `https://cdnjs.cloudflare.com/polyfill/feature/${encodeURIComponent(feature)}`;
			const res = await fetch(url);
			polyfillContent += `// Cloudflare polyfill for ${feature}\n` + (await res.text()) + "\n";
		}
	} else {
		// Default to polyfill-library
		const isProd = process.env.NODE_ENV === "production";
		for (let feature of features) {
			// Build candidate names for polyfill-library
			const candidates = [feature];
			if (feature.startsWith("builtins.")) {
				candidates.push(feature.replace("builtins.", ""));
			}
			if (feature.startsWith("Array.")) {
				candidates.push(feature.replace("Array.", "Array.prototype."));
			}
			if (feature.startsWith("Object.")) {
				candidates.push(feature.replace("Object.", "Object.prototype."));
			}
			if (feature === "Promise" || feature === "builtins.Promise") {
				candidates.push("Promise");
			}
			// Try each candidate until one returns a non-empty polyfill
			let code = "";
			let usedName = feature;
			for (const candidate of candidates) {
				code = await polyfillLibrary.getPolyfillString({
					features: { [candidate]: {} },
					minify: isProd,
					production: isProd
				});
				if (code && !code.includes("These features were not recognised")) {
					usedName = candidate;
					break;
				}
			}
			polyfillContent += `// polyfill-library for ${usedName}\n` + code + "\n";
		}
	}
	return polyfillContent;
}

module.exports = {
	fetchPolyfillCode
};

/**
 * Polyfill obtaining methods for polyfillme module.
 * Contains: fetchPolyfillIo, sanitizePolyfillName, generatePolyfillFile
 */
const https = require("https");

function fetchPolyfillIo(url) {
	return new Promise((resolve, reject) => {
		let data = "";
		https
			.get(url, (res) => {
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => resolve(data));
				res.on("error", (err) => reject(err));
			})
			.on("error", (err) => reject(err));
	});
}

function sanitizePolyfillName(name) {
	// Only allow alphanumeric, dot, dash, underscore, and no consecutive dots/dashes/underscores
	if (typeof name !== "string") return "";
	// Remove anything not allowed
	let sanitized = name.replace(/[^a-zA-Z0-9._-]/g, "");
	// Prevent dangerous patterns
	sanitized = sanitized.replace(/([._-])\1+/g, "$1");
	// Remove leading/trailing dots/dashes/underscores
	sanitized = sanitized.replace(/^[._-]+|[._-]+$/g, "");
	return sanitized;
}

const fs = require("fs");
const path = require("path");

/**
 * Generates polyfill output for required features.
 * @async
 * @param {string[]} polyfills - List of polyfills to include.
 * @param {Object} [options] - Output options.
 * @param {boolean} [options.writeToFile=true] - Whether to write to file.
 * @param {string} [options.filePath] - Output file path (default: polyfills.js in project root).
 * @param {string|function} [options.source='core-js'] - Polyfill source ('core-js', 'polyfill.io', or custom function).
 * @returns {Promise<string>} - Polyfill import content or fetched code.
 */
async function generatePolyfillFile(polyfills, options = {}) {
	const source = options.source || "core-js";
	// Sanitize polyfill names for polyfill.io
	let safePolyfills = polyfills;
	if (source === "polyfill.io") {
		safePolyfills = polyfills.map(sanitizePolyfillName).filter(Boolean);
	}
	let polyfillLines;
	let content = "";
	if (source === "core-js") {
		polyfillLines = polyfills.map((f) => `import 'core-js/features/${f.replace(/\./g, "/")}';`);
		content = polyfillLines.join("\n") + "\n";
	} else if (source === "polyfill.io") {
		const url = `https://polyfill.io/v3/polyfill.min.js?features=${safePolyfills.map((f) => encodeURIComponent(f)).join(",")}`;
		let fetched = "";
		try {
			fetched = await fetchPolyfillIo(url);
		} catch (err) {
			throw new Error("Failed to fetch polyfill.io file: " + err.message);
		}
		content = `// Polyfill.io CDN: ${url}\n` + fetched;
		// Output to user if run via command line
		if (require.main === module) {
			console.log(content);
		}
	} else if (typeof source === "function") {
		polyfillLines = polyfills.map((f) => source(f));
		content = polyfillLines.join("\n") + "\n";
	} else {
		throw new Error("Unknown polyfill source: " + source);
	}
	const writeToFile = options.writeToFile !== false;
	const outPath = options.filePath || path.resolve(__dirname, "../../polyfills.js");
	if (writeToFile) {
		try {
			fs.writeFileSync(outPath, content, "utf8");
		} catch (err) {
			throw new Error("Failed to write polyfill file: " + err.message);
		}
	}
	return content;
}

module.exports = {
	fetchPolyfillIo,
	sanitizePolyfillName,
	generatePolyfillFile
};

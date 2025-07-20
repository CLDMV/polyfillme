/**
 * Checks if a string matches any pattern in a filter array (wildcard * supported).
 * @param {string} str - The string to test.
 * @param {string[]} patterns - Array of wildcard patterns (e.g. 'Array*').
 * @returns {boolean} True if str matches any pattern.
 * @example
 * matchesAny('Array.prototype.map', ['Array*']); // true
 */
function matchesAny(str, patterns) {
	if (!patterns || patterns.length === 0 || patterns.some((p) => !p || p.trim() === "")) {
		return true; // Always match if filter is empty or contains empty string
	}
	return patterns.some((pattern) => {
		// Escape regex except for *
		const regex = new RegExp("^" + pattern.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&").replace(/\*/g, ".*") + "$", "i");
		return regex.test(str);
	});
}
// Set your debug filter here. Example: ['Array*', 'Promise*']
const DEBUG_FILTER = ["*Promise*"];

// console.log(matchesAny("Array.prototype.map", ["Array*"]));
// process.exit(0);
/**
 * Script to annotate mdn.es.json with polyfill availability.
 * For each human-readable feature, checks polyfill-library for a polyfill.
 * If found, adds a `polyfill` key to the feature entry in mdn.es.json.
 * Usage: node src/data/scripts/generate-polyfill-availability.js
 */

process.env.NODE_ENV = "production";
const fs = require("fs");
const path = require("path");
const polyfillLibrary = require("polyfill-library");
const { hasRealCode } = require("./hasRealCode");

const mdnPath = path.join(__dirname, "../mdn/mdn.json");
const mdn = JSON.parse(fs.readFileSync(mdnPath, "utf8"));

(async () => {
	let updated = false; // Ensure production mode for polyfill-library
	// const isProd = process.env.NODE_ENV === "production";
	for (const key of Object.keys(mdn)) {
		let foundForKey = 0;
		let mdnKey = mdn[key];
		if (matchesAny(key, DEBUG_FILTER)) {
			console.log(mdnKey);
			// console.log(human);
		}
		// If already an object, get the human property
		let human = [];
		if (typeof mdnKey === "object" && mdnKey.human) {
			human = mdnKey.human;
		}
		human.push(key);
		let humanArr = Array.isArray(human) ? human : [human];
		// console.log(humanArr);
		if (matchesAny(key, DEBUG_FILTER)) {
			console.log(human);
			console.log(humanArr);
		}
		// process.exit(0);
		let foundPolyfill = false;
		mdn[key].polyfill = [];
		for (const h of humanArr) {
			if (matchesAny(key, DEBUG_FILTER)) {
				console.log(`[DEBUG] Checking feature: '${h}' (key: ${key})`);
			}
			const code = await polyfillLibrary.getPolyfillString({
				features: { [h]: {} },
				minify: true,
				production: true
			});
			// Use AST to check for real code
			const isRealPolyfill = code && !code.includes("These features were not recognised") && hasRealCode(code);
			if (isRealPolyfill) {
				if (matchesAny(key, DEBUG_FILTER)) {
					console.log(`[DEBUG] Polyfill found for '${h}'. Code result: `, code.slice(0, 200));
				}
				// const insert = {
				// 	key: h,
				// 	code: code
				// };
				// mdn[key].polyfill.push(insert);
				mdn[key].polyfill.push(h);
				updated = true;
				foundPolyfill = true;
				foundForKey++;
				break;
			}
		}
		
		if ( foundForKey > 0) {
			if (matchesAny(key, DEBUG_FILTER)) {
				console.log(`[DEBUG] Polyfill found for '${key} [${foundForKey}/${humanArr.length}]'.`);
			}
		} else {
			if (matchesAny(key, DEBUG_FILTER)) {
				console.log(`[DEBUG] No real polyfill found for '${key}'.`);
			}
		}
		// if (!foundPolyfill) {
		// 	mdn[esVer][key] = { human: humanArr };
		// }
	}
	if (updated) {
		fs.writeFileSync(mdnPath, JSON.stringify(mdn, null, "\t"));
		console.log("mdn.json updated with polyfill keys.");
	} else {
		console.log("No polyfills found to update.");
	}
})();

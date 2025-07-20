/**
 * Comprehensive test for polyfillme ES2023 feature support.
 * Ensures only ES2023 and earlier features are allowed, and later ones are polyfilled.
 * Uses canonical feature keys from mdn.es.json for validation.
 * @returns {void}
 * @example
 * // Run with Jest
 * jest test/es2023.test.js
 */
/**
 * Comprehensive test for polyfillme ES2023 feature support.
 * Ensures only ES2023 and earlier features are allowed, and later ones are polyfilled.
 * Uses canonical feature keys from mdn.es.json for validation.
 * @returns {void}
 * @example
 * // Run with Jest
 * jest test/es2023.test.js
 */
const polyfillme = require("../src/index");
const mdnEs = require("../src/data/mdn/mdn.es.json");

describe("polyfillme ES2023", () => {
	it("should allow only ES2023 and earlier features, and polyfill later ones", async () => {
		const esVersions = Object.keys(mdnEs);
		const targetIndex = esVersions.indexOf("es2023");
		const allowedVersions = targetIndex >= 0 ? esVersions.slice(0, targetIndex + 1) : ["es2023"];
		const allowedKeys = new Set();
		for (const ver of allowedVersions) {
			for (const k in mdnEs[ver]) {
				allowedKeys.add(mdnEs[ver][k]);
			}
		}
		// Collect all canonical features from all versions
		const allFeatures = [];
		for (const ver of esVersions) {
			for (const k in mdnEs[ver]) {
				allFeatures.push(mdnEs[ver][k]);
			}
		}
		// Simulate usage of all features
		const result = await polyfillme({
			ecmaVersion: "es2023",
			files: ["test/testfile.js"],
			includedPolyfills: [],
			additionalPolyfills: [],
			writeToFile: false
		});
		// All features from ES2023 and earlier should NOT be polyfilled
		for (const feature of allowedKeys) {
			expect(result.polyfills.includes(feature)).toBe(false);
		}
		// All features from later versions should be polyfilled
		for (const ver of esVersions.slice(targetIndex + 1)) {
			for (const k in mdnEs[ver]) {
				const canonical = mdnEs[ver][k];
				expect(result.polyfills.includes(canonical)).toBe(true);
			}
		}
	});
});

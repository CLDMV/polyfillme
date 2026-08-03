/**
 * Comprehensive test for polyfillme ES4 feature support.
 * Ensures only ES4 and earlier features are allowed, and later ones are polyfilled.
 * Uses canonical feature keys from mdn.es.json for validation.
 * @returns {void}
 * @example
 * // Run with Jest
 * jest test/es4.test.js
 */
const polyfillme = require("../src/index");
const mdnEs = require("../src/data/mdn/mdn.es.json");

describe("polyfillme ES4", () => {
	it("should allow only ES4 and earlier features, and polyfill later ones", async () => {
		const esVersions = Object.keys(mdnEs);
		const targetIndex = esVersions.indexOf("es4");
		const allowedVersions = targetIndex >= 0 ? esVersions.slice(0, targetIndex + 1) : ["es4"];
		const allowedKeys = new Set();
		for (const ver of allowedVersions) {
			for (const k in mdnEs[ver]) {
				allowedKeys.add(mdnEs[ver][k]);
			}
		}
		const result = await polyfillme({
			ecmaVersion: "es4",
			files: ["test/testfile.js"],
			includedPolyfills: [],
			additionalPolyfills: [],
			writeToFile: false
		});
		for (const feature of allowedKeys) {
			expect(result.polyfills.includes(feature)).toBe(false);
		}
		const laterKeys = new Set();
		for (const ver of esVersions.slice(targetIndex + 1)) {
			for (const k in mdnEs[ver]) {
				laterKeys.add(mdnEs[ver][k]);
			}
		}
		for (const canonical of result.polyfills) {
			expect(laterKeys.has(canonical)).toBe(true);
		}
	});
});

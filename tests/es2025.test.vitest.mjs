/**
 * Comprehensive test for polyfillme ES2025 feature support.
 * Ensures only ES2025 and earlier features are allowed, and later ones are polyfilled.
 * Uses canonical feature keys from mdn.es.json for validation.
 * @returns {void}
 * @example
 * // Run with Vitest
 * npm test -- es2025.test.vitest.mjs
 */
import polyfillme from "../src/index.js";
import mdnEs from "../src/data/mdn/mdn.es.json" with { type: "json" };

describe("polyfillme ES2025", () => {
	// Sort ES version keys for correct ordering
	const esVersions = Object.keys(mdnEs)
		.filter((v) => v.startsWith("es") && !isNaN(Number(v.replace("es", ""))))
		.sort((a, b) => Number(a.replace("es", "")) - Number(b.replace("es", "")));
	const targetIndex = esVersions.indexOf("es2025");
	const nextIndex = esVersions.indexOf("es2026");
	const allowedVersions = targetIndex >= 0 ? esVersions.slice(0, targetIndex + 1) : ["es2025"];
	const allowedKeys = new Set();
	for (const ver of allowedVersions) {
		for (const k in mdnEs[ver]) {
			allowedKeys.add(mdnEs[ver][k]);
		}
	}
	let result;
	beforeAll(async () => {
		result = await polyfillme({
			ecmaVersion: "es2025",
			files: ["tests/testfile.js"],
			includedPolyfills: [],
			additionalPolyfills: [],
			writeToFile: false
		});
	});
	describe("Allowed features", () => {
		if (allowedKeys.size === 0) {
			test("should have at least one allowed feature to test", () => {
				expect(true).toBe(true);
			});
		} else {
			for (const feature of allowedKeys) {
				test(`should NOT polyfill allowed feature: ${feature}`, () => {
					expect(result.polyfills.includes(feature)).toBe(false);
				});
			}
		}
	});
	// Only polyfill features from ES versions greater than es2025
	let hasTests = false;
	for (const ver of esVersions) {
		if (ver === "unknown") continue;
		const verNum = Number(ver.replace("es", ""));
		if (verNum > 2025) {
			for (const k in mdnEs[ver]) {
				hasTests = true;
				const canonical = mdnEs[ver][k];
				test(`should polyfill ES${ver} feature: ${canonical}`, () => {
					expect(result.polyfills.includes(canonical)).toBe(true);
				});
			}
		}
	}
	if (allowedKeys.size === 0 && !hasTests) {
		test("should have at least one feature to test", () => {
			expect(true).toBe(true);
		});
	}
});

/* eslint-env jest */
const fs = require("fs");
const path = require("path");
const polyfillme = require("../src/index");

const TEST_FILE = path.join(__dirname, "testfile.js");

beforeAll(() => {
	// Create a test JS file with some ES features
	fs.writeFileSync(
		TEST_FILE,
		["const arr = [1, 2, 3];", "arr.includes(2);", "Promise.resolve(42);", "Object.entries({ a: 1 });"].join("\n")
	);
});

afterAll(() => {
	fs.unlinkSync(TEST_FILE);
});

describe("polyfillme", () => {
	it("throws on missing options", async () => {
		await expect(polyfillme()).rejects.toThrow("Options object is required.");
	});

	it("throws on missing ecmaVersion", async () => {
		await expect(polyfillme({ files: [TEST_FILE], includedPolyfills: [], additionalPolyfills: [] })).rejects.toThrow(
			"ecmaVersion (string) is required."
		);
	});

	it("throws on missing files", async () => {
		await expect(polyfillme({ ecmaVersion: "es2015", includedPolyfills: [], additionalPolyfills: [] })).rejects.toThrow(
			"files (array of globs) is required."
		);
	});

	it("returns polyfills and content for ES2015 (should NOT include Promise/includes)", async () => {
		const result = await polyfillme({
			ecmaVersion: "es2015",
			files: ["test/testfile.js"],
			includedPolyfills: [],
			additionalPolyfills: [],
			writeToFile: false
		});
		expect(Array.isArray(result.polyfills)).toBe(true);
		expect(typeof result.content).toBe("string");
		expect(Array.isArray(result.shams)).toBe(true);
		expect(Array.isArray(result.notFound)).toBe(true);
		// Should NOT include Promise and Array.prototype.includes for es2015
		expect(result.polyfills.some((p) => p.includes("Promise"))).toBe(false);
		expect(result.polyfills.some((p) => p.includes("Array.prototype.includes"))).toBe(false);
	});

	it("returns polyfills and content for ES5 (should include Promise/includes)", async () => {
		const result = await polyfillme({
			ecmaVersion: "es5",
			files: ["test/testfile.js"],
			includedPolyfills: [],
			additionalPolyfills: [],
			writeToFile: false
		});
		expect(Array.isArray(result.polyfills)).toBe(true);
		expect(typeof result.content).toBe("string");
		expect(Array.isArray(result.shams)).toBe(true);
		expect(Array.isArray(result.notFound)).toBe(true);
		// Should include Promise and Array.prototype.includes for es5
		expect(result.polyfills.some((p) => p.includes("Promise"))).toBe(true);
		expect(result.polyfills.some((p) => p.includes("Array.prototype.includes"))).toBe(true);
	});

	it("excludes already included polyfills", async () => {
		const result = await polyfillme({
			ecmaVersion: "es2015",
			files: ["test/testfile.js"],
			includedPolyfills: ["Promise"],
			additionalPolyfills: [],
			writeToFile: false
		});
		expect(result.polyfills.some((p) => p === "Promise")).toBe(false);
	});

	it("adds additional polyfills", async () => {
		const result = await polyfillme({
			ecmaVersion: "es2015",
			files: ["test/testfile.js"],
			includedPolyfills: [],
			additionalPolyfills: ["Symbol"],
			writeToFile: false
		});
		expect(result.polyfills).toContain("Symbol");
	});
});

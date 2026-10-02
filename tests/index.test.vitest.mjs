/**
 *
 *	@Project: polyfillme
 *	@Filename: /tests/index.test.vitest.mjs
 *	@Date: 2026-08-02T23:53:31-07:00 (1785740011)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T12:17:05-07:00 (1790968625)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import polyfillme from "../src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dedicated fixture for this suite. It must NOT be the shared, committed
// `tests/testfile.js` — the es<version> suites read that file's rich feature set,
// and @cldmv/vitest-runner spawns each test file in its own parallel process, so
// overwriting/deleting the shared fixture here would race and break them.
const TEST_FILE = path.join(__dirname, "index.testfile.js");
const TEST_FILE_REL = "tests/index.testfile.js";

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
			files: [TEST_FILE_REL],
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
			files: [TEST_FILE_REL],
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
		// The canonical mdn key for Array.prototype.includes is builtins.Array.includes
		expect(result.polyfills.some((p) => p.includes("builtins.Array.includes"))).toBe(true);
	});

	it("excludes already included polyfills", async () => {
		const result = await polyfillme({
			ecmaVersion: "es2015",
			files: [TEST_FILE_REL],
			includedPolyfills: ["Promise"],
			additionalPolyfills: [],
			writeToFile: false
		});
		expect(result.polyfills.some((p) => p === "Promise")).toBe(false);
	});

	it("adds additional polyfills", async () => {
		const result = await polyfillme({
			ecmaVersion: "es2015",
			files: [TEST_FILE_REL],
			includedPolyfills: [],
			additionalPolyfills: ["Symbol"],
			writeToFile: false
		});
		expect(result.polyfills).toContain("Symbol");
	});
});

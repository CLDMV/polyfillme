/**
 *
 *	@Project: polyfillme
 *	@Filename: /.configs/vitest.config.mjs
 *	@Date: 2026-08-03T03:58:08+00:00 (1785729488)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T12:17:01-07:00 (1790968621)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Anchor the project root to the package directory so include/exclude work no
// matter what cwd vitest is invoked from.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export default defineConfig({
	root,
	test: {
		// The existing suite is authored in Jest style — bare `describe` / `it` /
		// `expect` / `beforeAll` / `afterAll` with no imports — so Vitest must
		// expose those as globals for the tests to run unchanged.
		globals: true,
		// ESM test files live in `tests/` and end in `.test.vitest.mjs`. The lone
		// `es5.debug.test.vitest.mjs` is an ESM debug scratch (no test cases) and
		// is excluded here; the runner harness excludes it from discovery too.
		include: ["tests/**/*.test.vitest.mjs"],
		exclude: ["node_modules", "tests/**/*.debug.test.vitest.mjs"],
		environment: "node",
		testTimeout: 30000,
		// "dot" keeps CI logs to one character per test file instead of a full
		// per-file pass/fail block — vitest's non-interactive fallback otherwise
		// reprints that whole block per file. The final summary is unaffected.
		reporters: ["dot"],
		coverage: {
			provider: "v8",
			// Real library surface — the polyfill implementation. `src/data/**`
			// holds MDN data + generation scripts (build:mdn tooling), not the
			// runtime library, so it is deliberately out of scope.
			include: ["src/index.js", "src/lib/**"],
			exclude: ["**/*.json", "tests/**"],
			reporter: ["text", "html", "json-summary", "json"]
		}
	}
});

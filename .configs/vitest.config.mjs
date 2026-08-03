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
		// CommonJS test files live in `test/` and end in `.test.js`. The lone
		// `es5.debug.test.js` is an ESM debug scratch (no test cases) and is
		// excluded here; the runner harness excludes it from discovery too.
		include: ["test/**/*.test.js"],
		exclude: ["node_modules", "test/**/*.debug.test.js"],
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
			exclude: ["**/*.json", "test/**"],
			reporter: ["text", "html", "json-summary", "json"]
		}
	}
});

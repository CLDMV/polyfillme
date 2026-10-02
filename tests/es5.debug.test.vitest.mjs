/**
 *
 *	@Project: polyfillme
 *	@Filename: /tests/es5.debug.test.vitest.mjs
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

import polyfillme from "../src/index.js";

(async () => {
	const result = await polyfillme({
		ecmaVersion: "es5",
		files: ["tests/testfile.js"],
		includedPolyfills: [],
		additionalPolyfills: [],
		writeToFile: false
	});
	console.log("polyfillme ES5 result:", result);
})();

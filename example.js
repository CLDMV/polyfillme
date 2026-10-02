/**
 *
 *	@Project: polyfillme
 *	@Filename: /example.js
 *	@Date: 2025-07-19T20:03:08-07:00 (1752980588)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T12:17:03-07:00 (1790968623)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Example usage of polyfillme module.
 */
const polyfillme = require("./src/index");

polyfillme({
	ecmaVersion: "es2018",
	files: ["src/**/*.js"],
	includedPolyfills: [],
	additionalPolyfills: ["Array.prototype.flat"]
}).then((polyfills) => {
	console.log("Required polyfills:", polyfills);
});

/**
 *
 *	@Project: polyfillme
 *	@Filename: /src/data/scripts/hasRealCode.js
 *	@Date: 2025-07-20T13:36:05-07:00 (1753043765)
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
 * Utility to check if a JS string contains real code using AST.
 * Returns true if AST contains at least one statement.
 */
const espree = require("espree");

function hasRealCode(js) {
	try {
		const ast = espree.parse(js, { ecmaVersion: "latest", sourceType: "script" });
		return ast.body && ast.body.length > 0;
	} catch (e) {
		return false;
	}
}

module.exports = { hasRealCode };

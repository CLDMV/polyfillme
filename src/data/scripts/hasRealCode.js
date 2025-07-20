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

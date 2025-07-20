/**
 * Utility functions for polyfillme module.
 * Contains: walkAST, getUnsupportedFeatures
 */
const compat = require("core-js-compat");

/**
 * Walks the AST and collects used JS features (MemberExpression, CallExpression, Identifier).
 * @param {Object} ast - ESTree AST object.
 * @param {Set<string>} features - Set to collect feature names (e.g., 'Array.prototype.flat').
 */
function walkAST(ast, features) {
	function visit(node) {
		if (!node || typeof node !== "object") return;
		// MemberExpression: e.g. Array.prototype.flat
		if (node.type === "MemberExpression") {
			let obj = node.object.name || (node.object.type === "Identifier" ? node.object.name : null);
			let prop = node.property.name || (node.property.type === "Identifier" ? node.property.name : null);
			if (obj && prop) {
				features.add(`${obj}.prototype.${prop}`);
			}
		}
		// CallExpression: e.g. Object.entries()
		if (node.type === "CallExpression" && node.callee.type === "MemberExpression") {
			let obj = node.callee.object.name;
			let prop = node.callee.property.name;
			if (obj && prop) {
				features.add(`${obj}.prototype.${prop}`);
			}
		} else if (node.type === "CallExpression" && node.callee.type === "Identifier") {
			features.add(node.callee.name);
		}
		// Identifier for globals: Promise, Map, Set, etc.
		if (node.type === "Identifier") {
			features.add(node.name);
		}
		for (let key in node) {
			if (Object.prototype.hasOwnProperty.call(node, key)) {
				let child = node[key];
				if (Array.isArray(child)) {
					child.forEach(visit);
				} else {
					visit(child);
				}
			}
		}
	}
	visit(ast);
}

/**
 * Returns features not supported in the specified ES/ECMA version.
 * @param {string[]} features - List of used features.
 * @param {string} ecmaVersion - Target ES/ECMA version (e.g., 'es2018').
 * @returns {string[]} - List of unsupported features.
 */
function getUnsupportedFeatures(features, ecmaVersion) {
	const data = compat({ targets: ecmaVersion });
	const supported = new Set(data.list);
	return features.filter((f) => !supported.has(f));
}

module.exports = {
	walkAST,
	getUnsupportedFeatures
};

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
	const coreJsFeatures = require("core-js-compat/data");
	// Track variable types (e.g., arr is Array)
	const variableTypes = {};

	function inferTypeFromInit(initNode) {
		if (!initNode) return null;
		if (initNode.type === "ArrayExpression") return "Array";
		if (initNode.type === "ObjectExpression") return "Object";
		if (initNode.type === "Literal") {
			if (typeof initNode.value === "string") return "String";
			if (typeof initNode.value === "number") return "Number";
		}
		return null;
	}

	function getObjectName(objNode) {
		if (!objNode) return null;
		if (objNode.type === "Identifier") return objNode.name;
		if (objNode.type === "ArrayExpression") return "Array";
		if (objNode.type === "ObjectExpression") return "Object";
		if (objNode.type === "Literal") {
			if (typeof objNode.value === "string") return "String";
			if (typeof objNode.value === "number") return "Number";
		}
		return null;
	}

	function mapToCoreJsKey(type, prop) {
		// Instance methods
		if (type === "Array" && prop === "includes") return "es.array.includes";
		if (type === "Array" && prop === "flat") return "es.array.flat";
		if (type === "Object" && prop === "entries") return "es.object.entries";
		if (type === "Object" && prop === "fromEntries") return "es.object.from-entries";
		if (type === "Promise") return "es.promise";
		// Add more mappings as needed
		return null;
	}

	function visit(node) {
		if (!node || typeof node !== "object") return;

		// Track variable declarations and their types
		if (node.type === "VariableDeclarator" && node.id.type === "Identifier") {
			const varName = node.id.name;
			const varType = inferTypeFromInit(node.init);
			if (varType) variableTypes[varName] = varType;
		}

		// Detect static and instance method calls
		if (node.type === "CallExpression" && node.callee.type === "MemberExpression") {
			let objNode = node.callee.object;
			let propNode = node.callee.property;
			let obj = getObjectName(objNode);
			let prop = propNode.name;
			let type = null;
			if (obj && variableTypes[obj]) {
				type = variableTypes[obj];
			} else if (obj && ["Promise", "Object", "Array", "String", "Number", "Symbol", "Set", "Map"].includes(obj)) {
				type = obj;
			} else if (["Array", "Object", "String", "Number"].includes(obj)) {
				type = obj;
			}
			if (type && prop) {
				let coreJsKey = mapToCoreJsKey(type, prop);
				if (coreJsKey && (coreJsFeatures[coreJsKey] || coreJsFeatures["es." + coreJsKey] || coreJsFeatures["esnext." + coreJsKey])) {
					features.add(coreJsKey);
				}
			}
		}

		// Detect direct usage of global objects
		if (node.type === "Identifier") {
			let name = node.name;
			// Only add if it's a known global polyfillable object
			if (["Promise", "Symbol", "Set", "Map"].includes(name)) {
				let coreJsKey = mapToCoreJsKey(name);
				if (coreJsKey && (coreJsFeatures[coreJsKey] || coreJsFeatures["es." + coreJsKey] || coreJsFeatures["esnext." + coreJsKey])) {
					features.add(coreJsKey);
				}
			}
		}

		for (let key in node) {
			if (Object.prototype.hasOwnProperty.call(node, key)) {
				let child = node[key];
				if (Array.isArray(child)) {
					child.forEach((c) => visit(c));
				} else {
					visit(child);
				}
			}
		}
	}
	visit(ast, null);
	// Debug: log detected features after AST walk
	if (process.env.POLYFILLME_DEBUG) {
		console.log("[walkAST] Features detected:", Array.from(features));
	}
}

/**
 * Returns features not supported in the specified ES/ECMA version.
 * @param {string[]} features - List of used features.
 * @param {string} ecmaVersion - Target ES/ECMA version (e.g., 'es2018').
 * @returns {string[]} - List of unsupported features.
 */
function getUnsupportedFeatures(features, ecmaVersion) {
	// Resolve ES/ECMA alias to Browserslist query
	const { esEcmaToBrowserslist } = require("./esEcmaToBrowserslist");
	const query = esEcmaToBrowserslist(ecmaVersion) || ecmaVersion;
	const data = compat({ targets: query });
	const supported = new Set(data.list);
	const unsupported = features.filter((f) => !supported.has(f));
	if (process.env.POLYFILLME_DEBUG) {
		console.log("[getUnsupportedFeatures] Query:", query);
		console.log("[getUnsupportedFeatures] Supported:", Array.from(supported));
		console.log("[getUnsupportedFeatures] Unsupported:", unsupported);
	}
	return unsupported;
}

module.exports = {
	walkAST,
	getUnsupportedFeatures
};

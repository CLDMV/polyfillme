/**
 * @module polyfillme
 * Main entry point for polyfillme module.
 * Scans files for unsupported JS features and generates polyfill file or content.
 */

const fg = require("fast-glob");
const espree = require("espree");
const fs = require("fs");
const { walkAST, getUnsupportedFeatures } = require("./lib/utils");
const { generatePolyfillFile } = require("./lib/polyfillSources");

/**
 * @typedef {Object} PolyfillMeOptions
 * @property {string} ecmaVersion - Target ES/ECMA version, e.g. 'es2018'.
 * @property {string[]} files - List of file globs to scan.
 * @property {string[]} includedPolyfills - Polyfills already included in the project.
 * @property {string[]} additionalPolyfills - Additional polyfills to include.
 * @property {boolean} [writeToFile] - If true, writes output to file.
 * @property {string} [filePath] - Output file path (default: polyfills.js in project root).
 * @property {string|function} [source] - Polyfill source ('core-js', 'polyfill.io', or custom function).
 */

const coreJsData = require("core-js-compat/data");

/**
 * Scans files for unsupported JS features and generates polyfill file or content.
 * Returns polyfills, output content, and info about shams and not-found features.
 * @param {PolyfillMeOptions} options - Options for polyfillme.
 * @returns {Promise<{ polyfills: string[], content: string, shams: string[], notFound: string[] }>} - Polyfills, output content, shams, not-found.
 */
async function polyfillme(options) {
	// Validate input
	if (!options || typeof options !== "object") {
		throw new Error("Options object is required.");
	}
	const { ecmaVersion, files, includedPolyfills, additionalPolyfills, writeToFile, filePath, source } = options;
	if (!ecmaVersion || typeof ecmaVersion !== "string") {
		throw new Error("ecmaVersion (string) is required.");
	}
	if (!Array.isArray(files) || files.length === 0) {
		throw new Error("files (array of globs) is required.");
	}
	if (!Array.isArray(includedPolyfills)) {
		throw new Error("includedPolyfills (array) is required.");
	}
	if (!Array.isArray(additionalPolyfills)) {
		throw new Error("additionalPolyfills (array) is required.");
	}

	// 1. Resolve files
	let filePaths;
	try {
		filePaths = await fg(files, { absolute: true });
	} catch (err) {
		throw new Error("Error resolving file globs: " + err.message);
	}
	// 2. Scan files for features
	const usedFeatures = new Set();
	for (const file of filePaths) {
		let code;
		try {
			code = fs.readFileSync(file, "utf8");
		} catch (err) {
			throw new Error(`Error reading file ${file}: ${err.message}`);
		}
		let ast;
		try {
			ast = espree.parse(code, { ecmaVersion: 2020, sourceType: "module" });
		} catch (err) {
			throw new Error(`Error parsing file ${file}: ${err.message}`);
		}
		walkAST(ast, usedFeatures);
	}
	// 3. Get unsupported features for target version
	const unsupported = getUnsupportedFeatures([...usedFeatures], ecmaVersion);
	// 4. Exclude already included polyfills
	const required = unsupported.filter((f) => !includedPolyfills.includes(f));
	// 5. Add additional polyfills
	const allPolyfills = Array.from(new Set([...required, ...additionalPolyfills]));
	// 6. Generate polyfill output
	const polyfillContent = await generatePolyfillFile(allPolyfills, { writeToFile, filePath, source });

	// Shim/sham and not-found detection
	const shams = [];
	const notFound = [];
	for (const polyfill of allPolyfills) {
		// Convert feature name to core-js format
		const coreJsKey = polyfill.replace(/\.prototype\./, "/prototype/").replace(/\./g, "/");
		// Try direct match, fallback to es. prefix
		let meta = coreJsData[coreJsKey] || coreJsData["es." + coreJsKey] || coreJsData["esnext." + coreJsKey];
		if (!meta) {
			notFound.push(polyfill);
		} else if (meta.sham) {
			shams.push(polyfill);
		}
	}

	return { polyfills: allPolyfills, content: polyfillContent, shams, notFound };
}

module.exports = polyfillme;

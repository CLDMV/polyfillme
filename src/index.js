/**
 * @module polyfillme
 * Main entry point for polyfillme module.
 * Scans files for unsupported JS features and generates polyfill file or content.
 */

const fg = require("fast-glob");
const espree = require("espree");
const fs = require("fs");
const { walkAST } = require("./lib/ast");
const { fetchPolyfillCode } = require("./lib/polyfillSources");

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

const path = require("path");
const mdnEs = JSON.parse(require("fs").readFileSync(path.join(__dirname, "data/mdn/mdn.es.json"), "utf8"));

/**
 * Scans files for unsupported JS features and generates polyfill file or content.
 * Returns polyfills, output content, and info about shams and not-found features.
 * @param {PolyfillMeOptions} options - Options for polyfillme.
 * @returns {Promise<{ polyfills: string[], content: string, shams: string[], notFound: string[] }>} - Polyfills, output content, shams, not-found.
 *   - shams: Features for which only partial/incomplete polyfills exist (e.g., not spec-compliant)
 *   - notFound: Features detected in code for which no polyfill was found at all
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
	let filePaths = [];
	if (process.env.POLYFILLME_DEBUG) {
		console.log("[polyfillme] Resolving files:", files);
	}
	for (const entry of files) {
		// If entry is an absolute path to a file, use it directly
		if (fs.existsSync(entry) && fs.statSync(entry).isFile()) {
			filePaths.push(entry);
			if (process.env.POLYFILLME_DEBUG) {
				console.log(`[polyfillme] Added absolute file path: ${entry}`);
			}
		} else {
			// Otherwise, treat as glob pattern
			try {
				const matches = await fg(entry, { absolute: true });
				filePaths.push(...matches);
				if (process.env.POLYFILLME_DEBUG) {
					console.log(`[polyfillme] Glob resolved for '${entry}':`, matches);
				}
			} catch (err) {
				console.error(`[polyfillme] Error resolving glob '${entry}':`, err);
				throw new Error(`Error resolving glob '${entry}': ${err.message}`);
			}
		}
	}
	if (process.env.POLYFILLME_DEBUG) {
		console.log("[polyfillme] Final resolved file paths:", filePaths);
	}
	// 2. Scan files for features
	const usedFeatures = new Set();
	for (const file of filePaths) {
		if (process.env.POLYFILLME_DEBUG) {
			console.log(`[polyfillme] Checking if file exists: ${file}`);
		}
		if (!fs.existsSync(file)) {
			if (process.env.POLYFILLME_DEBUG) {
				console.error(`[polyfillme] File does not exist: ${file}`);
			}
			continue;
		}
		let code;
		try {
			code = fs.readFileSync(file, "utf8");
			if (process.env.POLYFILLME_DEBUG) {
				console.log(`[polyfillme] Successfully read file: ${file}`);
			}
		} catch (err) {
			if (process.env.POLYFILLME_DEBUG) {
				console.error(`[polyfillme] Error reading file ${file}:`, err);
			}
			throw new Error(`Error reading file ${file}: ${err.message}`);
		}
		let ast;
		try {
			ast = espree.parse(code, { ecmaVersion: 2020, sourceType: "script" });
			if (process.env.POLYFILLME_DEBUG) {
				console.log(`[polyfillme] AST for ${file}:`, JSON.stringify(ast, null, 2));
			}
		} catch (err) {
			if (process.env.POLYFILLME_DEBUG) {
				console.error(`[polyfillme] Error parsing file ${file}:`, err);
			}
			throw new Error(`Error parsing file ${file}: ${err.message}`);
		}
		if (process.env.POLYFILLME_DEBUG) {
			console.log(`[polyfillme] Calling walkAST for ${file}`);
		}
		walkAST(ast, usedFeatures);
	}
	// 3. Get allowed features for the target ES version and all prior versions
	const esVersions = Object.keys(mdnEs);
	const targetIndex = esVersions.indexOf(ecmaVersion);
	const allowedVersions = targetIndex >= 0 ? esVersions.slice(0, targetIndex + 1) : [ecmaVersion];
	// Build a set of allowed mdn keys
	const allowedMdnKeys = new Set();
	for (const ver of allowedVersions) {
		for (const k in mdnEs[ver]) {
			allowedMdnKeys.add(mdnEs[ver][k]);
		}
	}
	// Normalize feature keys for lookup
	function normalizeFeatureKey(feature) {
		// Match prototype methods: Array.prototype.includes -> builtins.Array.includes
		const protoMatch = feature.match(/^(\w+)\.prototype\.(\w+)$/);
		if (protoMatch) {
			return `builtins.${protoMatch[1]}.${protoMatch[2]}`;
		}
		// Match static methods: Array.entries -> builtins.Array.entries
		const staticMatch = feature.match(/^(\w+)\.(\w+)$/);
		if (staticMatch) {
			return `builtins.${staticMatch[1]}.${staticMatch[2]}`;
		}
		// Match global objects: Promise -> builtins.Promise
		const globalMatch = feature.match(/^(\w+)$/);
		if (globalMatch) {
			return `builtins.${globalMatch[1]}`;
		}
		return feature;
	}
	// 4. Determine which used features are not present in the allowed ES versions
	/**
	 * Find features used in code that are not present in allowed ES versions.
	 * @type {string[]}
	 * @example
	 * // If 'Array.prototype.includes' is used and not present in allowedMdnKeys, it will be included.
	 */
	/**
	 * For each used feature, normalize and map to canonical mdn key, then check if it's present in allowed ES versions.
	 * Only include features whose canonical mdn key is NOT present in allowedMdnKeys.
	 */
	const neededPolyfills = Array.from(usedFeatures)
		.map(normalizeFeatureKey)
		.map((key) => {
			// Find the canonical mdn key for this feature
			let mdnKey = null;
			for (const ver of esVersions) {
				if (mdnEs[ver][key]) {
					mdnKey = mdnEs[ver][key];
					break;
				}
			}
			return mdnKey || key;
		})
		.filter((mdnKey) => mdnKey && !allowedMdnKeys.has(mdnKey));

	const finalPolyfills = Array.from(new Set([...neededPolyfills, ...additionalPolyfills])).filter((f) => !includedPolyfills.includes(f));

	// 6. Generate polyfill output
	const polyfillContent = await fetchPolyfillCode(finalPolyfills, source);

	if (writeToFile !== false) {
		fs.writeFileSync(filePath || "polyfills.js", polyfillContent, "utf8");
	}

	// 'shams': Features for which only partial/incomplete polyfills exist (e.g., not spec-compliant)
	// TODO: Implement actual detection of shams features
	const shams = [];

	// 'notFound': Features detected in code for which no polyfill was found at all
	// TODO: Implement actual detection of notFound features
	const notFound = [];

	return {
		polyfills: finalPolyfills,
		content: polyfillContent,
		shams, // see above
		notFound // see above
	};
}

module.exports = polyfillme;

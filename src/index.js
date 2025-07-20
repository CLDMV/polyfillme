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
	// 3. Map ES/ECMA version to Browserslist query if needed
	const { esEcmaToBrowserslist } = require("./lib/esEcmaToBrowserslist");
	let targetQuery = esEcmaToBrowserslist(ecmaVersion) || ecmaVersion;
	if (process.env.POLYFILLME_DEBUG) {
		console.log("[polyfillme] Target ES/ECMA:", ecmaVersion);
		console.log("[polyfillme] Browserslist query:", targetQuery);
		console.log("[polyfillme] Used features:", Array.from(usedFeatures));
	}
	const unsupported = getUnsupportedFeatures([...usedFeatures], targetQuery);
	if (process.env.POLYFILLME_DEBUG) {
		console.log("[polyfillme] Unsupported features:", unsupported);
		console.log("[polyfillme] Used features:", Array.from(usedFeatures));
		console.log("[polyfillme] Target query:", targetQuery);
	}
	// Load mapping from core-js keys to user-friendly names
	const featureMap = require("./data/corejs-feature-map.json");

	// Helper: map polyfill key to user-friendly name if possible (strip es/esnext prefix)
	function toUserFriendly(key) {
		return featureMap[key] || key;
	}

	// 4. Exclude already included polyfills (support both key and friendly name)
	const required = unsupported.filter((f) => {
		return !includedPolyfills.includes(f) && !includedPolyfills.includes(toUserFriendly(f));
	});
	if (process.env.POLYFILLME_DEBUG) {
		console.log("[polyfillme] Required polyfills (after exclusion):", required);
	}
	// 5. Add additional polyfills (support both key and friendly name)
	const allPolyfills = Array.from(
		new Set([
			...required,
			...additionalPolyfills.map((p) => {
				// If user provides user-friendly name, map to compat key if possible
				if (featureMap[p]) {
					// If input is a compat key, use as is
					return p;
				}
				// If input is a user-friendly name, map to compat key
				const compatKey = Object.keys(featureMap).find((k) => featureMap[k] === p);
				return compatKey || p;
			})
		])
	);
	if (process.env.POLYFILLME_DEBUG) {
		console.log("[polyfillme] Final polyfills (compat keys):", allPolyfills);
	}
	// 6. Generate polyfill output
	if (process.env.POLYFILLME_DEBUG) {
		console.log(
			"[polyfillme] Import lines that will be generated:",
			allPolyfills.map((f) => `import 'core-js/features/${f.replace(/\./g, "/")}';`)
		);
	}
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
			notFound.push(toUserFriendly(polyfill));
		} else if (meta.sham) {
			shams.push(toUserFriendly(polyfill));
		}
	}

	const finalPolyfills = Array.from(new Set(allPolyfills.map(toUserFriendly)));
	if (process.env.POLYFILLME_DEBUG) {
		console.log("[polyfillme] Final polyfills (user-friendly):", finalPolyfills);
		console.log(
			"[polyfillme] Includes Promise?",
			finalPolyfills.some((p) => p.includes("Promise"))
		);
		console.log(
			"[polyfillme] Includes Array.prototype.includes?",
			finalPolyfills.some((p) => p.includes("Array.prototype.includes"))
		);
	}
	// Return user-friendly polyfill names (dedupe)
	return {
		polyfills: finalPolyfills,
		content: polyfillContent,
		shams: shams.map(toUserFriendly),
		notFound: notFound.map(toUserFriendly)
	};
}

module.exports = polyfillme;

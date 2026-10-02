#!/usr/bin/env node
/**
 *
 *	@Project: polyfillme
 *	@Filename: /cli.js
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
 * CLI for polyfillme module
 */
const path = require("path");
const polyfillme = require("./src/index");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const argv = yargs(hideBin(process.argv))
	.option("ecmaVersion", { type: "string", demandOption: true, describe: "Target ES/ECMA version (e.g., es3, es2018)" })
	.option("files", { type: "array", demandOption: true, describe: "File globs to scan" })
	.option("includedPolyfills", { type: "array", default: [], describe: "Already included polyfills" })
	.option("additionalPolyfills", { type: "array", default: [], describe: "Additional polyfills to include" })
	.option("source", { type: "string", default: "core-js", describe: "Polyfill source (core-js, polyfill.io)" })
	.option("filePath", { type: "string", describe: "Output file path for polyfills" })
	.help().argv;

(async () => {
	try {
		const result = await polyfillme({
			ecmaVersion: argv.ecmaVersion,
			files: argv.files,
			includedPolyfills: argv.includedPolyfills,
			additionalPolyfills: argv.additionalPolyfills,
			source: argv.source,
			writeToFile: !!argv.filePath,
			filePath: argv.filePath
		});

		// Output shim/sham and not-found info from main module
		if (result.notFound && result.notFound.length) {
			console.log("Warning: The following features were not found in core-js:", result.notFound);
		}
		if (result.shams && result.shams.length) {
			console.log("Note: The following features are shams (not true shims):", result.shams);
		}

		if (argv.filePath) {
			console.log(`Polyfill output written to ${path.resolve(argv.filePath)}`);
		} else {
			console.log(result.content);
		}
	} catch (err) {
		console.error("Error:", err.message);
		process.exit(1);
	}
})();

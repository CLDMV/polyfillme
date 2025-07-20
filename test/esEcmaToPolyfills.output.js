const { ES_ECMA_MAP } = require("../src/lib/esEcmaToBrowserslist");
const compat = require("core-js-compat");

const esVersion = process.argv[2]; // e.g. "es5", "es3"

function isEsNumberAlias(alias) {
	return /^es\d+$/.test(alias);
}

const browserslist = require("browserslist");

function printPolyfillDetails(esAlias, query) {
	const result = compat({ targets: query });
	const browsers = browserslist(query);
	console.log(`\nPolyfills for ${esAlias}: ${query}`);
	console.log(`Targeted browsers:`);
	browsers.forEach((b) => console.log(`  - ${b}`));
	if (result.list.length === 0) {
		console.log("No polyfills required for these browsers.");
		return;
	}
	console.log("Polyfills required:");
	result.list.forEach((feature) => {
		// For each feature, find which browsers need it
		const featureCompat = compat({ targets: browsers, filter: [feature] });
		const unsupported = browsers.filter((_) => featureCompat.list.includes(feature));
		if (unsupported.length > 0) {
			console.log(`  - ${feature}`);
			unsupported.forEach((b) => console.log(`      * ${b}`));
		}
	});
}

if (esVersion) {
	const query = ES_ECMA_MAP[esVersion];
	if (!query) {
		console.error(`No Browserslist query found for ${esVersion}`);
		process.exit(1);
	}
	printPolyfillDetails(esVersion, query);
} else {
	for (const [alias, query] of Object.entries(ES_ECMA_MAP)) {
		if (!query) continue;
		if (!isEsNumberAlias(alias)) continue;
		printPolyfillDetails(alias, query);
	}
}

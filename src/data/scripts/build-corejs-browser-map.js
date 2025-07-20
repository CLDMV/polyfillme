const { ES_ECMA_MAP } = require("../../lib/esEcmaToBrowserslist");
const compat = require("core-js-compat");
const browserslist = require("browserslist");
const fs = require("fs");
const path = require("path");

function isEsNumberAlias(alias) {
	return /^es\d+$/.test(alias);
}

const output = {};

for (const [esAlias, query] of Object.entries(ES_ECMA_MAP)) {
	if (!query) continue;
	if (!isEsNumberAlias(esAlias)) continue;
	const browsers = browserslist(query);
	const result = compat({ targets: query });
	output[esAlias] = {
		browsers,
		features: {}
	};
	result.list.forEach((feature) => {
		const featureCompat = compat({ targets: browsers, filter: [feature] });
		const unsupported = browsers.filter((_) => featureCompat.list.includes(feature));
		output[esAlias].features[feature] = unsupported;
	});
}

const outPath = path.join(__dirname, "../corejs-browser-map.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, "\t"));
console.log(`Saved browser-feature map to ${outPath}`);

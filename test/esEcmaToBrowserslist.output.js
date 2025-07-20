const { ES_ECMA_MAP } = require("../src/lib/esEcmaToBrowserslist");
const browserslist = require("browserslist");

for (const [alias, query] of Object.entries(ES_ECMA_MAP)) {
	if (!query) continue;
	const result = browserslist(query);
	console.log(`\nBrowserslist for ${alias}: ${query}`);
	console.log(result);
}

const { ES_ECMA_MAP } = require("../src/lib/esEcmaToBrowserslist");
const compat = require("core-js-compat");

const esVersion = process.argv[2] || "es5";
const query = ES_ECMA_MAP[esVersion];
if (!query) {
    console.error(`No Browserslist query found for ${esVersion}`);
    process.exit(1);
}
const result = compat({ targets: query });
console.log(`Browserslist query for ${esVersion}: ${query}`);
console.log(`Polyfills returned by core-js-compat:`);
console.log(result.list);
console.log(`Includes Promise?`, result.list.some(p => p.toLowerCase().includes("promise")));
console.log(`Includes Array.prototype.includes?`, result.list.some(p => p.toLowerCase().includes("includes")));

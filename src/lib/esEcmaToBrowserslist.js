/**
 * Map ES/ECMA versions to Browserslist queries for core-js-compat.
 * Source: https://github.com/browserslist/browserslist#full-list
 * This covers ES5 through ES2022 and common ECMA aliases.
 */

// Load browser milestone versions from corejs-browser-map.json
const fs = require("fs");
const path = require("path");
const browserMapPath = path.join(__dirname, "../data/corejs-browser-map.json");
let browserMap = {};
try {
	browserMap = JSON.parse(fs.readFileSync(browserMapPath, "utf8"));
} catch (_) {
	// fallback: empty map
	browserMap = {};
}

// Build ES_ECMA_MAP from browserMap
const ES_ECMA_MAP = {};
for (const [alias, data] of Object.entries(browserMap)) {
	if (Array.isArray(data.browsers) && data.browsers.length > 0) {
		ES_ECMA_MAP[alias] = data.browsers.join(", ");
	}
}

function esEcmaToBrowserslist(version) {
	const key = String(version).toLowerCase().replace(/\s+/g, "");
	return ES_ECMA_MAP[key] || null;
}

module.exports = { esEcmaToBrowserslist, ES_ECMA_MAP };

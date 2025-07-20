const bcd = require("@mdn/browser-compat-data");

const githubBaseURL = "https://github.com/mdn/browser-compat-data/blob/main/javascript/";

function getEarliest(supportObj) {
	const result = {};
	for (const browser in supportObj) {
		const data = supportObj[browser];
		if (Array.isArray(data)) {
			const entry = data.find((d) => d.version_added);
			result[browser] = entry ? entry.version_added : null;
		} else {
			result[browser] = data.version_added || null;
		}
	}
	return result;
}

function getEsTag(tags) {
	const tag = tags && tags.find((t) => t.startsWith("web-features:snapshot:ecmascript-"));
	if (!tag) return "unknown";
	const esVer = tag.split(":").pop().replace("ecmascript-", "es");
	return esVer;
}

function getGithubUrl(pathArr, mdnUrl) {
	// Example mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for"
	// We want the first folder past "Reference" (e.g., "Statements"), then back up to main/Statements.json
	if (!mdnUrl) return `${githubBaseURL}${pathArr.join("/")}.json`;
	const refIdx = mdnUrl.indexOf("Reference/");
	if (refIdx === -1) return `${githubBaseURL}${pathArr.join("/")}.json`;
	const afterRef = mdnUrl.slice(refIdx + "Reference/".length);
	const folders = afterRef.split("/").filter(Boolean);
	// If top-level is 'operators' or 'builtins', keep full path
	if (["operators", "builtins"].includes(pathArr[0])) {
		// If there are more than one folder, backup to the deepest folder
		if (folders.length > 1) {
			const idx = pathArr.findIndex((p) => p.toLowerCase() === folders[folders.length - 1].toLowerCase());
			const githubPath = idx !== -1 ? pathArr.slice(0, idx + 1) : pathArr;
			return `${githubBaseURL}${githubPath.join("/")}.json`;
		}
		// Otherwise, keep full path
		return `${githubBaseURL}${pathArr.join("/")}.json`;
	}
	// For other cases, backup to the first folder past Reference
	const folder = folders[0];
	const folderIdx = pathArr.findIndex((p) => p.toLowerCase() === folder.toLowerCase());
	const githubPath = folderIdx !== -1 ? pathArr.slice(0, folderIdx + 1) : pathArr;
	return `${githubBaseURL}${githubPath.join("/")}.json`;
}

function extractFeatureInfo(pathArr, featureObj) {
	if (!featureObj.__compat) return null;
	const browsers = getEarliest(featureObj.__compat.support);
	// Only return if at least one browser has a version
	const hasVersion = Object.values(browsers).some((v) => !!v);
	if (!hasVersion) return null;
	const _esTag = getEsTag(featureObj.__compat.tags);
	if (!_esTag) return null; // No ES tag found
	return {
		human: pathArr[pathArr.length - 1],
		es: _esTag,
		urls: {
			spec: featureObj.__compat.spec_url,
			mdn: featureObj.__compat.mdn_url,
			github: getGithubUrl(pathArr, featureObj.__compat.mdn_url)
		},
		browsers
	};
}

function scanFeatures(obj, pathArr = []) {
	const result = {};
	for (const key in obj) {
		if (key === "__compat") continue;

		if (pathArr.length === 0 && (key === "async" || key === "grammar" || key === "statements")) continue;

		const value = obj[key];
		const newPath = [...pathArr, key];

		// Always descend into objects, even if they have __compat
		if (value && typeof value === "object") {
			// If this node has __compat, extract it
			if (value.__compat) {
				const info = extractFeatureInfo(newPath, value);
				if (info) result[newPath.join(".")] = info;
			}
			// Descend into all child properties
			Object.assign(result, scanFeatures(value, newPath));
		}
	}
	return result;
}

const fs = require("fs");
const path = require("path");
const allJsFeatures = scanFeatures(bcd.javascript);
// Update allJsFeatures so 'human' is always an array
for (const [feature, data] of Object.entries(allJsFeatures)) {
	data.human = toHumanReadableFeature(feature, data);
}
const outPath = path.join(__dirname, "../mdn", "mdn.json");
fs.writeFileSync(outPath, JSON.stringify(allJsFeatures, null, "\t"));

// Build ES-version-keyed object
function toHumanReadableFeature(key, info) {
	// Use MDN and spec URLs to generate possible human-readable keys
	const mdnUrl = info.urls && info.urls.mdn;
	const specUrl = info.urls && info.urls.spec;
	const match = key.match(/^builtins\.(\w+)\.(\w+)$/);
	let keys = [];
	if (match) {
		const cls = match[1];
		const method = match[2];

		// Try to detect prototype from spec URL
		if (specUrl && specUrl.includes(`${cls.toLowerCase()}.prototype.${method}`)) {
			keys.push(`${cls}.prototype.${method}`);
		}
		// Try to detect prototype from MDN URL
		if (mdnUrl && new RegExp(`/Global_Objects/${cls}/${method}$`).test(mdnUrl)) {
			if (!keys.includes(`${cls}.prototype.${method}`)) keys.push(`${cls}.prototype.${method}`);
			// Always add <class>.<method>
			keys.push(`${cls}.${method}`);
			// Add .<method>
			keys.push(`.${method}`);
			// Add <method>
			keys.push(`${method}`);
		} else {
			// Always add <class>.<method>
			keys.push(`${cls}.${method}`);
			// Add <method>
			keys.push(`${method}`);
		}
		return keys;
	}
	// For other keys, just return the original key and .<last> and <last>
	const last = key.split(".").pop();
	return [key, last];
	// return [key, `.${last}`, last];
}

const esKeyed = {};
for (const [feature, data] of Object.entries(allJsFeatures)) {
	if (!data.es) continue;
	if (!esKeyed[data.es]) esKeyed[data.es] = {};
	const humanKeys = toHumanReadableFeature(feature, data);
	// Store all human keys in the data
	data.human = humanKeys;
	// Index by all human keys and the mdn key
	for (const k of humanKeys) {
		esKeyed[data.es][k] = feature;
	}
	esKeyed[data.es][feature] = feature;
}

// Sort ES keys: numeric (es1, es2, ...), then year (es2015, ...), then unknown
function esSort(a, b) {
	if (a === "unknown") return 1;
	if (b === "unknown") return -1;
	const numA = a.match(/^es(\d+)$/);
	const numB = b.match(/^es(\d+)$/);
	if (numA && numB) return Number(numA[1]) - Number(numB[1]);
	if (numA) return -1;
	if (numB) return 1;
	// Year-based
	const yearA = a.match(/^es(\d{4})$/);
	const yearB = b.match(/^es(\d{4})$/);
	if (yearA && yearB) return Number(yearA[1]) - Number(yearB[1]);
	if (yearA) return -1;
	if (yearB) return 1;
	// Fallback to string sort
	return a.localeCompare(b);
}
const sortedEsKeyed = {};
Object.keys(esKeyed)
	.sort(esSort)
	.forEach((k) => {
		sortedEsKeyed[k] = esKeyed[k];
	});
const esOutPath = path.join(__dirname, "../mdn", "mdn.es.json");
fs.writeFileSync(esOutPath, JSON.stringify(sortedEsKeyed, null, "\t"));

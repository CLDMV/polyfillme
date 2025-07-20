const bcd = require("@mdn/browser-compat-data");
// const fs = require("fs");

const promise = bcd.javascript.builtins.Promise;

function getEarliest(supportObj) {
	const result = {};
	for (const browser in supportObj) {
		const data = supportObj[browser];
		if (Array.isArray(data)) {
			// Pick the first version_added
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

function getGithubUrl(pathArr) {
	return `https://github.com/mdn/browser-compat-data/blob/main/${pathArr.join("/")}.json`;
}

const info = {
	human: "Promise",
	es: getEsTag(promise.__compat.tags),
	urls: {
		spec: promise.__compat.spec_url,
		mdn: promise.__compat.mdn_url,
		github: getGithubUrl(["javascript", "builtins", "Promise"])
	},
	browsers: getEarliest(promise.__compat.support)
};

console.log(JSON.stringify(info, null, 2));

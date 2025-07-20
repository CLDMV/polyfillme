/**
 * Example usage of polyfillme module.
 */
const polyfillme = require("./src/index");

polyfillme({
	ecmaVersion: "es2018",
	files: ["src/**/*.js"],
	includedPolyfills: [],
	additionalPolyfills: ["Array.prototype.flat"]
}).then((polyfills) => {
	console.log("Required polyfills:", polyfills);
});

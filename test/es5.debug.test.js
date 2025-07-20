import polyfillme from "../src/index.js";

(async () => {
	const result = await polyfillme({
		ecmaVersion: "es5",
		files: ["test/testfile.js"],
		includedPolyfills: [],
		additionalPolyfills: [],
		writeToFile: false
	});
	console.log("polyfillme ES5 result:", result);
})();

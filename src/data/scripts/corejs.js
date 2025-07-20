const fs = require("fs");
const path = require("path");

const corejsDir = path.join(__dirname, "../corejs");
const outputFile = path.join(__dirname, "../corejs-feature-map.json");

function mergeCorejsJsonFiles() {
	const files = fs.readdirSync(corejsDir).filter((f) => f.endsWith(".json"));
	const merged = {};
	for (const file of files) {
		const filePath = path.join(corejsDir, file);
		const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
		Object.assign(merged, data);
	}
	fs.writeFileSync(outputFile, JSON.stringify(merged, null, "\t"));
	console.log(`Merged ${files.length} files into ${outputFile}`);
}

mergeCorejsJsonFiles();

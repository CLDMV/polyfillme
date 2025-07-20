# polyfillme

A Node.js module to scan your codebase for unsupported JavaScript features (based on ES/ECMA version) and generate a polyfill file for missing features.

## Features

- Scans files using AST parser (`espree`)
- Uses compatibility data (`core-js-compat`)
- Identifies unsupported features for a given ES/ECMA version
- Generates a polyfill file for missing features
- Supports custom polyfill sources

## Installation

```bash
npm install polyfillme core-js-compat fast-glob espree
```

## Usage

```js
const polyfillme = require("polyfillme");

polyfillme({
	ecmaVersion: "es2018",
	files: ["src/**/*.js"],
	includedPolyfills: ["Promise"],
	additionalPolyfills: ["Array.prototype.flat"]
}).then((polyfills) => {
	console.log("Required polyfills:", polyfills);
});
```

## API

### polyfillme(options)

- `ecmaVersion` (string): Target ES/ECMA version (e.g., 'es2018')
- `files` (string[]): List of file globs to scan
- `includedPolyfills` (string[]): Already included polyfills
- `additionalPolyfills` (string[]): Additional polyfills to include

Returns: `Promise<string[]>` - List of required polyfills

## Output

Generates a `polyfills.js` file with imports for required polyfills.

## License

MIT

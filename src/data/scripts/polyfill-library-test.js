// Test script for polyfill-library
const polyfillLibrary = require('polyfill-library');

async function testPolyfill(feature) {
	const polyfill = await polyfillLibrary.getPolyfillString({
		features: { [feature]: {} }
	});
	console.log(`Polyfill for ${feature}:\n`);
	console.log(polyfill);
}

// Example usage: test Array.prototype.findIndex
const feature = 'Array.prototype.findIndex';
testPolyfill(feature);

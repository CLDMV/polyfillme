/**
 *
 *	@Project: polyfillme
 *	@Filename: /src/data/scripts/polyfill-library-test.js
 *	@Date: 2025-07-20T03:32:53-07:00 (1753007573)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T12:17:03-07:00 (1790968623)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

// Test script for polyfill-library
const polyfillLibrary = require("polyfill-library");

async function testPolyfill(feature) {
	const polyfill = await polyfillLibrary.getPolyfillString({
		features: { [feature]: {} }
	});
	console.log(`Polyfill for ${feature}:\n`);
	console.log(polyfill);
}

// Example usage: test Array.prototype.findIndex
const feature = "Array.prototype.findIndex";
testPolyfill(feature);

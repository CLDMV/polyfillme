/**
 *
 *	@Project: polyfillme
 *	@Filename: /tests/testfile.js
 *	@Date: 2026-08-02T23:53:31-07:00 (1785740011)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T12:17:05-07:00 (1790968625)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

// ES1
var a = 1;
var b = 2;

// ES2
var c = a + b;
var d = Math.max(a, b);

// ES3
var arr = [1, 2, 3];
var hasTwo = arr.indexOf(2) !== -1;

// ES4 (not standardized, but for test completeness)
var es4_obj = { a: 1 };
var es4_keys = Object.keys(es4_obj);

// ES5
var strictMode = (function () {
	"use strict";
	return !this;
})();
var es5_json = JSON.stringify({ a: 1 });

// ES2015
var p = Promise.resolve(42);
var arrFrom = Array.from([1, 2, 3]);

// ES2016
var includes = [1, 2, 3].includes(2);
var pow = Math.pow(2, 2);

// ES2017
var values = Object.values({ a: 1, b: 2 });
var entries = Object.entries({ a: 1, b: 2 });

// ES2018
var ownDescriptors = Object.getOwnPropertyDescriptors({ a: 1 });
var asyncIter = (async function* () {
	yield 1;
})();

// ES2019
var flat = [[1], [2]].flat();
var fromEntries = Object.fromEntries([
	["a", 1],
	["b", 2]
]);

// ES2020
var globalObj = globalThis;
var bigInt = BigInt(42);

// ES2021
var replaced = "aabb".replaceAll("a", "b");
var promiseAny = Promise.any([Promise.resolve(1)]);

// ES2022
var hasOwn = Object.hasOwn({ a: 1 }, "a");
var at = [1, 2, 3].at(1);

// ES2023
var toReversed = [1, 2, 3].toReversed();
var toSorted = [3, 2, 1].toSorted();

// ES2024
var isWellFormed = "abc".isWellFormed();
var toWellFormed = "abc".toWellFormed();

// ES2025 (hypothetical)
var clamp = Math.clamp(5, 1, 10);
var groupBy = [1, 2, 3].groupBy((x) => x % 2);

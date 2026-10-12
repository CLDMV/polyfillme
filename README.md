# polyfillme

**polyfillme** scans your JavaScript source for the built-ins and prototype methods it actually uses, works out which of them are missing from a target ES/ECMA version, and generates the polyfill code for exactly those features.

Feature availability comes from MDN browser-compat data bundled with the package, and the polyfill code comes from [`polyfill-library`](https://www.npmjs.com/package/polyfill-library) or the Cloudflare polyfill CDN. Instead of shipping a blanket polyfill bundle, you ship only what your code needs for the ES version you target.

> _Polyfill what your code uses, nothing more._

[![npm version]][npm_version_url] [![npm downloads]][npm_downloads_url] [![GitHub downloads]][github_downloads_url] [![Last commit]][last_commit_url] [![npm last update]][npm_last_update_url] [![coverage]][coverage_url]

[![Contributors]][contributors_url] [![Sponsor shinrai]][sponsor_url]

---

## ✨ What's New

### Latest: v1.0.9 (October 2026)

- **Security update to a dev-only dependency** — `brace-expansion` 5.0.12 fixes a quadratic-time denial of service (GHSA-q2hr-2g5m-vwhr). It is reached only through the lint and test toolchain, so installed copies of polyfillme were not exposed (#64).
- **Dev dependency updates** — `vitest` 5.0.3, `eslint` 10.12.0, `globals` 17.13.0, `@cldmv/vitest-runner` 1.5.3 and the jsonv packages. No runtime code changed; running the tests locally needs Node.js 22.12 or newer (#65, #66, #68, #70).
- [View full v1.0.9 Changelog](https://github.com/CLDMV/polyfillme/blob/master/docs/changelog/v1/v1.0.9.md)

### Recent Releases

- **v1.0.8** (October 2026) — relicensed under Apache-2.0, a changelog for every version, and header tooling on fix-headers 2.2.0; no runtime change (#56, #60, #61) ([Changelog](https://github.com/CLDMV/polyfillme/blob/master/docs/changelog/v1/v1.0.8.md))
- **v1.0.7** (October 2026) — CI: the in-repo PR mirror job runs instead of being skipped; dev-dependency updates; no runtime change (#54) ([Changelog](https://github.com/CLDMV/polyfillme/blob/master/docs/changelog/v1/v1.0.7.md))
- **v1.0.6** (October 2026) — uniform CLDMV file headers, workflows synced with the v4.29.2 templates, bundle-size reporting, and the test toolchain on Vitest 5; no runtime behavior change (#44, #45, #50) ([Changelog](https://github.com/CLDMV/polyfillme/blob/master/docs/changelog/v1/v1.0.6.md))
- **v1.0.5** (September 2026) — errors thrown for glob, read and parse failures now carry the original error as `cause`; CI matrix raised for Vitest 5 ([Changelog](https://github.com/CLDMV/polyfillme/blob/master/docs/changelog/v1/v1.0.5.md))

📚 **For complete version history and detailed release notes, see the [docs/changelog/](https://github.com/CLDMV/polyfillme/tree/master/docs/changelog/) folder.**

---

## 🚀 Key Features

- **AST-based scanning** — parses each file with [`espree`](https://www.npmjs.com/package/espree) and walks the tree for used globals, static methods and prototype methods (for example `Promise`, `Object.entries`, `Array.prototype.includes`).
- **ES-version aware** — compares used features against MDN browser-compat data for the target version and every version before it (`es1`, `es3`, `es5`, `es2015` … `es2024`).
- **Only what is missing** — generates polyfills for features newer than the target, minus the ones you already ship (`includedPolyfills`), plus any you force in (`additionalPolyfills`).
- **Pluggable polyfill source** — `polyfill-library` by default, or the Cloudflare polyfill CDN.
- **File or in-memory output** — writes `polyfills.js` (or a path you choose) and also returns the generated code.

---

## 📦 Installation

### Requirements

- **Node.js `^20.19.0`, `^22.13.0` or `>=24`** — the range required by the bundled `espree` 11 parser.
- polyfillme is a CommonJS package: load it with `require("polyfillme")`, or with `import polyfillme from "polyfillme"` from an ES module.

### Install

```bash
npm install polyfillme
```

> [!NOTE]
> polyfillme is not yet available on the npm registry. Until it is, install it from GitHub:
>
> ```bash
> npm install github:CLDMV/polyfillme
> ```

---

## 🚀 Quick Start

```js
const polyfillme = require("polyfillme");

polyfillme({
	ecmaVersion: "es2018",
	files: ["src/**/*.js"],
	includedPolyfills: ["Promise"],
	additionalPolyfills: ["Array.prototype.flat"]
}).then((result) => {
	console.log("Required polyfills:", result.polyfills);
});
```

This scans every file matching `src/**/*.js`, writes the polyfill code to `polyfills.js` in the current working directory, and resolves with the list of polyfilled features and the generated code.

---

## 📖 API

### `polyfillme(options)`

| Option                | Type       | Required | Description                                                                                                                              |
| --------------------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ecmaVersion`         | `string`   | yes      | Target ES/ECMA version, for example `"es5"` or `"es2018"`. Features from this version and all earlier versions are treated as available. |
| `files`               | `string[]` | yes      | File paths or glob patterns to scan.                                                                                                     |
| `includedPolyfills`   | `string[]` | yes      | Polyfills the project already includes; these are left out of the output.                                                                |
| `additionalPolyfills` | `string[]` | yes      | Extra polyfills to include even if the scan does not detect them.                                                                        |
| `source`              | `string`   | no       | `"polyfill-library"` (default) or `"cloudflare"` (fetches from `cdnjs.cloudflare.com/polyfill`).                                         |
| `writeToFile`         | `boolean`  | no       | Output is written to disk unless this is `false`.                                                                                        |
| `filePath`            | `string`   | no       | Output path. Defaults to `polyfills.js` in the current working directory.                                                                |

Returns `Promise<{ polyfills, content, shams, notFound }>`:

- `polyfills` (`string[]`) — the features polyfilled, after applying `includedPolyfills` and `additionalPolyfills`.
- `content` (`string`) — the generated polyfill code.
- `shams` (`string[]`) and `notFound` (`string[]`) — reserved for features with only partial polyfills and features with no polyfill at all. Both are currently always empty.

The call rejects when an option is missing or has the wrong type, or when a file cannot be read or parsed. Errors from globbing, reading and parsing keep the original error as `cause`. Scanned files are parsed as ES2020 scripts.

Set `POLYFILLME_DEBUG=1` to log file resolution, parsing and AST details. With `NODE_ENV=production`, `polyfill-library` output is minified.

## 📄 Output

The output is the concatenated polyfill code for every needed feature, each block preceded by a `// polyfill-library for <feature>` (or `// Cloudflare polyfill for <feature>`) comment. It is written to `polyfills.js` by default and returned as `content`.

---

## 📚 Documentation

- **[Changelog](https://github.com/CLDMV/polyfillme/tree/master/docs/changelog/)** — release notes for every version

[![CodeFactor]][codefactor_url] [![OpenSSF Scorecard]][ossf_scorecard_url] [![npms.io score]][npms_url] [![npm unpacked size]][npm_size_url] [![Repo size]][repo_size_url]

---

## 🤝 Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/CLDMV/polyfillme). Run `npm test`, `npm run lint` and `npm run format:check` before opening a pull request.

[![Contributors]][contributors_url] [![Sponsor shinrai]][sponsor_url]

---

## 🔗 Links

- **npm**: [polyfillme](https://www.npmjs.com/package/polyfillme)
- **GitHub**: [CLDMV/polyfillme](https://github.com/CLDMV/polyfillme)
- **Issues**: [GitHub Issues](https://github.com/CLDMV/polyfillme/issues)
- **Changelog**: [docs/changelog/](https://github.com/CLDMV/polyfillme/tree/master/docs/changelog/)

---

## 📄 License

[![GitHub license]][github_license_url] [![npm license]][npm_license_url]

Apache-2.0 © Shinrai / CLDMV. See [LICENSE](https://github.com/CLDMV/polyfillme/blob/master/LICENSE) for the full text.

[npm version]: https://img.shields.io/npm/v/polyfillme.svg?style=for-the-badge&logo=npm&logoColor=white&labelColor=CB3837
[npm_version_url]: https://www.npmjs.com/package/polyfillme
[npm downloads]: https://img.shields.io/npm/dm/polyfillme.svg?style=for-the-badge&logo=npm&logoColor=white&labelColor=CB3837
[npm_downloads_url]: https://www.npmjs.com/package/polyfillme
[github downloads]: https://img.shields.io/github/downloads/CLDMV/polyfillme/total?style=for-the-badge&logo=github&logoColor=white&labelColor=181717
[github_downloads_url]: https://github.com/CLDMV/polyfillme/releases
[last commit]: https://img.shields.io/github/last-commit/CLDMV/polyfillme?style=for-the-badge&logo=github&logoColor=white&labelColor=181717
[last_commit_url]: https://github.com/CLDMV/polyfillme/commits
[npm last update]: https://img.shields.io/npm/last-update/polyfillme?style=for-the-badge&logo=npm&logoColor=white&labelColor=CB3837
[npm_last_update_url]: https://www.npmjs.com/package/polyfillme
[coverage]: https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FCLDMV%2Fpolyfillme%2Fbadges%2Fcoverage.json&style=for-the-badge&logo=vitest&logoColor=white
[coverage_url]: https://github.com/CLDMV/polyfillme/blob/badges/coverage.json
[codefactor]: https://img.shields.io/codefactor/grade/github/CLDMV/polyfillme?style=for-the-badge&logo=codefactor&logoColor=white&labelColor=F44A6A
[codefactor_url]: https://www.codefactor.io/repository/github/cldmv/polyfillme
[openssf scorecard]: https://img.shields.io/ossf-scorecard/github.com/CLDMV/polyfillme?style=for-the-badge&label=OpenSSF%20Scorecard
[ossf_scorecard_url]: https://scorecard.dev/viewer/?uri=github.com/CLDMV/polyfillme
[npms.io score]: https://img.shields.io/npms-io/final-score/polyfillme?style=for-the-badge&logo=npms&logoColor=white&labelColor=0B5D57
[npms_url]: https://npms.io/search?q=polyfillme
[npm unpacked size]: https://img.shields.io/npm/unpacked-size/polyfillme.svg?style=for-the-badge&logo=npm&logoColor=white&labelColor=CB3837
[npm_size_url]: https://www.npmjs.com/package/polyfillme
[repo size]: https://img.shields.io/github/repo-size/CLDMV/polyfillme?style=for-the-badge&logo=github&logoColor=white&labelColor=181717
[repo_size_url]: https://github.com/CLDMV/polyfillme
[github license]: https://img.shields.io/github/license/CLDMV/polyfillme.svg?style=for-the-badge&logo=github&logoColor=white&labelColor=181717
[github_license_url]: https://github.com/CLDMV/polyfillme/blob/HEAD/LICENSE
[npm license]: https://img.shields.io/npm/l/polyfillme.svg?style=for-the-badge&logo=npm&logoColor=white&labelColor=CB3837
[npm_license_url]: https://www.npmjs.com/package/polyfillme
[contributors]: https://img.shields.io/github/contributors/CLDMV/polyfillme.svg?style=for-the-badge&logo=github&logoColor=white&labelColor=181717
[contributors_url]: https://github.com/CLDMV/polyfillme/graphs/contributors
[sponsor shinrai]: https://img.shields.io/github/sponsors/shinrai?style=for-the-badge&logo=githubsponsors&logoColor=white&labelColor=EA4AAA&label=Sponsor
[sponsor_url]: https://github.com/sponsors/shinrai

const polyfillme = require('../src/index');
const fs = require('fs');
const path = require('path');
const testDir = path.join(__dirname, '../test');
const testFile = path.join(testDir, 'testfile.js');

if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
fs.writeFileSync(testFile, [
  'const arr = [1, 2, 3];',
  'arr.includes(2);',
  'Promise.resolve(42);',
  'Object.entries({ a: 1 });'
].join('\n'));

(async () => {
  const result = await polyfillme({
    ecmaVersion: 'es5',
    files: [testFile],
    includedPolyfills: [],
    additionalPolyfills: [],
    writeToFile: false
  });
  console.log('Polyfills returned by polyfillme for ES5:');
  console.log(result.polyfills);
  console.log('Includes Promise?', result.polyfills.some(p => p.toLowerCase().includes('promise')));
  console.log('Includes Array.prototype.includes?', result.polyfills.some(p => p.toLowerCase().includes('includes')));
})();

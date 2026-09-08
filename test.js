// node test.js
const assert = require('assert');
const Module = require('module');

// extension.js requires 'vscode', which only exists inside VS Code.
const load = Module._load;
Module._load = (req, ...rest) => (req === 'vscode' ? {} : load(req, ...rest));
const { buildReference } = require('./extension.js');

const cfg = (o = {}) => ({
  get: (k) => ({ prefixAt: false, pathSeparator: 'slash', lineSeparator: '#', rangeConnector: 'dash', ...o }[k]),
});
const sel = (sl, sc, el, ec) => ({ start: { line: sl, character: sc }, end: { line: el, character: ec } });

// single line; the slash conversion only applies where the platform uses backslashes
const win = process.platform === 'win32';
assert.strictEqual(buildReference('a\\b.js', [sel(4, 0, 4, 7)], cfg()), win ? 'a/b.js#5' : 'a\\b.js#5');
// multi-line, and end stopping at column 0 does not count the trailing line
assert.strictEqual(buildReference('b.js', [sel(0, 0, 3, 0)], cfg()), 'b.js#1-3');
assert.strictEqual(buildReference('b.js', [sel(0, 0, 3, 2)], cfg()), 'b.js#1-4');
// multi-cursor: sorted by caller, duplicates collapsed
assert.strictEqual(buildReference('b.js', [sel(0, 0, 0, 1), sel(9, 0, 11, 0)], cfg()), 'b.js#1\nb.js#10-11');
assert.strictEqual(buildReference('b.js', [sel(2, 0, 2, 1), sel(2, 3, 2, 4)], cfg()), 'b.js#3');
// unknown/invalid setting values fall back to the documented defaults
assert.strictEqual(buildReference('b.js', [sel(0, 0, 0, 1)], cfg({ lineSeparator: '!', rangeConnector: 'x', prefixAt: 'yes', pathSeparator: 'nope' })), 'b.js#1');
// options
assert.strictEqual(
  buildReference('a/b.js', [sel(1, 0, 2, 5)], cfg({ prefixAt: true, pathSeparator: 'backslash', lineSeparator: ':', rangeConnector: 'tilde' })),
  '@a\\b.js:2~3'
);

console.log('ok');

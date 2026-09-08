// node test.js
const assert = require('assert');
const Module = require('module');

// extension.js requires 'vscode', which only exists inside VS Code.
const load = Module._load;
const vscode = {};
Module._load = (req, ...rest) => (req === 'vscode' ? vscode : load(req, ...rest));
const { buildReference, readOptions, activate } = require('./extension.js');
Module._load = load;

const cfg = (o = {}) => ({
  get: (k) => ({ prefixAt: 'none', pathSeparator: 'slash', lineSeparator: '#', rangeConnector: 'dash', ...o }[k]),
});
const opts = (o) => readOptions(cfg(o));
const sel = (sl, sc, el, ec) => ({ start: { line: sl, character: sc }, end: { line: el, character: ec } });

// single line; the slash conversion only applies where the platform uses backslashes
const win = process.platform === 'win32';
assert.strictEqual(buildReference('a\\b.js', [sel(4, 0, 4, 7)], opts()), win ? 'a/b.js#5' : 'a\\b.js#5');
// multi-line, and end stopping at column 0 does not count the trailing line
assert.strictEqual(buildReference('b.js', [sel(0, 0, 3, 0)], opts()), 'b.js#1-3');
assert.strictEqual(buildReference('b.js', [sel(0, 0, 3, 2)], opts()), 'b.js#1-4');
// multi-cursor: sorted by caller, duplicates collapsed
assert.strictEqual(buildReference('b.js', [sel(0, 0, 0, 1), sel(9, 0, 11, 0)], opts()), 'b.js#1\nb.js#10-11');
assert.strictEqual(buildReference('b.js', [sel(2, 0, 2, 1), sel(2, 3, 2, 4)], opts()), 'b.js#3');
// unknown/invalid setting values fall back to the documented defaults
assert.strictEqual(buildReference('b.js', [sel(0, 0, 0, 1)], opts({ lineSeparator: '!', rangeConnector: 'x', prefixAt: 'yes', pathSeparator: 'nope' })), 'b.js#1');
// options
assert.strictEqual(
  buildReference('a/b.js', [sel(1, 0, 2, 5)], opts({ prefixAt: '@', pathSeparator: 'backslash', lineSeparator: ':', rangeConnector: 'tilde' })),
  '@a\\b.js:2~3'
);

assert.strictEqual(buildReference('src/a.js', [], opts({ prefixAt: '@' })), '@src/a.js');
// pre-0.1.0 boolean prefixAt still works
assert.strictEqual(buildReference('src/a.js', [], opts({ prefixAt: true })), '@src/a.js');

async function checkCommands() {
  const commands = new Map();
  const copied = [], warnings = [], errors = [], statuses = [];
  let settings = {}, writeFails = false;
  const file = (name, scheme = 'file') => ({ scheme, fsPath: `/project/${name}` });
  vscode.FileType = { File: 1, Directory: 2 };
  vscode.commands = { registerCommand: (id, fn) => { commands.set(id, fn); return { dispose() {} }; } };
  vscode.workspace = {
    getConfiguration: () => cfg(settings),
    asRelativePath: (uri, includeRoot) => {
      assert.strictEqual(includeRoot, false);
      return uri.fsPath.replace(/^\/project\//, '');
    },
    fs: { stat: async (uri) => ({ type: uri.fsPath.endsWith('/folder') ? 2 : 1 }) },
  };
  vscode.env = { clipboard: { writeText: async (value) => {
    if (writeFails) throw new Error('clipboard unavailable');
    copied.push(value);
  } } };
  vscode.window = {
    showWarningMessage: (message) => warnings.push(message),
    showErrorMessage: (message) => errors.push(message),
    setStatusBarMessage: (message) => statuses.push(message),
  };
  const context = { subscriptions: [] };
  activate(context);
  const run = (command, ...args) => commands.get(`copyAiRef.${command}`)(...args);
  const selection = (start, end) => {
    const value = sel(start, 0, end, 1);
    value.start.compareTo = (other) => start - other.line;
    return value;
  };
  vscode.window.activeTextEditor = {
    document: { uri: file('src/a.js') },
    selections: [selection(12, 18), selection(2, 2), selection(2, 2)],
  };
  await run('copy');
  assert.strictEqual(copied.at(-1), 'src/a.js#3\nsrc/a.js#13-19');
  await run('copyAbsolute');
  assert.strictEqual(copied.at(-1), '/project/src/a.js#3\n/project/src/a.js#13-19');
  settings = { pathMode: 'absolute' };
  await run('copy');
  assert.strictEqual(copied.at(-1), '/project/src/a.js#3\n/project/src/a.js#13-19');
  settings = { pathMode: 'invalid' };
  await run('copy');
  assert.strictEqual(copied.at(-1), 'src/a.js#3\nsrc/a.js#13-19');

  // Explorer ignores the active editor and does not attach its line numbers.
  const a = file('src/a.js'), b = file('src/b.js');
  settings = { prefixAt: '@' };
  await run('copyFiles', a, [a, b]);
  assert.strictEqual(copied.at(-1), '@src/a.js\n@src/b.js');
  await run('copyFilesAbsolute', b);
  assert.strictEqual(copied.at(-1), '@/project/src/b.js');
  const count = copied.length;
  await run('copyFiles', a, [a, file('folder')]);
  await run('copyFiles', file('virtual', 'untitled'));
  vscode.window.activeTextEditor.document.uri = file('virtual', 'untitled');
  await run('copy');
  vscode.window.activeTextEditor = undefined;
  await run('copy');
  assert.strictEqual(warnings.length, 4);
  assert.strictEqual(copied.length, count);
  writeFails = true;
  const statusCount = statuses.length;
  await run('copyFiles', a);
  assert.strictEqual(errors.length, 1);
  assert.strictEqual(statuses.length, statusCount);
  assert.strictEqual(copied.length, count);
  const manifest = require('./package.json');
  assert.deepStrictEqual([...commands.keys()].sort(), manifest.contributes.commands.map((item) => item.command).sort());
  assert.strictEqual(manifest.contributes.keybindings[0].mac, 'cmd+alt+c');
  // Every enum setting previews its output, one line per choice, in the settings dropdown.
  for (const [key, value] of Object.entries(manifest.contributes.configuration.properties)) {
    assert.ok(value.markdownDescription, `${key} has no markdownDescription`);
    if (value.enum) assert.strictEqual(value.markdownEnumDescriptions?.length, value.enum.length, key);
  }
  console.log('ok: reference formats, editor and Explorer commands, errors, manifest, setting previews');
}

checkCommands().catch((error) => { console.error(error); process.exitCode = 1; });

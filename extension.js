const vscode = require('vscode');

// Read and normalise every setting once per command, not once per file.
function readOptions(config) {
  // A boolean prefixAt is the pre-0.1.0 value; treat it as the '@' choice.
  const rawPrefix = config.get('prefixAt');
  const raw = config.get('pathSeparator');
  return {
    prefix: rawPrefix === '@' || rawPrefix === true ? '@' : '',
    pathSeparator: ['system', 'slash', 'backslash'].includes(raw) ? raw : 'slash',
    lineSeparator: config.get('lineSeparator') === ':' ? ':' : '#',
    rangeConnector: config.get('rangeConnector') === 'tilde' ? '~' : '-',
  };
}

function buildReference(relativePath, selections, options) {
  const { prefix, pathSeparator, lineSeparator, rangeConnector } = options;

  let path = relativePath;
  if (pathSeparator === 'slash' && process.platform === 'win32') {
    // Only Windows yields backslash separators; on POSIX a backslash is a filename character.
    path = path.replace(/\\/g, '/');
  } else if (pathSeparator === 'backslash') {
    path = path.replace(/\//g, '\\');
  }

  if (selections.length === 0) return `${prefix}${path}`;

  const refs = selections.map((selection) => {
    let effectiveEndLine = selection.end.line;
    if (selection.end.character === 0 && selection.end.line > selection.start.line) {
      effectiveEndLine -= 1;
    }

    const startLine = selection.start.line + 1;
    const endLine = effectiveEndLine + 1;

    const rangeSuffix = startLine === endLine
      ? `${lineSeparator}${startLine}`
      : `${lineSeparator}${startLine}${rangeConnector}${endLine}`;

    return `${prefix}${path}${rangeSuffix}`;
  });

  return [...new Set(refs)].join('\n');
}

async function copyReference(mode, explorer, uri, selectedUris) {
  try {
    const editor = vscode.window.activeTextEditor;
    if (explorer ? !uri : !editor) {
      vscode.window.showWarningMessage('Copy AI Ref: select a file or open an editor first');
      return;
    }

    const uris = explorer ? (selectedUris?.length ? selectedUris : [uri]) : [editor.document.uri];
    if (uris.some((item) => item.scheme !== 'file')) {
      vscode.window.showWarningMessage('Copy AI Ref: only local file references are supported');
      return;
    }
    if (explorer) {
      const stats = await Promise.all(uris.map((item) => vscode.workspace.fs.stat(item)));
      if (stats.some((stat) => !(stat.type & vscode.FileType.File))) {
        vscode.window.showWarningMessage('Copy AI Ref: select files only, without folders');
        return;
      }
    }

    const selections = explorer ? [] : [...editor.selections].sort((a, b) => a.start.compareTo(b.start));
    const config = vscode.workspace.getConfiguration('copyAiRef');
    const options = readOptions(config);
    const pathMode = mode === 'absolute' ? 'absolute' : config.get('pathMode');
    const result = uris.map((item) => {
      // A workspace display name is not a resolvable path component.
      const path = pathMode === 'absolute' ? item.fsPath : vscode.workspace.asRelativePath(item, false);
      return buildReference(path, selections, options);
    }).join('\n');
    await vscode.env.clipboard.writeText(result);
    vscode.window.setStatusBarMessage(`Copied: ${result.replace(/\n/g, ' ')}`, 3000);
  } catch (err) {
    vscode.window.showErrorMessage(`Copy AI Ref: failed to copy — ${err}`);
  }
}

function activate(context) {
  for (const [command, mode, explorer] of [
    ['copy', 'default', false], ['copyAbsolute', 'absolute', false],
    ['copyFiles', 'default', true], ['copyFilesAbsolute', 'absolute', true],
  ]) {
    context.subscriptions.push(vscode.commands.registerCommand(`copyAiRef.${command}`,
      (uri, selectedUris) => copyReference(mode, explorer, uri, selectedUris)));
  }
}

function deactivate() {}

module.exports = { activate, deactivate, buildReference, readOptions };

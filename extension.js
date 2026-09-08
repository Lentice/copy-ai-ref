const vscode = require('vscode');

function buildReference(relativePath, selections, config) {
  const prefixAt = config.get('prefixAt') === true;
  const raw = config.get('pathSeparator');
  const pathSeparator = ['system', 'slash', 'backslash'].includes(raw) ? raw : 'slash';
  const lineSeparator = config.get('lineSeparator') === ':' ? ':' : '#';
  const rangeConnector = config.get('rangeConnector') === 'tilde' ? '~' : '-';

  let path = relativePath;
  if (pathSeparator === 'slash' && process.platform === 'win32') {
    // Only Windows yields backslash separators; on POSIX a backslash is a filename character.
    path = path.replace(/\\/g, '/');
  } else if (pathSeparator === 'backslash') {
    path = path.replace(/\//g, '\\');
  }

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

    return `${prefixAt ? '@' : ''}${path}${rangeSuffix}`;
  });

  return [...new Set(refs)].join('\n');
}

function activate(context) {
  const disposable = vscode.commands.registerCommand('copyAiRef.copy', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Copy AI Ref: no active editor');
      return;
    }

    const uri = editor.document.uri;
    if (uri.scheme !== 'file') {
      vscode.window.showWarningMessage(`Copy AI Ref: ${uri.scheme} documents have no file path`);
      return;
    }

    const config = vscode.workspace.getConfiguration('copyAiRef');
    // includeWorkspaceFolder=false: the folder's display name is not a resolvable path component.
    const relativePath = vscode.workspace.asRelativePath(uri, false);
    const selections = [...editor.selections].sort((a, b) => a.start.compareTo(b.start));
    const result = buildReference(relativePath, selections, config);

    vscode.env.clipboard.writeText(result).then(
      () => vscode.window.setStatusBarMessage(`Copied: ${result.replace(/\n/g, ' ')}`, 3000),
      (err) => vscode.window.showErrorMessage(`Copy AI Ref: failed to copy — ${err}`)
    );
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = { activate, deactivate, buildReference };

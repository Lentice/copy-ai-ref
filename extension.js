const vscode = require('vscode');

function buildReference(editor, config) {
  const prefixAt = config.get('prefixAt');
  const pathSeparator = config.get('pathSeparator');
  const lineSeparator = config.get('lineSeparator');
  const rangeConnector = config.get('rangeConnector') === 'tilde' ? '~' : '-';

  let relativePath = vscode.workspace.asRelativePath(editor.document.uri);
  if (pathSeparator === 'slash') {
    relativePath = relativePath.replace(/\\/g, '/');
  } else if (pathSeparator === 'backslash') {
    relativePath = relativePath.replace(/\//g, '\\');
  }

  const selection = editor.selection;
  let effectiveEndLine = selection.end.line;
  if (selection.end.character === 0 && selection.end.line > selection.start.line) {
    effectiveEndLine -= 1;
  }

  const startLine = selection.start.line + 1;
  const endLine = effectiveEndLine + 1;

  const rangeSuffix = startLine === endLine
    ? `${lineSeparator}${startLine}`
    : `${lineSeparator}${startLine}${rangeConnector}${endLine}`;

  return `${prefixAt ? '@' : ''}${relativePath}${rangeSuffix}`;
}

function activate(context) {
  const disposable = vscode.commands.registerCommand('copyAiRef.copy', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Copy AI Ref: no active editor');
      return;
    }

    const config = vscode.workspace.getConfiguration('copyAiRef');
    const result = buildReference(editor, config);

    vscode.env.clipboard.writeText(result);
    vscode.window.setStatusBarMessage(`Copied: ${result}`, 3000);
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = { activate, deactivate };

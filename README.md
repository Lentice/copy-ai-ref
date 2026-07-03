# Copy AI Ref

Copies the current selection as an AI-assistant-friendly path+line reference
(e.g. `@odoo/addons/crm_extension/models/crm_prospect_category.py#13-19`),
so it can be pasted directly into tools like Claude Code or Codex.

## Usage

Run **Copy AI Ref** from the Command Palette (`Ctrl+Shift+P`). Bind it to a
key of your choice in Keyboard Shortcuts if you use it often.

- No selection: uses the line the cursor is on.
- Selection within/across lines: uses the selected line range.

## Settings

| Setting | Values | Default |
|---|---|---|
| `copyAiRef.prefixAt` | boolean | `true` |
| `copyAiRef.pathSeparator` | `system` / `slash` / `backslash` | `slash` |
| `copyAiRef.lineSeparator` | `#` / `:` | `#` |
| `copyAiRef.rangeConnector` | `dash` / `tilde` | `dash` |

## Install

```
npx @vscode/vsce package
code --install-extension copy-ai-ref-0.0.1.vsix
```

# Copy AI Ref

Copies the current selection as an AI-assistant-friendly path+line reference
(e.g. `odoo/addons/crm_extension/models/crm_prospect_category.py#13-19`),
so it can be pasted directly into tools like Claude Code or Codex.

Installed once, globally — works in every VS Code project, no per-repo setup.

## Usage

1. Select a range of lines, or just place the cursor on a line (no selection
   needed).
2. Run **Copy AI Ref** from the Command Palette (`Ctrl+Shift+P` →
   "Copy AI Ref"), or use a keyboard shortcut (see below).
3. The reference is copied to the clipboard, and briefly echoed in the
   status bar for confirmation.

Behavior:

- No selection: uses the line the cursor is on.
- Selection within/across lines: uses the selected line range.
- No workspace open, or the file is outside any open workspace folder: the
  file's absolute path is used instead of a relative one.

### Examples (defaults)

- Single line: `odoo/addons/crm_extension/models/crm_prospect_category.py#13`
- Multi-line: `odoo/addons/crm_extension/views/crm_lead_views.xml#152-153`
- With `copyAiRef.prefixAt` enabled: `@odoo/addons/crm_extension/models/crm_prospect_category.py#13`

## Keyboard Shortcut

No shortcut is bound by default — bind your own so it doesn't clash with
existing keybindings:

1. Command Palette → **Preferences: Open Keyboard Shortcuts (JSON)**.
2. Add an entry, e.g.:

```json
{
  "key": "ctrl+alt+c",
  "command": "copyAiRef.copy",
  "when": "editorTextFocus"
}
```

3. Save. This is a User-level keybinding, so it works in every project.

## Settings

| Setting | Values | Default |
|---|---|---|
| `copyAiRef.prefixAt` | boolean | `false` |
| `copyAiRef.pathSeparator` | `system` / `slash` / `backslash` | `slash` |
| `copyAiRef.lineSeparator` | `#` / `:` | `#` |
| `copyAiRef.rangeConnector` | `dash` / `tilde` | `dash` |

## Install

Install **Copy AI Ref** from the VS Code Marketplace, or search for
`Copy AI Ref` in the Extensions view.

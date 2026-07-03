# Copy AI Ref — Design Spec

Date: 2026-07-03

## Problem

AI coding assistants (Claude Code, Codex, etc.) can jump straight to a file/line
reference when it's pasted in a compact form, e.g. `@path/to/file.py#13-19`.
VS Code's built-in "Copy Path" commands (Copy Path, Copy Relative Path,
GitLens Copy Permalink, ...) all use fixed formats (`file:line`, `file#Lline`,
GitHub permalinks) and none of them expose a configurable template. No
existing popular extension fills this gap.

The goal is a small, personal VS Code extension — installed once, globally —
that copies the current selection as an AI-assistant-friendly path+line
reference, in any project, without per-project setup.

## Non-goals

- Not tied to Claude specifically — works for any AI tool that accepts
  `path#line` style references.
- Not a general path-copy replacement; only adds a new command alongside
  VS Code's existing Copy Path family.
- No multi-selection (multi-cursor) output — only the primary selection.
- No absolute-path option — always relative to the workspace root.

## Repo / distribution

- Standalone repo: `D:\Work\Code\vscode-extensions\copy-ai-ref` (own git
  history, unrelated to any single work project).
- Packaged with `vsce package` into a `.vsix` and installed globally via
  `code --install-extension copy-ai-ref-x.y.z.vsix` (or VS Code's
  "Install from VSIX" UI).
- Because it's a normal (non-workspace-scoped) extension with User-level
  settings, once installed it is available and consistently configured in
  every VS Code window/project — no per-repo setup. Re-package + re-install
  to pick up future changes.

## Extension shape

- Plain JS extension (no TypeScript/webpack build step — kept minimal given
  the small surface area).
- `activationEvents: ["onCommand:copyAiRef.copy"]` (lazy activation).
- One command: `copyAiRef.copy`, Command Palette title `Copy AI Ref`.
- No default keybinding shipped; user binds their own key in
  `keybindings.json` if desired.

## Behavior

1. Read `vscode.window.activeTextEditor`. If there is none, show a warning
   message (`No active editor`) and stop.
2. Compute the path via `vscode.workspace.asRelativePath(document.uri)`.
   - If no workspace folder is open, this already falls back to the bare
     file name (built-in VS Code behavior) — no extra handling needed.
3. Normalize path separators per `copyAiRef.pathSeparator`:
   - `slash` (default): replace `\` with `/`
   - `backslash`: replace `/` with `\`
   - `system`: leave as returned by `asRelativePath` (native OS separator)
4. Read `editor.selection` (primary selection only):
   - `start = selection.start.line + 1`
   - `end = selection.end.line + 1`
   - No special-casing for a selection whose end lands on column 0 of the
     next line (e.g. triple-click line selection) — raw line numbers are
     used as-is. Revisit only if this proves annoying in practice.
5. Build the line-range suffix:
   - `start === end` → `${lineSeparator}${start}`
   - otherwise → `${lineSeparator}${start}${rangeConnector}${end}`
   - `lineSeparator` from `copyAiRef.lineSeparator` (`#` default, or `:`)
   - `rangeConnector` from `copyAiRef.rangeConnector` (`-` for `dash`
     default, `~` for `tilde`)
6. Prepend `@` when `copyAiRef.prefixAt` is `true` (default `true`).
7. Final string: `${prefixAt ? '@' : ''}${normalizedPath}${suffix}`.
8. Write the string to the clipboard via `vscode.env.clipboard.writeText`.
9. Show a transient info message (or status bar message) echoing the copied
   string, for confirmation.

## Settings (`contributes.configuration`)

| Key | Type | Values | Default |
|---|---|---|---|
| `copyAiRef.prefixAt` | boolean | — | `true` |
| `copyAiRef.pathSeparator` | enum | `system`, `slash`, `backslash` | `slash` |
| `copyAiRef.lineSeparator` | enum | `#`, `:` | `#` |
| `copyAiRef.rangeConnector` | enum | `dash`, `tilde` | `dash` |

`dash`/`tilde` map internally to the literal characters `-` and `~`.

## Examples (defaults)

- Single line: `@odoo/addons/crm_extension/models/crm_prospect_category.py#13`
- Multi-line: `@odoo/addons/crm_extension/views/crm_lead_views.xml#152-153`

## Testing

- Manual smoke test: open a workspace, select a single line, multiple lines,
  and no selection (cursor only) at various nested paths; verify clipboard
  content for each of the 8 setting combinations (2×2×2, excluding
  `pathSeparator` variants which are visually easy to eyeball on Windows).
- No workspace open (single file mode): verify it falls back to filename.

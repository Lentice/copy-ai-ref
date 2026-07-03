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
   - When no workspace folder is open, or the file isn't inside any open
     workspace folder, `asRelativePath` returns the input unchanged (the
     file's absolute path) — this is the built-in VS Code behavior, and is
     the desired fallback here, so no extra handling is needed.
3. Normalize path separators per `copyAiRef.pathSeparator`:
   - `slash` (default): replace `\` with `/`
   - `backslash`: replace `/` with `\`
   - `system`: leave as returned by `asRelativePath` (native OS separator)
4. Read `editor.selection` (primary selection only):
   - No highlighted text (collapsed selection, i.e. just the cursor)
     naturally resolves to a single line: `start === end === selection.active.line + 1`.
   - Compute `effectiveEndLine = selection.end.line`; if
     `selection.end.character === 0 && selection.end.line > selection.start.line`,
     decrement it by 1. This corrects the common case where selecting a
     whole line (e.g. triple-click, or Home + Shift+Down) makes VS Code
     report the selection end as column 0 of the *next* line — without this
     adjustment a single selected line would wrongly render as a 2-line
     range.
   - `start = selection.start.line + 1`
   - `end = effectiveEndLine + 1`
5. Build the line-range suffix:
   - `start === end` → `${lineSeparator}${start}`
   - otherwise → `${lineSeparator}${start}${rangeConnector}${end}`
   - `lineSeparator` from `copyAiRef.lineSeparator` (`#` default, or `:`)
   - `rangeConnector` from `copyAiRef.rangeConnector` (`-` for `dash`
     default, `~` for `tilde`)
6. Prepend `@` when `copyAiRef.prefixAt` is `true` (default `false`).
7. Final string: `${prefixAt ? '@' : ''}${normalizedPath}${suffix}`.
8. Write the string to the clipboard via `vscode.env.clipboard.writeText`,
   which returns a Thenable.
9. On success, show a transient status bar message echoing the copied
   string, for confirmation. On failure, show an error message instead of
   silently reporting success.

## Settings (`contributes.configuration`)

| Key | Type | Values | Default |
|---|---|---|---|
| `copyAiRef.prefixAt` | boolean | — | `false` |
| `copyAiRef.pathSeparator` | enum | `system`, `slash`, `backslash` | `slash` |
| `copyAiRef.lineSeparator` | enum | `#`, `:` | `#` |
| `copyAiRef.rangeConnector` | enum | `dash`, `tilde` | `dash` |

`dash`/`tilde` map internally to the literal characters `-` and `~`.

## Examples (defaults)

- Single line: `odoo/addons/crm_extension/models/crm_prospect_category.py#13`
- Multi-line: `odoo/addons/crm_extension/views/crm_lead_views.xml#152-153`
- With `prefixAt` enabled: `@odoo/addons/crm_extension/models/crm_prospect_category.py#13`

## Testing

- Manual smoke test: open a workspace and verify clipboard content for:
  - No selection (cursor only) → single line, matches cursor's line.
  - Partial selection within one line → single line.
  - Whole line selected via triple-click / Home+Shift+Down (selection end
    at column 0 of next line) → single line, not a 2-line range.
  - Multi-line selection → correct start-end range.
  - Repeat the above across the 8 `prefixAt`/`lineSeparator`/`rangeConnector`
    combinations (2×2×2, excluding `pathSeparator` variants which are
    visually easy to eyeball on Windows).
- No workspace open (single file mode), or file outside any workspace
  folder: verify it falls back to the file's absolute path.

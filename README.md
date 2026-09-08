# Copy AI Ref

Copy the current file and selected lines as a reference such as
`src/app.js#13` or `src/app.js#13-19` for AI coding assistants.

## Install and use

Install **Copy AI Ref** (`lentice.copy-ai-ref-lentice`) from VS Code's
Extensions view, or use **Extensions: Install from VSIX** for a local package.

Select text or place the cursor on a line, then run **Copy AI Ref** from the
Command Palette. The reference is copied to the clipboard and shown briefly
in the status bar.

- Without a selection, copies the cursor's line; with multiple cursors, copies
  one reference per selection (sorted by position, duplicates removed), one per
  line.
- A selection ending at the start of the next line excludes that next line.
- Paths are relative to the containing workspace folder (the folder's display
  name is never included), with an absolute-path fallback for files outside the
  workspace or when no workspace is open.
- Only real files on disk are supported; untitled, diff and other virtual
  documents show a warning instead of a bogus reference.
- Unrecognized setting values fall back to the defaults below.

## Keyboard shortcut

No shortcut is assigned by default. Add this entry in **Preferences: Open
Keyboard Shortcuts (JSON)** to use it across projects:

```json
{
  "key": "ctrl+alt+c",
  "command": "copyAiRef.copy",
  "when": "editorTextFocus"
}
```

## Settings

| Setting | Values | Default |
|---|---|---|
| `copyAiRef.prefixAt` | `true` adds `@`; `false` omits it | `false` |
| `copyAiRef.pathSeparator` | `system` / `slash` / `backslash` | `slash` |
| `copyAiRef.lineSeparator` | `#` / `:` | `#` |
| `copyAiRef.rangeConnector` | `dash` (`-`) / `tilde` (`~`) | `dash` |

## Maintenance check

After changing `extension.js` or settings in `package.json`, verify clipboard
output for a cursor, a single-line selection, a selection ending at the next
line's start, multiple lines, and multiple cursors. Check an unsaved
(untitled) editor warns instead of copying. Check the format settings above and the
absolute-path fallback. Copy failures should show an error, not a success
message.

`node test.js` covers the reference-building logic without VS Code.

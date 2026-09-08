# Changelog

## 0.1.0

- Add **Copy AI Ref (Absolute Path)** for a one-off absolute reference.
- Add Explorer context-menu commands for whole-file references, including multi-select.
- Add `copyAiRef.pathMode` to choose relative or absolute paths by default.
- Add `copyAiRef.showAbsoluteMenuItem` to hide the absolute-path entry from the right-click menus.
- Preview the resulting reference next to every choice in the Settings dropdowns.
- `copyAiRef.prefixAt` is now a `none` / `@` dropdown instead of a checkbox; the old `true` value still works.
- Warn instead of copying for non-`file:` resources and for selections containing folders.
- Show an error instead of a false success when the clipboard write fails.
- Fall back to documented defaults for unrecognized setting values.

## 0.0.3

- Handle clipboard write failure; add the repository field.

## 0.0.2

- Disable the `@` prefix by default.

## 0.0.1

- Initial release: copy a relative path with the cursor line or selected line range.

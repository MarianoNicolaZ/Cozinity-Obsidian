# Cozinity troubleshooting

[Home](../../README.md) · [Guide](USER_GUIDE.md) · [Castellano](../es/SOLUCION_DE_PROBLEMAS.md)

Public desktop beta 0.1.9. Preserve a vault backup and plugin `data.json` before resetting or reinstalling. A configuration export is useful but does not contain vault files or every recovery record.

## Plugin missing, disabled or showing an older version

1. Confirm desktop Obsidian is in use and community plugins are enabled.
2. Check `.obsidian/plugins/cozynity/manifest.json`. It must sit directly beside `main.js` and `styles.css`, not inside a second nested release folder.
3. Keep the historical folder/ID `cozynity`; the visible name is Cozinity. Check for duplicate older installations before enabling one.
4. Use the complete private ZIP, not just `main.js`. Reload the plugin, or restart Obsidian after saving work.
5. Check the installed manifest version. If loading fails, collect the console error before attempting a settings reset.

The manifest's Obsidian minimum is 1.5.0; later native features require a version that includes them. Mobile and official community-catalog distribution are outside this preview.

## Themes, icons or room objects are missing

Confirm the complete `assets/` and `themes/` directories were extracted beside the runtime. Keep the supplied companion modules. Use **Settings → Cozinity → Dashboard appearance → Reload themes**, then reopen the view. For visual controls, **Open Customize** leads to the dashboard appearance dialog; duplicate settings fields have been removed without deleting saved values. If an image reference points into the vault, verify that file exists. Missing room art can show a fallback without losing the object's stored destination.

Do not rename the ID or erase `data.json` to fix a missing resource. Test a complete clean installation separately to distinguish packaging from saved configuration.

## Notebook/shortcut or search results are empty

Check **Notebook root** and real folder contents. Blank uses top-level folder discovery; hidden/journal folders can be excluded from the classic view. A shortcut may have been hidden or filtered: clear the library search, inspect all shelves, or try Classic notebooks. The header search matches Markdown paths/names and returns a short result list; it is not full-text vault search. A copied dashboard still needs its referenced files in this vault.

## Creation, moving or task editing is blocked

Fresh installs enable Safe Mode. **Customize → Advanced → Allow creating and editing notes** permits Cozinity's write actions. **Safe Mode** in additional settings represents the inverse. Check configured folders/templates before enabling writes.

Safe Mode does not globally lock Obsidian, native integrations, command shortcuts or linked TaskNotes timers. Conversely, toggling it does not fix missing plugins or permission errors from the filesystem.

## Native view blank, loading or missing from Add window

- Enable the relevant core/community plugin and open the target normally first.
- For Bases, confirm Bases is enabled and the `.base` works in a regular tab.
- For TaskNotes, open its tasks view to create/configure its `.base` files and enable Bases.
- For Notion Bases, create/open the local database and choose its `_database.md` or native tab.
- For Task Genius, enable `obsidian-task-progress-bar`; its available view depends on its configuration.
- For Canvas, open a real `.canvas` file and drag the file/tab onto the dashboard. It need not appear as a separate Add window item.
- For web pages, enable Obsidian's Web viewer; use the explicit external-browser option if unavailable.

Use the window's **Retry** when offered, or **Open in tab** to isolate an embedding issue. A visible native load that takes around 12 seconds can offer a local retry; time spent hidden does not consume that threshold. Do not repeatedly add duplicate windows while the original is loading.

This preview makes pending native-load attempts cancellable and limits an attempt to about 15 seconds. Closing a floating window or opening another destination does not need to wait for the old load. Visible delayed queries continue to be checked about once per second; obsolete results should not replace a newer window. Shared window-navigation listeners reduce repeated handling as more panels are added. These are targeted recovery improvements, not a guarantee that third-party views or network requests cannot fail.

Show native Bases/TaskNotes controls from the window **⋮** if its toolbar is hidden. The outer file title/path may be intentionally suppressed. Views use APIs that can change across releases; record exact Obsidian and integration versions in a report.

## Transparency or font does not match

A per-window color/font/opacity overrides the global value. Clear that override to follow the global choice. At 100% opacity original opaque surfaces return. Native selection, editing, disabled states and fixed headers can retain contrast. Light/Dark in Customize changes Obsidian's native mode globally. Fonts may fall back if not installed.

## Timer does not update TaskNotes

Verify the chosen task still exists and TaskNotes is enabled. A local timer works without TaskNotes, but time logging/completion depends on API availability and the installed version. Optional task-list lookup stops waiting after about 8 seconds; retry after checking TaskNotes. Failed or rejected task reads can be retried, and outdated responses are discarded rather than replacing newer results. This does not establish compatibility with every TaskNotes release. A linked countdown completes its task at zero when supported; a stopwatch does not do that. Check TaskNotes itself before relying on the record. Avoid linked timers for tests that must not write to tasks, even with Safe Mode on.

## Website, embed or imported image fails

Some sites reject embedding, require a login, or depend on network/browser restrictions. Test the same URL in Obsidian's regular Web viewer and then the external browser. The media window recognizes supported YouTube/Spotify links or their embed source URLs, not arbitrary pasted HTML. Web-image downloads require a supported raster image response; SVG and non-image pages are not accepted, and imported data is limited to 25 MB. Saving imports requires write permission; ordinary links do not automatically copy a remote file into the vault.

## Changes, dashboards or drafts appear lost

Check the active dashboard button first. Use **⋮ → Deleted dashboards** for removed spaces. For layout/appearance, try session Undo, then a saved recovery point. Undo history disappears when the plugin reloads and does not revert note text or shortcut-library edits.

Import an earlier configuration export as copies to inspect it without replacing current dashboards. Restore actual note content from your vault backup or Obsidian's own recovery facilities. Stop editing if a file may be overwritten and retain the original backup before investigation. Do not use reset as a recovery action: it clears plugin state, including drafts and recovery records.

## Import rejected

Use an unmodified Cozinity configuration export, not a random JSON or raw `data.json`. The import dialog accepts version 1, at most 10 MB, 100 profiles and 500 windows per profile. A valid import previews the names before **Add dashboards from backup**. It preserves existing spaces, local language and editing permission. It cannot restore missing note/image files.

## Diagnose a reproducible problem

1. Open **⋮ → Diagnostics** or the Cozinity diagnostics command.
2. Choose **Start recording**, close the dialog and reproduce the issue.
3. Reopen Diagnostics; **Refresh report**, then **Copy report** if useful.
4. Stop recording when finished and inspect the report before sharing privately.

Recording begins off, keeps the latest 200 events in memory, and disappears after reload. Starting again clears the prior session. It records panel/load/refresh identifiers, statuses and durations rather than note contents; metadata or error messages can still reveal context. Reports are not written into the vault automatically. The metrics are operation durations, not CPU/GPU/RAM or frame-rate measurements, and do not reconstruct work before recording began.

For feedback include Cozinity/Obsidian/OS/integration versions, language, Safe Mode state, theme, exact steps, expected/actual result and a sanitized screenshot or diagnostic report. See [Beta testing](../../BETA_TESTING.md). Browser demonstrations with simulated native boundaries are not a substitute for a real clean-vault reproduction.

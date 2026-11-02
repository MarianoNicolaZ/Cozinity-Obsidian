> Historical private-review report. The author has authorized this public 0.1.11 beta copy; outstanding tests remain outstanding.

# Cozinity 0.1.9 private review

Date: November 1, 2026. Purpose: prepare a private build for review and testing before public sharing.

## Reproduced issues and changes

| Issue | Change | Automated evidence |
| --- | --- | --- |
| A pending native open blocked later floating destinations, Open in tab and close cleanup | Changing destination or closing cancels the pending navigation; late results clean up their own leaf | `loading-recovery.browser.cjs` |
| An unresponsive first native candidate prevented fallbacks | A 15-second limit and a separate leaf per candidate; cancellation when the owner is detached | `loading-recovery.browser.cjs` |
| A query finishing without a DOM change could remain behind the slow warning | A modest once-per-second check while a slow window remains visible | `loading-recovery.browser.cjs` |
| Editable notes bypassed those loading controls | One shared native mounting path, retaining editor/scroll and Excalidraw handling | `loading-recovery.browser.cjs`, `window-cleanup.browser.cjs` |
| The basic editor could enable an empty document after a failed read | Editing remains disabled until a successful read, with a retry action | `loading-recovery.browser.cjs` |
| A slow basic-editor write acknowledged newer text that had not reached disk | Capture each submitted value and serialize writes | A→B regression in `loading-recovery.browser.cjs` |
| A failed task scan poisoned later requests; an old scan could replace a newer cache | Clear the pending promise on settlement and accept cache results only while current | `task-recovery.test.cjs` |
| Optional TaskNotes reads could wait forever | An 8-second limit and recovery on the next request; local timers remain available | `task-recovery.test.cjs` |
| Updating 20 windows repeated 20 global contexts and scroll captures/restores | Share one context and scroll capture/restore per batch; presentation edits skip context rebuilding | `batched-refresh.browser.cjs` |
| Untranslated commands/errors and user-name translation risk | Plugin-owned ES/EN strings, user/native-content protection and a reusable filename index | `i18n-private-review.test.cjs`, `i18n-private-review.browser.cjs` |

The 20-to-one reduction is a controlled window-refresh test. It does not measure Obsidian CPU usage, FPS or total interaction time.

## Simplified options

Eight duplicate Settings controls were removed: title, subtitle, global font, header image, board image, theme pack, global color and global opacity. The features remain in **Customize**. Settings now provides **Dashboard appearance → Open Customize** and **Reload themes**.

Language, Safe Mode, folders, templates, palette preset, file-type colors, week start and reset actions remain available. Redundant refresh requests were removed from these controls. Configuration fields, saved dashboards and drafts were not deleted to simplify the UI.

## Name, language and compatibility

The visible brand is **Cozinity**. The installation ID `cozynity`, data keys and historical internal selectors remain compatible with existing installations. User content and interfaces owned by other plugins retain their own language.

## Verification and limits

The development suite and new regressions ran before packaging. The repository includes portable functional tests; historical artwork-generation tests and their source images are outside the installation package. `npm test` runs included unit tests; `npm run test:browser` runs selected browser regressions.

Browser tests use production plugin renderers with simulated Obsidian boundaries. Screenshots/GIFs use fictional data. The author's Obsidian CLI was disabled and the native-control runtime was unavailable in this session; browser verification is therefore not presented as interactive validation inside a running Obsidian instance.

Before public release: reload the candidate in Obsidian, repeat open/close/dashboard switching and test installed integrations in a test vault. An unresponsive external plugin may still fail; Cozinity bounds its wait and provides recovery. Time limits do not stop third-party code internally. Review asset licenses/provenance before public distribution.

## Delivery

A full manual-install ZIP, Spanish/English documentation and fictional demo media. The delivery excludes `data.json`, notes, vault configuration, caches, logs and personal captures. The repository and review build remain private.

## 0.1.10 update

Added Send to dashboard for notes/Bases and fixed-width board images with vertical repetition. Cover and expand remains available. New regressions cover unchanged original content, Base view, double activation, cancellation on navigation, stable rendered pixels when growing from 700 to 1800 px, vertical repetition, sizing selection, profile persistence, Undo and configuration exchange. Interactive validation in Obsidian remains manual.

# Dashboard transfer and stable background implementation plan

> For agentic workers: use superpowers:executing-plans to implement and verify these two tasks in this session.

**Goal:** Send an open note/Base from the floating window to the dashboard, and keep the board image scaled to its width by default.
**Architecture:** Reuse the existing file-panel creation and native loading/saving lifecycle. Store the image sizing choice in the per-dashboard snapshot/history. Fixed sizing uses 100% auto, top alignment and repeat-y; the existing cover mode remains selectable.
**Tech stack:** Existing CommonJS runtime, CSS, Node tests and Playwright.
**Spec:** The user's two requirements in this chat; the send button is the chosen alternative to dragging.

## Global constraints

Preserve original files, user content, existing dashboard settings and the installation ID. New controls use Spanish/English. No native-vault write is needed to add the file reference. Do not change header image behavior.

## Review focus

- Missing or deleted files must not create broken panels.
- A slow save, repeated click, close or navigation must not add a stale or duplicate panel.
- The sizing choice must survive profile switching, save/reload, export/import and undo.
- Growing dashboard height must not change the fixed image's scale or top crop.
- Cover mode must preserve vertical positioning; gradients remain continuous.

## Task 1: Send note or Base to dashboard

- [x] Add failing browser assertions for the toolbar action, a real file panel, Base selected view, no vault mutations, stale navigation and repeated clicks.
- [x] Add Send to dashboard / Enviar al dashboard for existing md/base files. Flush a ready native editor through its bounded wait, recheck file/profile/navigation identity, create the panel and close on success.
- [x] Run the focused browser test and existing loading/navigation regressions.

## Task 2: Stable board backgrounds

- [x] Add failing normalization/history and browser rendering assertions.
- [x] Add boardBackgroundSizing = fixed by default, cover as alternative; include snapshot normalization and undo/export behavior.
- [x] Set matching board/frame CSS and preview, with the choice under Customize > Background. Keep panning for cover only.
- [x] Run unit and browser suites, document both features and install the tested runtime with a backup while preserving data.json.

Verification: 188 unit tests passed, including configuration exchange across profiles. Browser regressions cover native/configuration save failures without editor loss or duplicate windows. Native UI validation after reload remains manual.

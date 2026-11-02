# Development and verification

The installation package contains the ready-to-run plugin. End users do not need Node, npm or a build step.

For source verification, use Node 20 or later and install the pinned development dependencies:

```sh
npm install
npm test
npm run verify:release
```

On the reference Windows environment, Microsoft Edge supplies the browser for:

```sh
npm run test:browser
```

The included browser suite uses production renderers and simulated native boundaries. It does not launch Obsidian or modify a real vault. No Obsidian application bundle or native application CSS is redistributed. The fixture can optionally read locally supplied native CSS through `COZYNITY_NATIVE_CSS`; otherwise it uses an authored portable fallback. Assertions verify lifecycle, persistence, language and navigation rather than certifying third-party plugin compatibility.

The clean review snapshot includes 185 unit tests in 25 functional test files and ten browser regression scripts. The original development tree also ran its artwork/resource tests: 207 unit tests in total. Artwork-generation scripts and source exploration images are not required at runtime and are not part of this clean review snapshot.

To reproduce fictional screenshots and GIFs, install FFmpeg and run:

```sh
npm run media:capture
```

See the [media guide](../media/README.md) for environment variables and capture boundaries.

To produce a manual-install ZIP on Windows:

```sh
node scripts/package-plugin.cjs
```

This verifies release files, copies only runtime/resources/docs into `dist/install/cozynity`, creates the ZIP and computes SHA-256 checksums. `data.json`, vault configuration, local logs and developer caches are excluded. Keep the manifest ID and installation directory `cozynity` compatible with existing installations; the visible product name is Cozinity.

Review the [review report](REVIEW_REPORT.md), run the [beta checklist](../../BETA_TESTING.md), and test the full ZIP in a clean vault before proposing a stable release. This repository publishes the desktop beta; native validation remains pending.

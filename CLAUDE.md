# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**Umpire Coder** — a Chrome (MV3) extension for match-official performance analysis (field hockey, football, rugby, basketball). The user tags events live while watching a stream, the extension drives OBS to record, and at match end a Node native-messaging host cuts per-event clips with ffmpeg and builds a PDF report. Plain JavaScript (ES modules), no build step, no bundler, no test suite.

## Architecture and data flow

```
popup / settings / overlay window  ──chrome.runtime.sendMessage──▶  background.js (service worker)
                                                                       │  ├─ obs/websocket.js ──▶ OBS WebSocket v5 (localhost:4455)
                                                                       │  └─ chrome.storage.local (settings, matchState, setupDraft)
                                                                       ▼
                                      chrome.runtime.sendNativeMessage('com.umpirecoder.postprocess')
                                                                       ▼
                         native host (native-host/host.js on Windows, mac/native-host/host.js on macOS)
                                                                       ▼
                         post-processing/report_generator.js (pdfkit)  +  post-processing/clip_cutter.js (ffmpeg)
```

- **`extension/background.js`** — the hub. A single `handle(message)` switch on `message.type` (`START_MATCH`, `LOG_EVENT`, `ADVANCE_PERIOD`, `END_MATCH`, `APPLY_OBS_SETTINGS`, `TEST_OBS_CONNECTION`, `PICK_PATH`, `OPEN_FOLDER`, `GIT_PULL`, …). Holds `SPORT_DATA` (per-sport officials, periods, default tags) and `DEFAULT_SETTINGS`. Opens the tagging overlay as a popup window (`overlay/overlay.html`).
- **`extension/overlay/`** — the live tagging UI (popup window). Talks only to the service worker.
- **`extension/popup/`** — match setup (officials, teams, start). Persists an in-progress form as `setupDraft` in storage.
- **`extension/settings/`** — sport/periods, tag types (add/edit/reorder/colour), OBS connection, output dirs, recording quality, clip pre/post durations (max 45s total).
- **`extension/obs/websocket.js`** — `OBSWebSocket` class: auth, start/stop recording, window-capture targeting/cropping, applying output settings.
- **`extension/content.js`** — older shadow-DOM in-page overlay; nothing currently references it (the overlay window replaced it). Check before editing or relying on it.
- **Native host** — one JSON message in, one out (4-byte LE length + JSON over stdio). Named types: `LAUNCH_OBS`, `PICK_PATH`, `OPEN_FOLDER`, `GIT_PULL` (in-app 🔄 updater). A message with no `type` is the end-of-match job: write `events.json` into a per-match folder (`matchSlug()`), then run `report_generator.js` and `clip_cutter.js --json --video --out --pre --post` with `process.execPath`.
- **`post-processing/`** — the only package with dependencies (`pdfkit`). Both scripts are runnable standalone CLIs.

## Mac and Windows parallel code paths — keep in sync

`native-host/host.js` (Windows, launched via `host.cmd`, registered in HKCU by `setup.ps1` / `install.ps1`) and `mac/native-host/host.js` (macOS, launched via `host.sh`, installed by `setup.sh` / `install.sh`) are separate copies of the same host. Any change to the message protocol, match-folder naming, or how post-processing is invoked must be made in **both**. Likewise `setup.ps1` ↔ `setup.sh` and `windowsSETUP.md` ↔ `macSETUP.md`.

### macOS: source checkout vs. hidden install folder

On macOS the code that runs is split across two folders. Chrome's subprocess can't read TCC-protected `~/Documents`, so the native host must live outside it, in `~/.umpire-coder/`.

- **This dev machine (as of 2026-11-03):**
  - The **extension** is loaded unpacked from the source checkout, `~/Documents/umpireCoding/extension`. Edits take effect after reloading it in `chrome://extensions`.
  - The **native host and post-processing** run from `~/.umpire-coder/`, which here is a **separate full git clone** whose `main` tracks `my-fork/main`. Chrome's host manifest (`~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.umpirecoder.postprocess.json`) points to `~/.umpire-coder/mac/native-host/host.sh`, the repo's own launcher. That launcher sets no `UC_REPO_DIR`, so the 🔄 `GIT_PULL` runs `git pull` inside `~/.umpire-coder` itself. That pull gets whatever has been merged into the fork's `main`.
  - So editing `mac/native-host/host.js` or `post-processing/*` in the source checkout **changes nothing at runtime** until that code reaches `~/.umpire-coder` (commit/push, then pull there, or copy the files over). Before you debug the host, check that both folders match: `diff -rq mac ~/.umpire-coder/mac; diff -rq post-processing ~/.umpire-coder/post-processing -x node_modules`.
  - The **active debug log** is `~/.umpire-coder/mac/native-host/debug.log`. The one in the source checkout is stale.
- **Standard `setup.sh` layout (end users):** the clone lives in `~/Documents/umpireCoding`. Setup *copies* only `host.js` and `post-processing/` into `~/.umpire-coder/` and generates a different `host.sh` there that sets `UC_POST_DIR`, `UC_REPO_DIR` (pointing back to the clone), `UC_LOG` (the clone's `mac/native-host/debug.log`) and `UC_FFMPEG_PATH`. `GIT_PULL` pulls the clone and then re-copies those files, but only when the pull brought in changes. Keep that sync list in `host.js` up to date when you add runtime files.
- Default output is `~/Movies/umpire-clips` because Chrome's subprocess can't write to Documents, Desktop or Downloads.
- `mac/native-host/com.umpirecoder.postprocess.json` is tracked but holds a machine-specific path and extension ID. The real manifest is generated into Chrome's `NativeMessagingHosts` folder.

On Windows there is no split: the registered host runs straight from the clone's `native-host/` folder.

## Install, run, test

- Full setup: `./setup.sh` (macOS) or `powershell -ExecutionPolicy Bypass -File setup.ps1` as admin (Windows). Installs Node, Git, OBS, ffmpeg, runs `npm install` in `post-processing/`, configures OBS, asks for the unpacked extension's ID and registers the native host. See `macSETUP.md` / `windowsSETUP.md`.
- Load the extension: `chrome://extensions` → Developer mode → Load unpacked → `extension/`. After editing extension code, click reload on the extension card (the service worker and overlay don't hot-reload).
- Post-processing by hand: `cd post-processing && node report_generator.js --json <events.json> --out <dir>` and `node clip_cutter.js --json <events.json> --video <recording.mp4> --out <dir> [--pre 30 --post 15]`.
- No automated tests or linter. Verify by syntax-checking (`node --check <file>`) and, where possible, running the post-processing scripts against a sample `events.json`. Windows-only helpers: `scripts/test-obs-config.ps1`, `scripts/fix-pc-setup.ps1`.

## Versioning convention

Upstream bumps the patch version on every change and names it in the commit message (e.g. `Fix PDF row height; bump to 1.0.34`):

```bash
node scripts/bump-version.js            # patch; --minor / --major also supported
```

It rewrites `extension/manifest.json` only. Commits on this fork have so far not bumped (it's still `1.0.36`, same as upstream), so bump when preparing changes to send upstream.

## Git remotes

- `my-fork` → `https://github.com/u25se/umpireCoding` — the user's fork; push feature branches here.
- `origin` → `https://github.com/olliechauhan/umpireCoding` — upstream (owner: Ollie Chauhan). PRs go from `my-fork` branches to `origin/main`. The in-app updater runs `git pull` in the user's clone, so anything merged upstream reaches end users directly.

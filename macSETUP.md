# Umpire Coder — macOS Setup Guide

This guide walks you through setting up Umpire Coder from scratch on a Mac.
Follow every step in order. If something goes wrong, read the **Troubleshooting** section at the bottom.

---

## What You Will Need

- A Mac running macOS 12 (Monterey) or later
- Google Chrome installed
- An internet connection (for the initial setup only)

---

## Step 1 — Run the Setup Script

The setup script handles everything automatically: installs Homebrew, Node.js, Git, OBS Studio and ffmpeg, downloads Umpire Coder, configures OBS (WebSocket, recording folder, window capture source), and registers the background helper.

There is one short manual action the script will guide you through:
- **Loading the extension into Chrome** — Chrome's security model prevents this being automated; the script opens Chrome and the extension folder for you

### How to run it

1. Open **Terminal** (press Cmd + Space, type `Terminal`, press Enter)
2. Paste the following command and press **Enter**:

```
bash <(curl -fsSL https://raw.githubusercontent.com/olliechauhan/umpireCoding/main/setup.sh)
```

3. You may be asked for your Mac password during the Homebrew installation — type it and press Enter (you won't see the characters as you type, that's normal)
4. Press **Enter** when prompted to begin and follow the on-screen instructions
5. When the script asks you to load the extension — follow the instructions on screen (Chrome and the extension folder will already be open)

> **Tip:** If you already have some of the software installed, the script detects it and skips those steps automatically.

> **Note:** If you see a security warning when OBS first opens, go to **System Settings → Privacy & Security** and click **Open Anyway**. You only need to do this once.

---

## Step 2 — Configure the Extension Settings

1. Go to `chrome://extensions` and click the **reload button (↺)** on Umpire Coder
2. Click the **Umpire Coder** icon in your Chrome toolbar and click **⚙ Settings**
3. Fill in the following:

   **OBS Connection**
   - Host: `localhost`
   - Port: `4455`
   - Password: `umpire123` *(set automatically by the setup script)*
   - Click **Test Connection** — you should see ✓ Connected

   **OBS Output Settings**
   - Recording Output Directory: `/Users/[YourName]/Movies/umpire-recordings` *(created automatically by the setup script)*
   - Leave format, resolution, and framerate as defaults
   - Click **Apply OBS Settings**

   **Post-Processing Output**
   - Clips & Report Output Directory: choose any folder where you want clips and PDF reports saved (e.g. `/Users/[YourName]/Movies/umpire-clips`)

   **Sport**
   - Confirm the period name and number of periods match your competition

4. Click **Save Settings** at the bottom of the page

> **Tip:** You can pin the extension to your toolbar by clicking the puzzle piece icon at the top right of Chrome and clicking the pin next to Umpire Coder.

---

## Step 3 — You're Ready

Here is the workflow for each match:

### Before the match
1. Open the livestream in Chrome
2. Click the **Umpire Coder** icon in Chrome
3. Fill in the umpire names (required) and optionally the date, competition, and venue
4. Click **▶ Start Match** — OBS will launch automatically, begin recording, and the tagging overlay will appear on screen

### During the match
- Use the overlay to tag events:
  - Select an **umpire**
  - Select a **tag type**
  - Optionally add a **note**
  - Click **Log Event**
- If the livestream is delayed behind the live venue, enter the delay in seconds in the **Stream delay** field (e.g. `90` for a 90-second delay). You can adjust this at any time during the match.
- Click **End Quarter/Half/Period** when that period ends. Clips include the period reference and number in their filenames (for example, `Q1`, `H1`, or `P1`), and the PDF lists the period for each tagged event.
- Drag the overlay by its header to move it out of the way.

### After the match
1. Click **End Match** on the overlay, then **Confirm**
2. OBS stops recording
3. The clips and PDF report are generated automatically — this may take a minute or two
4. The overlay will show ✓ green ticks when done, and display the output folder path
5. Your files will be in the **Clips & Report Output Directory** you set in Step 2

---

## Pulling the Latest Version from GitHub

Only update when no match is in progress.

### Standard users

Click **🔄 Check for Updates** in the extension popup. It pulls the latest version from the configured upstream and reloads the extension if files changed. You do not need to edit source code or run Git commands.

The current macOS setup keeps a Git checkout in `~/Documents/umpireCoding` for updates, and runs the native host and post-processing runtime from `~/.umpire-coder`. The update button updates the checkout and synchronizes the deployed runtime. The source checkout is part of the current updater design, but ordinary users do not need to change or work with its source files.

### Contributors and users deploying from a fork

If you use a fork, merge the changes into `main` on your fork first. Then configure the local `main` branch to pull from your fork (rather than the original project's `origin`):

1. Open **Terminal** and go to the checkout used by the native host. For the standard setup:

   ```bash
   cd "$HOME/Documents/umpireCoding"
   ```

   If you moved the entire Git checkout into `~/.umpire-coder` and registered the host from there, use:

   ```bash
   cd "$HOME/.umpire-coder"
   ```

2. Check the checkout and its remotes:

   ```bash
   git status -sb
   git remote -v
   ```

   If `git status` shows modified tracked files, stop and save or commit those changes before updating. Do not discard them. An untracked `debug.log` can be left alone.

3. Fetch your fork. In this example, its remote is named `my-fork`:

   ```bash
   git fetch my-fork
   ```

   If your fork is instead named `origin`, use `origin` in place of `my-fork` below. If the fork is not listed by `git remote -v`, add it once, replacing `YOUR_GITHUB_USERNAME` with your GitHub username:

   ```bash
   git remote add my-fork https://github.com/YOUR_GITHUB_USERNAME/umpireCoding.git
   git fetch my-fork
   ```

4. Set the local `main` branch to track your fork's `main`:

   ```bash
   git switch main
   git branch --set-upstream-to=my-fork/main main
   ```

   If you do not have a local `main` branch yet, use `git switch --track my-fork/main` instead.

5. Confirm `git status -sb` shows `main` tracking `my-fork/main`. Then click **🔄 Check for Updates** in the extension popup. It should report **Updated!** or **Already up to date.**

If you moved the full checkout into `~/.umpire-coder`, make sure Chrome's unpacked extension is loaded from that same checkout so extension changes are included.

The standard setup installs post-processing dependencies during synchronization. If you maintain a full Git checkout directly in `~/.umpire-coder`, install dependencies there after an update:

```bash
cd "$HOME/.umpire-coder/post-processing"
npm install
```

If the pull reports a conflict or local changes, stop and resolve those before retrying. Do not delete or reset files to force the update.

---

## Troubleshooting

**"OBS connection refused" error when testing**
- Make sure OBS is open
- Check that the password in Settings matches `umpire123` (or whatever you changed it to)
- In OBS: Tools → WebSocket Server Settings → confirm Enable WebSocket server is ticked

**"ffmpeg not found on PATH"**
- Open Terminal and run: `brew install ffmpeg`
- After it finishes, fully quit Chrome (Cmd + Q) and reopen it

**Finding the native host debug log**
- The log is saved at `~/Documents/umpireCoding/mac/native-host/debug.log`
- The native host itself is deployed under `~/.umpire-coder`; only its debug log is written to the visible project folder
- If the popup reports that it updated but the new post-processing behavior is missing, confirm that the registered native-host manifest points to the intended `host.sh` and check this log for a deployment sync error

**The overlay doesn't appear after starting a match**
- Make sure the livestream tab is the active tab when you click Start Match
- Try clicking the extension icon and clicking "Show Overlay on This Tab"

**The extension disappeared from Chrome after restarting**
- Extensions loaded in Developer mode stay loaded unless you remove them. If it disappeared, go to `chrome://extensions`, click **Load unpacked**, and select the `extension` folder inside your `umpireCoding` folder.

**Clips were not cut but the PDF was generated**
- Check that the full match video exists in `~/Movies/umpire-recordings`
- Check that ffmpeg is installed: open Terminal and run `ffmpeg -version`
- The PDF report is always generated regardless of whether clips are cut

**OBS shows a security warning and won't open**
- Go to System Settings → Privacy & Security → scroll down and click **Open Anyway** next to the OBS entry

**"Permission denied" running the setup script**
- Run `chmod +x setup.sh` first, then `./setup.sh`

---

## File Structure Reference

After setup your folder structure will look like this:

```
Documents/
  umpireCoding/
    extension/          <-- loaded into Chrome
    mac/
      native-host/      <-- runs automatically, no need to touch
    post-processing/    <-- runs automatically, no need to touch

Movies/
  umpire-recordings/    <-- full match recordings from OBS
  umpire-clips/         <-- clips and PDF reports (or wherever you chose in Step 2)
    2026-04-27_NationalLeague_clips/
      JohnSmith_Positioning_00-32-15.mp4
      JaneDoe_Advantage_00-45-02.mp4
      ...
    2026-04-27_NationalLeague_report.pdf
    2026-04-27_NationalLeague_events.json
```

---

For issues or questions, open a report at [github.com/olliechauhan/umpireCoding/issues](https://github.com/olliechauhan/umpireCoding/issues).

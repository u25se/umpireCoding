# Umpire Coder

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/olliechauhan)

A Chrome extension for match official performance analysis in field hockey, football, rugby, and basketball. Tag events live during a streamed match, then automatically generate timestamped video clips and a PDF report — no video editing required.

---

## What It Does

- **Live tagging overlay** — a floating panel appears over any livestream tab in Chrome. Tag events to either umpire with one click: positioning, advantage calls, card decisions, and any custom tag types you define.
- **Sport and period settings** — choose a sport, configure its period name and count, and advance the active period from the overlay as the match progresses.
- **Automatic OBS recording** — the extension starts and stops OBS recording for you when you begin and end a match. No manual recording control needed.
- **Video clip cutting** — after the match, each tagged event is automatically cut into a short clip from the full recording.
- **PDF report** — a summary report is generated for each umpire showing all tagged events with timestamps.
- **One-click updates** — press the 🔄 button in the extension to pull the latest version without opening a terminal.

---

## Requirements

- Google Chrome
- Windows 10/11 or macOS 12 (Monterey) or later

Everything else (Node.js, Git, OBS Studio, ffmpeg) is installed automatically by the setup script.

---

## Setup

Follow the guide for your operating system:

| OS | Guide |
|---|---|
| **Windows** | [windowsSETUP.md](windowsSETUP.md) |
| **macOS** | [macSETUP.md](macSETUP.md) |

Setup takes around 5–10 minutes. The script handles the technical parts automatically.

---

## How to Use

### Settings - This sets up the extension for sport and tag configuration, and its connection to OBS

Open **Settings** (⚙ in the extension popup) to configure the extension:

- **Sport and periods** — select Field Hockey, Football, Rugby, or Basketball, then set the period name (Half, Quarter, or Period) and number of periods (1–12). Defaults are four quarters for Field Hockey and Basketball, and two halves for Football and Rugby. Changing the sport resets the period defaults and tag list for that sport.
- **Tag Types** — add, edit, remove, and reorder tag buttons. Choose from five colors for visual grouping. New tags default to blue; built-in card tags retain their existing colors.
- **OBS Connection** — enter the WebSocket host, port, and password. Use **Show** to reveal or hide the password and **Test Connection** to check the connection.
- **Output Location** — choose where recordings, clips, and reports are saved.
- **Recording Quality** — configure recording format, resolution, and frame rate. Clip duration can also be adjusted with pre-tag and post-tag lengths, up to 45 seconds total.

Click **Save Settings** to save your changes. Use **Apply OBS Settings** to apply the OBS recording settings.

### Starting a match
1. Open the livestream in Chrome
2. Click the **Umpire Coder** icon in your toolbar
3. Fill in the umpire names and optional match details
4. Click **▶ Start Match** — OBS begins recording and the tagging overlay appears

### During the match
- Select an umpire, select a tag type, optionally add a note, then click **Log Event**
- If the stream is delayed behind the live venue, enter the delay in seconds in the **Stream delay** field
- Use **End Quarter/Half/Period** when a period finishes. The overlay shows the active period and count; events logged afterward are assigned to the next period.
- Drag the overlay by its title bar to reposition it

### Ending a match
1. Click **End Match** on the overlay, then **Confirm**
2. OBS stops recording
3. Clips and PDF report are generated automatically (takes a minute or two). Clip filenames include the period reference and number, such as `Q1`, `H1`, or `P1`; the PDF includes team names in Match Details and the period for each event.
4. The overlay shows a summary with green ticks when everything is done

---

## Updating

Press the **🔄** button in the top-right corner of the extension popup. If new changes are available they are downloaded and the extension reloads automatically.

---

## Customising Tag Types

Open **Settings** (⚙ in the extension popup) → **Tag Types** to add, edit, remove, recolor, or reorder tag buttons. Changes apply immediately the next time you start a match.

---

## Output Files

All output is saved to the **Clips & Report Output Directory** you set in Settings:

```
umpire-clips/
  2026-04-27_NationalLeague_JohnSmith_JaneDoe/
    JohnSmith_Positioning_Q1_00-12-34.mp4
    JaneDoe_Advantage_Q2_00-32-01.mp4
    ...
  2026-04-27_NationalLeague_JohnSmith_JaneDoe_report.pdf
  2026-04-27_NationalLeague_JohnSmith_JaneDoe_events.json
```

The period marker uses `Q` for Quarter, `H` for Half, or `P` for Period, followed by the period number. The PDF report includes team names in Match Details and a Period column in its events table.

---

## Reporting Issues

Open an issue on [GitHub](https://github.com/olliechauhan/umpireCoding/issues) with a description of what happened and what you expected to happen.

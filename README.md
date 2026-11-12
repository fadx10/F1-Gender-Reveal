# 🏁 Baby Grand Prix — Gender Reveal

A one-page, no-build gender-reveal game: **two Formula 1 cars race for 15 seconds**, trading the lead until a photo finish. The winning car lights up the screen and announces the surprise.

It works locally on one device, or you can send a **unique surprise link** that reveals the result on someone else's phone or laptop.

## Highlights

- 🏎️ 15-second race with constant lead changes — the winner is not obvious until the final second
- 🏁 Photo finish: the pre-picked winning car crosses the line exactly at race end
- 💙💖 Boy, Girl, or random winner — set secretly in the parent menu
- 🔗 Unique share links, e.g. `#r=fpza3nqmcbk9`, with the result locked into the link
- 🔊 Sound effects generated live with Web Audio — engines, starter, skids, overtakes, final-countdown beeps, crowd and fireworks
- 📱 Responsive desktop and mobile layout
- 🌐 Fully static: perfect for GitHub Pages, no server or build step

## Run it locally

Open `index.html` in any modern browser. That's it.

For the smoothest experience — and to make sure `localStorage` behaves consistently — serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Set the secret (parents only)

1. Click the **⚙ gear** in the top-right corner.
2. Choose **Boy**, **Girl**, or **Surprise** (random winner).
3. Click **Save & Close**, then start the race.

The result is saved in the browser's `localStorage` on that device only. The losing car leads with about a second to go, so nobody can guess the result early.

## Send it as a surprise link

You can send the race to someone else without them setting anything up:

1. Open the **⚙ gear** menu.
2. Under **Send it as a surprise**, click **Copy Boy link** or **Copy Girl link**.
3. Send the copied link by message, email, or anywhere else.

Each click creates a fresh random-looking link:

```text
https://yourname.github.io/baby-grand-prix/#r=fpza3nqmcbk9
```

When your guest opens it:

- The start screen shows **“A secret race is waiting”**.
- The parent gear/settings controls are hidden, so they cannot change the result.
- The race runs for 15 seconds with lead changes and a photo finish.
- The linked result is revealed at the end, and **Race Again** keeps the same result.
- The link overrides any result previously saved on that device.

The result travels inside the link itself, so there is no server or database. The 12-character code is obfuscated so it looks random to a casual reader, but the app source is public — a determined person could decode it. For a truly sealed surprise, send the link only when it is race time.

## Deploy to GitHub Pages

The app is fully static, so GitHub Pages can host it directly.

1. Push `index.html`, `styles.css`, `app.js`, `README.md`, and `.nojekyll` to a GitHub repository.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Pick your branch (for example `main`) and the **/ (root)** folder, then save.
5. Wait for the Pages build, then open the URL GitHub shows, usually:

```text
https://<user>.github.io/<repo>/
```

Notes:

- All asset paths are relative, so the app works from a project subpath.
- `.nojekyll` tells GitHub Pages to serve the files as-is without Jekyll processing.
- The repository must be public, or your GitHub plan must allow Pages for private repositories.
- The Google Fonts stylesheet needs an internet connection; the race itself still runs without it.
- Sound starts after the first click or tap, as required by browser autoplay rules.

## Controls

| Action | Control |
| --- | --- |
| Start / restart race | **Start the Race**, or press `Space` / `Enter` |
| Race again | **Race Again** after the reveal, or press `R` |
| Mute / unmute | Speaker button, or press `M` |
| Close settings | `Esc` |
| Copy a surprise link | **⚙ gear → Copy Boy link / Copy Girl link** |

## How the race works

- F1-style five-light start sequence, then exactly **15 seconds** of racing.
- The cars trade small leads throughout. The pre-picked winner stays behind until the final second, then overtakes and crosses by a nose.
- The HUD shows the countdown, both cars' live speed (KPH), and a race-progress bar.
- At the finish: screen flash, confetti, fireworks, bouncing baby emojis, and a big **IT'S A BOY!** / **IT'S A GIRL!** reveal.
- Sound is synthesised in the browser: engine notes, starter motor, launch skid, overtake whooshes, final-second beeps, finish thump, crowd roar and firework pops.
- To change the race length, edit `RACE_DURATION` near the top of `app.js` (currently `15` seconds).

## Project structure

```text
index.html   — page structure and screens (start, race HUD, reveal, settings)
styles.css   — all layout, themes, animations and responsive rules
app.js       — canvas race, progress curves, particles, sound, sharing and flow
.nojekyll    — tells GitHub Pages to serve the files as-is
README.md    — this file
```

## Browser support

Works in current versions of Chrome, Edge, Firefox and Safari. It uses canvas, `localStorage`, the Web Audio API and the Clipboard API; none of them require a build step or backend.

If the Clipboard API is unavailable, the generated surprise link is shown in a read-only field so it can be copied manually.

---

Made for one very big surprise. 💙💖

# Baby Gender Reveal Grand Prix — F1 Gender Reveal Game 🏁

**Baby Gender Reveal Grand Prix** is an **F1-themed gender reveal game** for a baby boy or baby girl. Two Formula 1 cars race for **15 seconds**, trade the lead, and finish with a photo finish before the winning car announces the surprise.

This is a free, static **Formula 1 gender reveal** web app — perfect for a baby shower, a party projector, or sending as a **surprise link** to family and friends. No app install, no build step, no backend.

> **Quick summary:** F1 gender reveal game · two cars · 15-second race · photo finish · boy/girl surprise · shareable link · GitHub Pages ready.

## Table of contents

- [Why use this F1 gender reveal](#why-use-this-f1-gender-reveal)
- [F1 race features](#f1-race-features)
- [Run it locally](#run-it-locally)
- [Set the secret result](#set-the-secret-result)
- [Send an F1 surprise link](#send-an-f1-surprise-link)
- [Deploy to GitHub Pages](#deploy-to-github-pages)
- [Controls](#controls)
- [How the F1 gender reveal works](#how-the-f1-gender-reveal-works)
- [Customise the race](#customise-the-race)
- [Project structure](#project-structure)
- [FAQ](#faq)
- [GitHub topics and SEO keywords](#github-topics-and-seo-keywords)

## Why use this F1 gender reveal

- **F1 theme, not a generic reveal:** two Formula 1 cars, start lights, racing HUD, engine sounds, checkered flag and a pit-lane-style reveal.
- **Genuinely close race:** the lead changes several times, and the eventual winner only overtakes in the final second.
- **Perfect photo finish:** the pre-picked winning car reaches the finish line exactly as the 15-second timer ends.
- **Works on any screen:** desktop, laptop, tablet, phone, TV or projector — plus a one-click fullscreen mode.
- **Send it anywhere:** generate a unique **F1 gender reveal link** for Baby Boy or Baby Girl and share it online.
- **Private by design:** the result is not shown until the race ends.
- **Free to host:** fully static, so GitHub Pages works with no server and no build step.

## F1 race features

- 🏎️ **Formula 1-inspired race** with two cars, five start lights, speed readouts and a race-progress bar
- 🏁 **15-second race** with multiple overtakes and a last-second photo finish
- 💙💖 **Baby Boy vs Baby Girl** result, or a random **Surprise** winner
- 🔗 **Unique surprise links** such as `#r=fpza3nqmcbk9` with the result locked inside the link
- 👶 **Baby emoji celebration** on the reveal screen
- 🔊 **Live Web Audio sound effects:** engines, starter motor, launch skid, overtake whooshes, final-second beeps, finish thump, crowd and fireworks
- 🎉 **Three celebration samples on the reveal:** party horn, confetti pop and baby giggle (plus the synthesised fanfare)
- ⛶ **Fullscreen mode** for parties, TVs and projectors
- 📱 **Responsive layout** for phones, tablets and desktops
- 🌐 **Static hosting friendly:** no backend, database or build tools

## Run it locally

Open `index.html` in any modern browser. That's it.

For the smoothest experience — and to make sure `localStorage` behaves consistently — serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Set the secret result

1. Click the **⚙ gear** in the top-right corner.
2. Choose **Boy**, **Girl**, or **Surprise** (random winner).
3. Click **Save & Close**, then start the race.

The result is saved in the browser's `localStorage` on that device only. The losing car leads with about a second to go, so the result stays hidden until the finish.

## Send an F1 surprise link

You can send the race to someone else without them setting anything up:

1. Open the **⚙ gear** menu.
2. Under **Send it as a surprise**, click **Copy Boy link** or **Copy Girl link**.
3. Send the copied link by message, email or social media.

Each click creates a fresh, random-looking link:

```text
https://yourname.github.io/baby-gender-reveal-grand-prix/#r=fpza3nqmcbk9
```

When your guest opens the link:

- The start screen shows **“A secret race is waiting”**.
- The parent gear/settings controls are hidden, so they cannot change the result.
- The F1 race runs for 15 seconds with lead changes and a photo finish.
- The linked result is revealed at the end, and **Race Again** keeps the same result.
- The link overrides any result previously saved on that device.

The result travels inside the link itself, so there is no server or database. The 12-character code is obfuscated so it looks random to a casual reader, but the app source is public — a determined person could decode it. For a truly sealed surprise, send the link only when it is race time.

## Deploy to GitHub Pages

The app is fully static, so **GitHub Pages** can host it directly.

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
| Fullscreen | Fullscreen button, or press `F` |
| Close settings | `Esc` |
| Copy a surprise link | **⚙ gear → Copy Boy link / Copy Girl link** |

Tip: press the fullscreen button or `F` before starting when showing the race on a TV or projector.

## How the F1 gender reveal works

- F1-style five-light start sequence, then exactly **15 seconds** of racing.
- The cars trade small leads throughout. The pre-picked winner stays behind until the final second, then overtakes and crosses by a nose.
- The HUD shows the countdown, both cars' live speed in KPH, and a race-progress bar.
- At the finish: screen flash, confetti, fireworks, bouncing baby emojis, and a big **IT'S A BOY!** / **IT'S A GIRL!** reveal.
- Sound is synthesised in the browser: engine notes, starter motor, launch skid, overtake whooshes, final-second beeps, finish thump, crowd roar and firework pops.

## Customise the race

- **Race length:** edit `RACE_DURATION` near the top of `app.js` (currently `15` seconds). The KPH readout and finish timing scale automatically.
- **Colours and styling:** edit the CSS variables and reveal styles in `styles.css`.
- **Names and copy:** update the start screen, HUD and reveal text in `index.html` and `app.js`.
- **Winner logic:** the parent menu sets the result; `pickWinner()` in `app.js` handles local settings and shared links.

## Project structure

```text
index.html   — page structure and screens (start, race HUD, reveal, settings)
styles.css   — layout, themes, animations and responsive rules
app.js       — canvas race, progress curves, particles, sound, sharing and flow
universfield-birthday-party-horn-250238.mp3          — reveal: party horn
u_jspnqv1glx-1gift-confetti-447240.mp3               — reveal: confetti pop
scottishperson-sound-effect-baby-laughing-01-237186.mp3 — reveal: baby giggle
.nojekyll    — tells GitHub Pages to serve the files as-is
README.md    — this file
```

## FAQ

### Is this an F1 gender reveal?

Yes. It is a Formula 1-themed gender reveal game with two F1 cars, start lights, racing sounds and a checkered-flag finish.

### Do I need a server or build step?

No. It is plain HTML, CSS and JavaScript. You can open `index.html` directly, serve it locally, or host it for free on GitHub Pages.

### Can I send the F1 gender reveal to someone else?

Yes. Use **⚙ gear → Copy Boy link / Copy Girl link** to create a unique surprise link. The result is encoded in the link, so no server is needed.

### Does the result stay hidden?

Yes. The winner is chosen in advance but the cars race neck-and-neck. The losing car leads with about a second to go, then the winner overtakes at the finish line.

### How long is the race?

Exactly **15 seconds** after the five-light start sequence. You can change this with `RACE_DURATION` in `app.js`.

### Does it work on a phone or TV?

Yes. The layout is responsive, and the fullscreen button (or `F`) is ideal for a TV or projector.

### Can I use it for a baby shower or party?

Yes. It is designed as a short, replayable **F1 baby reveal game** for baby showers, gender reveals, family calls and party screens.

## GitHub topics and SEO keywords

For better GitHub discovery, add these repository topics under **About → Topics**:

```text
f1
formula-1
gender-reveal
baby-reveal
gender-reveal-game
f1-gender-reveal
baby-shower
baby-announcement
racing-game
canvas-game
github-pages
javascript
```

Search terms this project targets naturally: **F1 gender reveal**, **Formula 1 gender reveal**, **F1 baby reveal**, **F1 baby announcement**, **gender reveal race**, **baby boy vs baby girl race**, **F1 party game**, **baby shower racing game**, **gender reveal website**, **GitHub Pages gender reveal**.

---

Made for one very big surprise. 💙💖

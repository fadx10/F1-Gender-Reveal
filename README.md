# 🏁 Baby Grand Prix — Gender Reveal

A little one-page web app for a gender reveal: **two Formula 1 cars race for 15 seconds**, staying neck-and-neck until a photo finish. The winning car colours the screen and announces the surprise.

## Run it

Open `index.html` in any modern browser. That's it — no build step, no dependencies.

For the smoothest experience (and so the saved secret sticks reliably), you can also serve the folder locally:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Set the secret (parents only)

1. Click the **⚙ gear** in the top-right corner.
2. Choose **Boy**, **Girl**, or **Surprise** (random winner).
3. Hit **Save & Close**, then start the race.

The result is saved in the browser (`localStorage`) on that device only. Nobody can tell who is going to win until the final metres — the losing car actually leads with about a second to go.

## Deploy to GitHub Pages

The app is fully static, so it works directly on GitHub Pages — no build step, no environment variables, no server code.

1. Push `index.html`, `styles.css`, `app.js`, `README.md`, and `.nojekyll` to a GitHub repository.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Pick your branch (for example `main`) and the **/ (root)** folder, then save.
5. Wait for the Pages build, then open the URL GitHub shows (usually `https://<user>.github.io/<repo>/`).

Notes:

- All asset paths are relative, so the app works from a project subpath.
- `.nojekyll` stops GitHub from running Jekyll processing on the static files.
- The repository must be public, or your GitHub plan must allow Pages for private repositories.
- The secret result is stored in each browser's `localStorage`, so set it on the device you will use for the reveal (or choose **Surprise**).
- Sound starts after the first click/tap, as required by browser autoplay rules.

## Controls

| Action | Control |
| --- | --- |
| Start / restart race | Click **Start the Race**, press `Space` or `Enter` |
| Race again | **Race Again** after the reveal, or press `R` |
| Mute / unmute | Speaker button, or press `M` |
| Close settings | `Esc` |

## How the race works

- F1-style five-light start sequence, then exactly **15 seconds** of racing.
- The cars trade tiny leads throughout the race. The pre-picked winner only overtakes in the last second and crosses the line by a nose.
- HUD shows the countdown, both cars' live speed, and a race-progress bar.
- At the finish: flash, confetti, fireworks, and a big **IT'S A BOY!** / **IT'S A GIRL!** reveal.
- Optional sound is generated live with the Web Audio API — engine notes, starter motor, launch skid, overtake whooshes, final-second beeps, finish thump, crowd roar and firework pops. No audio files needed.

## Files

```
index.html   — page structure / screens
styles.css   — all styling and animations
app.js       — canvas race, physics, particles, sound, flow
.nojekyll    — tells GitHub Pages to serve the files as-is
```

Made for one very big surprise. 💙💖

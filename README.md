# 🏎️ Formula 1 Grand Prix Gender Reveal

An interactive, broadcast-style Formula 1 video game designed for a dramatic, unforgettable gender reveal experience to share with parents and family.

---

## 🏁 How It Works

1. **Pre-Race Teaser Screen**
   - Welcomes parents with a personalized dedication card (e.g., *"Dedicated with love to Grandma & Grandpa"*).
   - Features team matchup cards:
     - **Team Boy Racing** (Electric Blue & Cyan livery, No. 1)
     - **Team Girl Racing** (Rose Gold & Magenta livery, No. 1)
   - Features a prominent **"START THE RACE"** play button with sound prompt.

2. **FIA 5-Red-Lights Starting Gantry Countdown**
   - 5 red lights illuminate sequentially with authentic timing beeps: 🔴... 🔴... 🔴... 🔴... 🔴
   - A dramatic pause...
   - **LIGHTS OUT AND AWAY WE GO!** Both cars launch with screaming V6 turbo-hybrid engine revs and tire smoke!

3. **30-Second Close-Up F1 Duel (Watch-Only on Same Screen)**
   - **Focused Wheel-to-Wheel Camera**: Instead of a bird's eye view of the entire lap, the camera is locked right onto the two cars battling back-and-forth side-by-side at 330 km/h on an infinite scrolling racing circuit!
   - **High-Detail 3D Formula 1 Cars**: Tapered monocoque chassis, specular aerodynamic lighting, halo cockpit with driver helmets, multi-element carbon fiber front wings, Pirelli Soft compound tires with rim rotation blur, working DRS actuators that flip open on straights, titanium sparks showering the tarmac, and glowing exhaust boost flames!
   - **Tactile 3D Cards**: Team selection cards and announcement banners feature 3D perspective depth, metallic beveled borders, inner glass glares, and multi-tier drop shadows.
   - **Procedural Web Audio Engine**: Dynamic V6 turbo-hybrid engine roar that changes pitch with gear shifts, tire screeches, kerb vibrations, DRS double-beeps, and team radio transmissions.
   - **The 30-Second Race Drama**:
     - **0s – 7s**: Turn 1 wheel-to-wheel launch and early lead dive.
     - **8s – 15s**: Trailing car tucks into slipstream, DRS wing flap opens at 330 km/h, pulls alongside!
     - **15s – 22s**: Late braking into the chicane! Positions swap with tires smoking!
     - **22s – 26s**: Final Lap announcement! Side-by-side rubbing wheels on kerbs.
     - **27s – 29.5s**: Last-corner slipstream slingshot as your predetermined winning car surges ahead!
     - **30.0s**: Checkered flag across the road! Winner crosses line in P1!

4. **The Grand Gender Reveal & Podium Celebration**
   - **Prominent Color Branding**:
     - **Boy Reveal**: Vibrant Royal Blue gradient hero banner and deep sapphire atmospheric background.
     - **Girl Reveal**: Vibrant Rose-Pink gradient hero banner and deep magenta atmospheric background.
   - **Interactive Fireworks Simulation**: Ascending rockets, explosive radial spark bursts, shimmering stardust trails, and podium pyro fountains.
   - **Heartfelt Keepsake Letter**: Personalized message for the parents/grandparents with expected baby due date.
   - **Interactive Controls**: "Replay GP Race (30s)", "Copy Link for Family", and "Launch Fireworks! 🎆".

---

## 🔗 How to Configure & Share Links with Parents

### Option 1: Direct URL Sharing (Instant & Easiest)

You can send direct links to your parents with the winner pre-configured:

- **For a Boy reveal**:
  ```
  https://your-app-url/?winner=boy&parents=Grandma%20%26%20Grandpa
  ```

- **For a Girl reveal**:
  ```
  https://your-app-url/?winner=girl&parents=Grandma%20%26%20Grandpa
  ```

**Supported URL Parameters:**
- `winner`: `boy` or `girl` (also supports `gender`, `team`, or `reveal`)
- `parents`: Recipient name (e.g. `Mom & Dad` or `Grandma & Grandpa`)
- `due`: Expected arrival note (e.g. `November 2026`)

---

### Option 2: Built-in "Organizer Setup" Menu

1. Open the app and click the **"Organizer Setup"** button in the top right corner.
2. Select **Team Boy Racing** or **Team Girl Racing** as the winner.
3. Customize your parents' dedication name and baby arrival date.
4. Click **"Copy"** to copy your ready-to-send link, or **"Test Race Now"** to preview the full 30-second broadcast!

---

## 🚀 Deploying to GitHub Pages

This project is pre-configured for GitHub Pages:

1. **Push your code to your GitHub repository** (`main` or `master` branch).
2. On GitHub, navigate to **Settings** > **Pages** (in the left sidebar).
3. Under **Build and deployment**:
   - Set **Source** to **GitHub Actions**.
4. The included `.github/workflows/deploy.yml` workflow will automatically run, build, and deploy your site to:
   ```
   https://<your-username>.github.io/<your-repo-name>/
   ```
5. Share the generated links directly with your parents:
   ```
   https://<your-username>.github.io/<your-repo-name>/?winner=boy&parents=Grandma%20%26%20Grandpa
   ```

---

## 🛠️ Technology Stack

- **Framework**: React 19 (TypeScript) + Vite
- **Styling**: Tailwind CSS v4 with custom sports display typography
- **Graphics Engine**: 60 FPS HTML5 Canvas animation with 3D shadow math and particle systems
- **Audio Engine**: Browser Web Audio API synthesizing V6 turbo-hybrid engine frequencies, gantry beeps, tire screeches, and podium fanfare
- **Icons**: Lucide React

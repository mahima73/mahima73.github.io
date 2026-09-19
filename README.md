# Mahima Tolani — Portfolio

An epic, 3D-powered personal portfolio for **Mahima Tolani** — Software Developer, Singer &amp; AI Video Creator.

Built as a fast, self-contained static site: WebGL background (Three.js), glassmorphism UI, scroll animations, custom cursor, animated role typing, count-up stats, tilt card, and a demo music player. No build step required.

## Structure

```
index.html
assets/
  css/style.css
  js/three-scene.js   # WebGL particle nebula + reactive geometry
  js/main.js          # UI interactions & animations
.nojekyll             # lets GitHub Pages serve files as-is
```

Third-party libraries (Three.js, Boxicons, Google Fonts) load from CDN, so nothing needs to be installed or bundled.

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
# Python
python -m http.server 8000
# then open http://localhost:8000
```

## Deploy to GitHub Pages

1. Create a repository (for a user site use the name `<username>.github.io`, otherwise any name works).
2. Push these files to the repository root:
   ```bash
   git init
   git add .
   git commit -m "Portfolio"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment**, set **Source = Deploy from a branch**, **Branch = `main` / `root`**, then **Save**.
4. The site goes live at `https://<username>.github.io/<repo>/` (or `https://<username>.github.io/` for a user site).

## Customize

- **Links** — real GitHub (`github.com/mahima73`), LinkedIn, and Instagram (`ai_vala_bachpan`) are wired in. Update the flight-project `Live`/`Code` links if a repo becomes public.
- **Projects** — edit the `<article class="project-card">` blocks; add repo/live links.
- **Music player** — plays `assets/audio/mahima-vocal.mp3` (her vocal). Swap that file to change the track; player logic lives in `main.js` (`#playerAudio` / `#playerPlay`).
- **Colours** — tweak the `--c1 / --c2 / --c3` gradient variables at the top of `style.css`.
- **Images** — her photo (`assets/img/mahima.jpeg`) powers the hero card and About portrait; replace that file to update both.

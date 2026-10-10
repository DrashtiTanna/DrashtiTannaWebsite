# Drashti Tanna — Landscape Architecture Portfolio

Personal portfolio and curriculum vitae for Drashti Tanna. The homepage introduces her approach to architecture and landscape, presents her education and experience, and links to the two interactive projects. Each project lives in its own folder under `projects/`.

The homepage follows the CV's red-and-ink visual theme. Its landscape panorama is an AI-refined, CV-inspired ink illustration; the original CV artwork remains unchanged in `shared/assets/cv-landscape.jpg`. The optimized website version is `shared/assets/cv-landscape-enhanced.webp`; illustration notes are in `docs/illustration-notes.md`.

A dependency-free, projected 3D terrain study responds to scrolling and pointer movement, with a settling entrance, walking scale figures, and a gliding bird pair. A cached terrain layer keeps idle character animation lightweight. The study is conceptual, not a model of either project. Replay it from its caption, or pause all motion from the header. System reduced-motion preferences, offscreen/background suspension, and static fallbacks are supported. Project panels use native CSS scroll-driven perspective.

The downloadable CV is at `docs/drashti-tanna-cv.pdf`. Homepage styles and interactions are isolated in `shared/css/home.css`, `shared/js/home.js`, and `shared/js/terrain.js`; the existing project pages keep their shared stylesheet. All homepage fonts and artwork are served locally, with open-source font licenses included. No build step is required.

## Folder structure

```
DrashtiPortfolio/
├── index.html                        ← Home / landing page (links to all projects)
├── shared/
│   ├── assets/                      ← Original CV sketch and optimized panorama
│   ├── css/home.css                 ← Homepage layout and scroll-driven motion
│   ├── css/style.css                ← Styles shared by all project pages
│   ├── fonts/                       ← Local WOFF2 fonts and licenses
│   └── js/                          ← Homepage navigation and terrain study
├── docs/                           ← Downloadable CV and illustration notes
├── scripts/check-site.mjs          ← Buildless static-site checks
└── projects/
    ├── xenia-lunapark/               ← Project 01
    │   ├── index.html                ← Project page (story, timeline, boards)
    │   ├── explore.html              ← 3D experience (orbit + first-person walk)
    │   ├── js/main.js
    │   ├── assets/boards/            ← Full-size board images
    │   ├── assets/thumbs/            ← Board previews
    │   └── docs/xenia-booklet.pdf
    └── beyond-the-boundaries/        ← Project 02
        ├── index.html
        ├── explore.html
        ├── js/beyond.js
        ├── assets/boards/
        ├── assets/thumbs/
        └── docs/beyond-the-boundaries-booklet.pdf
```

## The projects

1. **Xenia Lunapark** (`projects/xenia-lunapark/`) — reuse of the Xenia Motel in Karteros, Crete (Touristic Modernities of the Mediterranean workshop, Politecnico di Milano, 2025, with Magda Borovina & Tatiana Cárdenas).
2. **Beyond the Boundaries** (`projects/beyond-the-boundaries/`) — weaving a new network through land and water in Romano di Lombardia, Italy (Conceptual Analysis & Planning, student award entry 88857).

## Adding a new project

1. Copy an existing project folder as a template, e.g. `projects/xenia-lunapark/` → `projects/my-new-project/`.
2. Keep the same internal layout: `index.html`, optional `explore.html`, `js/`, `assets/boards/`, `assets/thumbs/`, `docs/`.
3. Use lowercase-with-dashes folder and file names (no spaces — they break URLs).
4. Link the shared stylesheet from a project page with `../../shared/css/style.css` and link back home with `../../index.html`.
5. Add a card/link for the new project on the root `index.html`.

## The 3D experience

- **Orbit mode** — drag to rotate, scroll to zoom around the whole site model.
- **Walk mode (first person)** — roam the site on foot: `W A S D` / arrows to walk, mouse to look, `SHIFT` to run, `ESC` to exit. On phones/tablets: left-thumb virtual joystick to walk, right-thumb drag to look.
- **Roof terrace** — walk up the red ramp on the east pavilion.
- **Red markers** — click/tap for facility info (all 19 programmed facilities).
- **Night mode** — summer-night scene with string lights, glowing windows and stage light.

Everything is free and open-source: [Three.js](https://threejs.org) (loaded from the jsDelivr CDN), Google Fonts (Space Grotesk + IBM Plex Mono). No build step, no server-side code, no tracking.

## Run it locally

Serve the root folder (opening `index.html` directly also works; internet connection needed for fonts + Three.js CDN):

```
python -m http.server 8000
# then visit http://localhost:8000
```

Run the static checks with Node.js (no dependency installation required):

```
node scripts/check-site.mjs
```

## Deploy for free (GitHub Pages)

1. Create a new GitHub repository (e.g. `drashti-portfolio`) and push this folder to it.
2. Repository → Settings → Pages → Source: `main` branch, `/ (root)`.
3. The site goes live at `https://<username>.github.io/drashti-portfolio/`.

Netlify / Vercel / Cloudflare Pages also work — drag-and-drop the folder, no configuration needed.

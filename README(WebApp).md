# Planora — Official Website

This is the source for the Planora marketing site and bundled web app. Planora is a free task manager for Android (with a web version) that keeps tasks, notes, goals, and a built-in AI assistant called Nora in one place. No accounts, no ads, works offline, under 5MB.

Live site: the landing page at `index.html` and the web app at `app/index.html`.

## What's in this repo

```
planora_officialwebpage/
├── index.html         landing page
├── styles.css         landing page styles
├── script.js          landing page scripts (nav, theme toggle, tabs)
├── favicon.svg
├── app/               the actual Planora web app
│   ├── index.html
│   ├── app.js
│   └── app.css
└── screenshots/       app screenshots used on the site
```

The landing page is a single-page site with sections for features, Nora, the update timeline, screen previews, gallery, and download links. Everything is plain HTML, CSS, and vanilla JS. No build step, no framework, no dependencies.

## Running it locally

Just open `index.html` in a browser. That's it.

If you want to test things that need a real server (the web app uses storage, the gallery uses relative paths), run any static server from this folder:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Editing

- **Landing copy and layout** — `index.html`
- **Landing styles** — `styles.css` (uses CSS variables for theming, dark mode included)
- **Landing JS** — `script.js`
- **The web app itself** — everything in `app/`
- **Screenshots** — drop new ones into `screenshots/` and update the `<img>` tags in the gallery section

The site uses Inter from Google Fonts and an inline SVG logo. Brand color is `#FF8A3D`.

## Deployment

This repo is the deployment site only. Push to `main` and the host picks it up. The current latest release linked from the page is v2.0.0.

## Links

- Download (APK): https://www.mediafire.com/file/4wqi8gc6lfyg7oq/planora_major-update_v3.0.0.apk/file
- Web app: `app/index.html`

## License

All rights reserved, 2026 Planora.

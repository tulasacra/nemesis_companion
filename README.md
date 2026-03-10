# Nemesis Companion
For personal use, unofficial fan app.

A mobile-friendly companion for the board game **Nemesis**.
The main purpose is to reduce overhead and make setup and gameplay faster.

## Features

- **Settings** — Players (1–6), turn limit (8/12/16/20/24)
- **Dice** — Noise die and Attack die with animated results.
- **Objectives** — One random cooperative objective per player.
- **Weaknesses** — Three research objects to reveal random weaknesses.
- **Intruders** — Draw from the intruder bag (Encounter / Development), turn tracker, bag contents.

## PWA

Installable on mobile devices.

## Run locally

Serve the files with any static HTTP server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in a browser.

## Deploy to GitHub Pages

1. Go to your repository **Settings > Pages**
2. Under **Source**, select **Deploy from a branch**
3. Choose the **main** branch and **/ (root)** folder
4. Click **Save**

The site will be live at `https://<username>.github.io/nemesis_companion/`.

## Tech

Vanilla HTML, CSS, and JavaScript. No build step, no dependencies.

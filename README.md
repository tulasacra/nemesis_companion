# nemesis_companion
for personal use, unofficial fan content

A mobile-friendly companion app for the board game **Nemesis**.

## Features

- **Settings** — Choose number of players (1-5), start a new game
- **Dice** — Roll the Noise die or Damage die with animated results
- **Objectives** — Randomly assigns one cooperative objective per player each game
- **Intruder Research** — Three research objects to tap-reveal random weaknesses

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

The site will be live at `https://<username>.github.io/nemesis_companion/`

# Paisa Pilot

Your personal expense tracker. Deploy it free and use it on your phone like a real app.

## ⚠️ Important — avoiding the folder-structure bug

GitHub's "Add file → Upload files" button can flatten subfolders if you drag files the wrong way.
This project **needs** `src/App.jsx` and `src/main.jsx` to stay inside a `src` folder, and the icons to stay inside `public`.

**The safe way to upload:**
1. Unzip this file on your computer first. You should see a folder named `paisa-pilot` containing `src/`, `public/`, `index.html`, etc.
2. On GitHub, create a new **empty** repository (don't add a README/gitignore when creating it).
3. On the repo's empty page, click **"uploading an existing file"**.
4. Open the `paisa-pilot` folder on your computer, select **everything inside it** (index.html, package.json, vite.config.js, README.md, and the `src` and `public` folders themselves), and drag that whole selection into the GitHub upload box in one go.
   - Dragging the folders themselves (not just the files inside them) is what keeps `src/App.jsx` at `src/App.jsx` instead of dumping `App.jsx` at the root.
5. Scroll down and click **Commit changes**.
6. Click into the `src` folder on GitHub afterward and confirm you see `App.jsx` and `main.jsx` there (not at the repo root). Same check for `public` → should contain `manifest.json`, `icon-192.png`, `icon-512.png`.

## Deploy — Vercel (free)

1. Go to https://vercel.com and sign up/log in with GitHub.
2. Click **Add New Project**, select this repo, leave all settings as default (Vercel auto-detects Vite), click **Deploy**.
3. After ~1 minute you'll get a live link like `paisa-pilot.vercel.app`.
4. Open that link on your phone's browser.
5. Tap the browser menu → **"Add to Home Screen"**. It now opens full-screen with its own icon, like a real app.

## Alternative — Netlify (also free, skips GitHub entirely)

1. Install Node.js if you don't have it: https://nodejs.org
2. Open a terminal in this folder and run:
   ```
   npm install
   npm run build
   ```
3. This creates a `dist` folder.
4. Go to https://app.netlify.com/drop and drag the `dist` folder in. You'll instantly get a live link — no repo needed.

## About your data

Everything (transactions, goals, budgets, bills) is saved directly in your phone's browser storage — private, free, no backend.
- Don't clear your browser's site data for this app, or your entries will be lost.
- It won't sync between your phone and laptop, since each browser keeps its own copy.
- If you want sync across devices later, that needs a small database added — just ask.

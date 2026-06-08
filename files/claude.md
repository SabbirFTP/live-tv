Now let's create the `index.html` root template and config files:Now copy everything to outputs and verify the structure:All 26 files are done. Here's the complete breakdown and the one-shot terminal command to set up your project:

---

## Terminal command — run this first

```bash
mkdir -p my-project/src/components my-project/src/context my-project/src/hooks my-project/src/utils && \
touch my-project/index.html my-project/package.json my-project/vite.config.js my-project/tailwind.config.js my-project/postcss.config.js \
  my-project/src/index.jsx my-project/src/App.jsx my-project/src/style.css my-project/src/script.js \
  my-project/src/components/Header.jsx \
  my-project/src/components/ThemeToggle.jsx \
  my-project/src/components/DisclaimerModal.jsx \
  my-project/src/components/TelegramGate.jsx \
  my-project/src/components/PublicSources.jsx \
  my-project/src/components/SingleStreamInput.jsx \
  my-project/src/components/BulkInput.jsx \
  my-project/src/components/VideoPlayer.jsx \
  my-project/src/components/StatsBar.jsx \
  my-project/src/components/StreamList.jsx \
  my-project/src/components/StreamCard.jsx \
  my-project/src/components/Toast.jsx \
  my-project/src/components/DevCredit.jsx \
  my-project/src/context/ThemeContext.jsx \
  my-project/src/context/StreamContext.jsx \
  my-project/src/hooks/useHlsPlayer.js \
  my-project/src/hooks/useToast.js
```

Then paste content from the downloaded files, and run:

```bash
cd my-project
npm install
npm run dev
```

---

## File map

| File | What it does |
|------|-------------|
| `src/style.css` | All CSS — aurora bg, orbs, glass cards, animations, dark mode, responsive |
| `src/script.js` | All logic — M3U parsing, stream checking, bulk check, M3U export, localStorage, source list |
| `src/App.jsx` | Root — wires all providers and gates together |
| `src/index.jsx` | Vite entry point |
| `src/context/ThemeContext.jsx` | Dark/light mode state + `useTheme()` hook |
| `src/context/StreamContext.jsx` | Global streams state (add/update/delete/clear) |
| `src/hooks/useHlsPlayer.js` | HLS.js player management (play, stop, mute, PiP, fullscreen) |
| `src/hooks/useToast.js` | Toast notification timer |
| `src/components/Header.jsx` | Logo, gradient title, visitor count, Telegram badge |
| `src/components/ThemeToggle.jsx` | Fixed dark/light toggle button |
| `src/components/DisclaimerModal.jsx` | One-time disclaimer overlay |
| `src/components/TelegramGate.jsx` | Telegram join gate with countdown |
| `src/components/PublicSources.jsx` | All source pills — click to fetch + bulk-check |
| `src/components/SingleStreamInput.jsx` | Single URL play/check row |
| `src/components/BulkInput.jsx` | M3U/HTML paste textarea + bulk check with progress |
| `src/components/VideoPlayer.jsx` | HLS video + custom controls (mute, PiP, fullscreen, volume) |
| `src/components/StatsBar.jsx` | Total / Live / Blocked / Dead counts + live-rate bar |
| `src/components/StreamList.jsx` | Tabs, search, select-bar, download/copy actions, card list |
| `src/components/StreamCard.jsx` | Individual stream row with status tag + play/check/copy/delete |
| `src/components/Toast.jsx` | Bottom toast popup |
| `src/components/DevCredit.jsx` | Developer footer with GitHub + Telegram links |
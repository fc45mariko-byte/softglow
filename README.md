# Mochi 🎀

Your personal dashboard. Pink Poison tracker, body log, skincare rituel, meals, and Mochi — your built-in AI.

---

## Stack

| Layer | Tool |
|---|---|
| App (PWA) | HTML/CSS/JS |
| Hosting | GitHub Pages |
| Database | Supabase (Postgres) |
| AI companion | Anthropic API (claude-haiku-4-5) |

---

## Setup — do this once

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) → New project (free)
2. Once created, go to **Table Editor** and create these 3 tables:

**`pink_poison`**
| column | type | default |
|---|---|---|
| id | int8 | generated always as identity |
| created_at | timestamptz | now() |
| name | text | |
| buy_price | float8 | |
| sell_price | float8 | |
| status | text | 'En stock' |

**`body_log`**
| column | type | default |
|---|---|---|
| id | int8 | generated always as identity |
| logged_at | timestamptz | now() |
| weight | float8 | |
| goal_weight | float8 | |

**`meals`**
| column | type | default |
|---|---|---|
| id | int8 | generated always as identity |
| logged_at | timestamptz | now() |
| meal_type | text | |
| ingredients | text[] | |

3. Go to **Settings → API** and copy:
   - `Project URL` → paste into `js/db.js` as `SUPABASE_URL`
   - `anon public` key → paste into `js/db.js` as `SUPABASE_KEY`

4. Go to **Authentication → Policies** and for each table, add a policy:
   - Policy name: `allow all`
   - Target roles: leave empty
   - Using expression: `true`

---

### 2. Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create key
3. Paste it into `js/app.js` as `ANTHROPIC_KEY`

---

### 3. GitHub Pages

1. Push all files to the `main` branch of this repo
2. Go to repo **Settings → Pages → Source**: select `main` branch, `/ (root)`
3. Your app is live at `https://fc45mariko-byte.github.io/softglow`

---

### 4. Install on iPhone

1. Open the URL in **Safari** (must be Safari, not Chrome)
2. Tap the **Share** button → **Add to Home Screen**
3. Tap **Add**

Done. Mochi is now on your home screen like a native app.

---

### 5. App icon

Put your Mochi image in `icons/` as:
- `icon-192.png` (192×192px)
- `icon-512.png` (512×512px)
- `mochi-char.png` — the character in the header

---

## File structure

```
softglow/
├── index.html
├── manifest.json
├── sw.js
├── css/
│   └── style.css
├── js/
│   ├── db.js
│   └── app.js
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    └── mochi-char.png
```

---

## Updating the app

Push changes to `main` → GitHub Pages redeploys in ~1 min → pull-to-refresh on iPhone picks up the update.

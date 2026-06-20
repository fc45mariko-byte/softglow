# Mochi 🎀

Personal dashboard PWA — Pink Poison tracker, body log, skincare rituel, meals, mood, and Mochi your AI companion.

## Setup (one time)

### 1. Supabase

Create a free project at supabase.com, then create these 4 tables:

**`pink_poison`** — `id int8 identity`, `created_at timestamptz default now()`, `name text`, `buy_price float8`, `sell_price float8 null`, `status text default 'En stock'`

**`body_log`** — `id int8 identity`, `logged_at timestamptz default now()`, `weight float8`, `goal_weight float8 null`

**`meals`** — `id int8 identity`, `logged_at timestamptz default now()`, `meal_type text`, `note text null`

**`mood_log`** — `id int8 identity`, `logged_at timestamptz default now()`, `score int2`, `note text null`

For each table: **Authentication → Policies → New policy → "For full customization"** → set `using (true)` for all operations (SELECT, INSERT, UPDATE, DELETE).

Go to **Settings → API**, copy `Project URL` and `anon public` key.

### 2. Anthropic key

Get a key at console.anthropic.com → API Keys.

### 3. Fill in `js/config.js`

```js
const SUPABASE_URL = 'https://xxxx.supabase.co';
const SUPABASE_KEY = 'eyJ...';
const ANTHROPIC_KEY = 'sk-ant-...';
```

### 4. Add your icons

Put your Mochi art in `icons/`:
- `icon-192.png` + `icon-512.png` — app icon
- `mochi-neutral.png` — default face
- `mochi-happy.png` — all rituel done or mood ≥ 7
- `mochi-sleepy.png` — night hours (21h–5h)
- `mochi-cheer.png` — Pink Poison sale logged

Any missing image falls back gracefully to the next, then to 🎀.

### 5. Deploy to GitHub Pages

1. Merge `claude/my-app-dpeutc` → `main`
2. Repo **Settings → Pages → Source**: `main` branch, `/ (root)`
3. Live at `https://fc45mariko-byte.github.io/softglow`

### 6. Install on iPhone

Safari → share → **Add to Home Screen** → Add. Done.

---

## Screens (swipe left/right)

| # | Screen | What's there |
|---|---|---|
| 1 | Today | Body summary + rituel progress glance |
| 2 | Body | Weight log, goal progress bar, line chart |
| 3 | Rituel | 5-step skincare checklist (resets daily) |
| 4 | Meals | Free-text meal log for today |
| 5 | Pink Poison | Vinted resale tracker + stats |
| 6 | Mood | 1–10 slider + note |

Mochi (bottom-right) reacts to your data and opens a Franglais AI chat.

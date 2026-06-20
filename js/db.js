// ── SUPABASE CONFIG ───────────────────────────────────────────────────
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Prefer': 'return=representation'
};

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers,
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('Supabase error:', err);
    return null;
  }
  return res.status === 204 ? null : res.json();
}

// ── PINK POISON ───────────────────────────────────────────────────
const PP = {
  async getAll() {
    return sbFetch('pink_poison?order=created_at.desc') || [];
  },
  async add(item) {
    return sbFetch('pink_poison', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  },
  async update(id, patch) {
    return sbFetch(`pink_poison?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  },
  async delete(id) {
    return sbFetch(`pink_poison?id=eq.${id}`, { method: 'DELETE' });
  }
};

// ── BODY TRACKING ───────────────────────────────────────────────────
const Body = {
  async getLogs() {
    return sbFetch('body_log?order=logged_at.desc&limit=30') || [];
  },
  async add(entry) {
    return sbFetch('body_log', {
      method: 'POST',
      body: JSON.stringify(entry)
    });
  }
};

// ── MEALS ───────────────────────────────────────────────────────────
const Meals = {
  async getToday() {
    const today = new Date().toISOString().split('T')[0];
    return sbFetch(`meals?logged_at=gte.${today}T00:00:00&order=logged_at.desc`) || [];
  },
  async getAll() {
    return sbFetch('meals?order=logged_at.desc&limit=50') || [];
  },
  async add(meal) {
    return sbFetch('meals', {
      method: 'POST',
      body: JSON.stringify(meal)
    });
  }
};

// ── SKINCARE ──────────────────────────────────────────────────────
const Skincare = {
  todayKey() {
    return `skincare_${new Date().toISOString().split('T')[0]}`;
  },
  getToday() {
    try { return JSON.parse(localStorage.getItem(this.todayKey())) || []; }
    catch { return []; }
  },
  save(steps) {
    localStorage.setItem(this.todayKey(), JSON.stringify(steps));
  }
};

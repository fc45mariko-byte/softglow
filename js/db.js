// SUPABASE HELPERS
function _hdrs() {
  return {
    'Content-Type':  'application/json',
    'apikey':        SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer':        'return=representation'
  };
}

async function sbFetch(path, options = {}) {
  if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: _hdrs(), ...options });
    if (!res.ok) { console.warn('Supabase', res.status); return null; }
    return res.status === 204 ? null : res.json();
  } catch (e) { console.warn('Supabase fetch error', e); return null; }
}

const PP = {
  getAll:  ()          => sbFetch('pink_poison?order=created_at.desc'),
  add:     (item)      => sbFetch('pink_poison', { method: 'POST', body: JSON.stringify(item) }),
  update:  (id, patch) => sbFetch(`pink_poison?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove:  (id)        => sbFetch(`pink_poison?id=eq.${id}`, { method: 'DELETE' })
};

const Body = {
  getLogs: () => sbFetch('body_log?order=logged_at.desc&limit=30'),
  add:     (e) => sbFetch('body_log', { method: 'POST', body: JSON.stringify(e) })
};

const Meals = {
  getToday: () => {
    const t = new Date().toISOString().split('T')[0];
    return sbFetch(`meals?logged_at=gte.${t}T00:00:00&order=logged_at.desc`);
  },
  add: (m) => sbFetch('meals', { method: 'POST', body: JSON.stringify(m) })
};

const MoodDB = {
  getRecent: () => sbFetch('mood_log?order=logged_at.desc&limit=10'),
  add:       (e) => sbFetch('mood_log', { method: 'POST', body: JSON.stringify(e) })
};

const Skincare = {
  _key() { return `skincare_${new Date().toISOString().split('T')[0]}`; },
  getToday() {
    try { return JSON.parse(localStorage.getItem(this._key())) || []; } catch { return []; }
  },
  save(steps) { localStorage.setItem(this._key(), JSON.stringify(steps)); }
};

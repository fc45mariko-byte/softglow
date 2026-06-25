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
    if (!res.ok) { console.warn('Supabase', res.status, await res.text().catch(() => '')); return null; }
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
  getLogs: ()          => sbFetch('body_log?order=logged_at.desc&limit=30'),
  add:     (e)         => sbFetch('body_log', { method: 'POST', body: JSON.stringify(e) }),
  update:  (id, patch) => sbFetch(`body_log?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove:  (id)        => sbFetch(`body_log?id=eq.${id}`, { method: 'DELETE' })
};

const Meals = {
  getToday: () => {
    const t = new Date().toISOString().split('T')[0];
    return sbFetch(`meals?logged_at=gte.${t}T00:00:00&order=logged_at.desc`);
  },
  getAll:  ()          => sbFetch('meals?order=logged_at.desc&limit=100'),
  add:     (m)         => sbFetch('meals', { method: 'POST', body: JSON.stringify(m) }),
  update:  (id, patch) => sbFetch(`meals?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove:  (id)        => sbFetch(`meals?id=eq.${id}`, { method: 'DELETE' })
};

const MoodDB = {
  getRecent: () => sbFetch('mood_log?order=logged_at.desc&limit=30'),
  add:       (e)         => sbFetch('mood_log', { method: 'POST', body: JSON.stringify(e) }),
  update:    (id, patch) => sbFetch(`mood_log?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove:    (id)        => sbFetch(`mood_log?id=eq.${id}`, { method: 'DELETE' })
};

const Measurements = {
  getAll:  ()          => sbFetch('measurements?order=logged_at.desc&limit=30'),
  add:     (e)         => sbFetch('measurements', { method: 'POST', body: JSON.stringify(e) }),
  update:  (id, patch) => sbFetch(`measurements?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove:  (id)        => sbFetch(`measurements?id=eq.${id}`, { method: 'DELETE' })
};

const Expenses = {
  getThisMonth: () => {
    const d = new Date();
    const first = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
    return sbFetch(`expenses?date=gte.${first}&order=date.desc`);
  },
  getAll:  ()          => sbFetch('expenses?order=date.desc&limit=100'),
  add:     (e)         => sbFetch('expenses', { method: 'POST', body: JSON.stringify(e) }),
  update:  (id, patch) => sbFetch(`expenses?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove:  (id)        => sbFetch(`expenses?id=eq.${id}`, { method: 'DELETE' })
};

const Skincare = {
  _key(part) {
    const d = new Date().toISOString().split('T')[0];
    return part ? `skincare_${part}_${d}` : `skincare_${d}`;
  },
  getToday(part) {
    try { return JSON.parse(localStorage.getItem(this._key(part))) || []; } catch { return []; }
  },
  save(steps, part) { localStorage.setItem(this._key(part), JSON.stringify(steps)); }
};

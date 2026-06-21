// TIME-OF-DAY GRADIENT
const GRADIENTS = {
  morning:   ['#FFE3EF', '#FAD4E3', '#FCEEF4'],
  afternoon: ['#F9B6CF', '#FAD4E3', '#FFF0F6'],
  evening:   ['#E8739A', '#F4A7C0', '#FAD4E3'],
  night:     ['#C98FA8', '#E5B8CC', '#F3DCE7']
};
function applyGradient() {
  const h = new Date().getHours();
  const key = h >= 5 && h < 11 ? 'morning'
            : h >= 11 && h < 17 ? 'afternoon'
            : h >= 17 && h < 21 ? 'evening'
            : 'night';
  const [a,b,c] = GRADIENTS[key];
  document.body.style.background = `linear-gradient(160deg, ${a}, ${b}, ${c})`;
}

// STATE
let ppItems = [], ppFilter = 'all', ppEditId = null;
let weightLogs = [], mealLogs = [], moodLogs = [];

// SWIPE + DOTS
const $container = document.getElementById('swipeContainer');
const $dots      = document.querySelectorAll('.dot');

$container.addEventListener('scroll', () => {
  const idx = Math.round($container.scrollLeft / window.innerWidth);
  $dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  if (idx === 1) _drawChart();
}, { passive: true });

$dots.forEach(d => {
  d.addEventListener('click', () => {
    $container.scrollTo({ left: parseInt(d.dataset.screen) * window.innerWidth, behavior: 'smooth' });
  });
});

// GREETING + DATE
function _setGreetingDate() {
  const h = new Date().getHours();
  const greet = h >= 5 && h < 12 ? 'good morning'
              : h >= 12 && h < 18 ? 'good afternoon'
              : h >= 18 && h < 21 ? 'bonsoir'
              : 'bonne nuit';
  document.getElementById('greeting').textContent = greet;
  const str = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('today-date').textContent = str;
  document.getElementById('rituel-date').textContent = str;
}

// WEIGHT CHART (HiDPI canvas)
function _drawChart() {
  const canvas = document.getElementById('weight-chart');
  if (!canvas || !weightLogs.length) return;
  const dpr  = window.devicePixelRatio || 1;
  const W    = canvas.parentElement.clientWidth - 32;
  const H    = 110;
  canvas.width  = W * dpr;  canvas.height  = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const ctx  = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const pts  = [...weightLogs].reverse();
  const vals = pts.map(l => l.weight);
  const minW = Math.min(...vals) - 0.5;
  const maxW = Math.max(...vals) + 0.5;
  const rng  = maxW - minW || 1;
  const PAD  = 10;
  const xOf  = i => pts.length < 2 ? W / 2 : PAD + (i / (pts.length - 1)) * (W - PAD * 2);
  const yOf  = w => H - PAD - ((w - minW) / rng) * (H - PAD * 2);

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(232,115,154,0.28)');
  grad.addColorStop(1, 'rgba(232,115,154,0)');

  ctx.beginPath();
  pts.forEach((l, i) => i === 0 ? ctx.moveTo(xOf(i), yOf(l.weight)) : ctx.lineTo(xOf(i), yOf(l.weight)));
  ctx.strokeStyle = '#E8739A'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();

  ctx.lineTo(xOf(pts.length - 1), H); ctx.lineTo(xOf(0), H);
  ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

  pts.forEach((l, i) => {
    ctx.beginPath(); ctx.arc(xOf(i), yOf(l.weight), 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#E8739A'; ctx.fill();
    ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5; ctx.stroke();
  });
}

// SYNC MOCHI CONTEXT
function _syncMochi() {
  const done = Skincare.getToday();
  const sold = ppItems.filter(i => i.status === 'Vendu');
  const rev  = sold.reduce((s, i) => s + ((i.sell_price || 0) - (i.buy_price || 0)), 0);
  window._mochiCtx = {
    ppCount: ppItems.length, ppRevenue: rev.toFixed(2),
    skincareCount: done.length, allRituelDone: done.length === 5,
    weight: weightLogs[0]?.weight,
    moodScore: moodLogs[0]?.score ?? null,
    mealsCount: mealLogs.length
  };
  if (typeof mochiRecompute === 'function') mochiRecompute();
}

// RENDER: PP
function renderPP() {
  const list     = document.getElementById('pp-list');
  const filtered = ppFilter === 'all' ? ppItems : ppItems.filter(i => i.status === ppFilter);
  list.innerHTML = filtered.length ? filtered.map(item => {
    const m      = item.sell_price && item.buy_price
      ? Math.round(((item.sell_price - item.buy_price) / item.buy_price) * 100) : null;
    const cls    = item.status === 'Vendu' ? 'vendu' : item.status === 'Annulé' ? 'annule' : '';
    const ppIdx  = ppItems.indexOf(item);
    return `<div class="item-card" data-pp-idx="${ppIdx}" style="cursor:pointer"><div class="item-name">${item.name}</div><div class="item-meta">
      <span>Achat: ${item.buy_price}€</span>
      ${item.sell_price ? `<span>Vente: ${item.sell_price}€</span>` : ''}
      ${m !== null ? `<span class="margin-tag">+${m}%</span>` : ''}
      <span class="badge ${cls}">${item.status}</span></div></div>`;
  }).join('') : '<div class="empty-state">aucun article pour l&apos;instant &#127872;</div>';

  const sold  = ppItems.filter(i => i.status === 'Vendu');
  const stock = ppItems.filter(i => i.status === 'En stock');
  const rev   = sold.reduce((s, i) => s + ((i.sell_price || 0) - (i.buy_price || 0)), 0);
  const stVal = stock.reduce((s, i) => s + (i.sell_price || i.buy_price || 0), 0);
  const marg  = sold.length ? Math.round(sold.reduce((s, i) =>
    s + (((i.sell_price - i.buy_price) / i.buy_price) * 100), 0) / sold.length) : 0;
  document.getElementById('pp-revenue').textContent   = `${rev.toFixed(2)}€`;
  document.getElementById('pp-stock-val').textContent = `${stVal.toFixed(2)}€`;
  document.getElementById('pp-margin').textContent    = `${marg}%`;
  _syncMochi();
}

document.querySelectorAll('.filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(f => f.classList.remove('active'));
    btn.classList.add('active'); ppFilter = btn.dataset.filter; renderPP();
  });
});

// Tap a PP card to edit it
document.getElementById('pp-list').addEventListener('click', e => {
  const card = e.target.closest('[data-pp-idx]');
  if (!card) return;
  const item = ppItems[parseInt(card.dataset.ppIdx)];
  if (!item) return;
  ppEditId = item.id;
  document.getElementById('modal-item-title').textContent = 'Modifier l\'article';
  document.getElementById('item-name').value   = item.name;
  document.getElementById('item-buy').value    = item.buy_price;
  document.getElementById('item-sell').value   = item.sell_price || '';
  document.getElementById('item-status').value = item.status;
  openModal('modal-item');
});

// RENDER: BODY
function renderBody() {
  const log = document.getElementById('weight-log');
  if (!weightLogs.length) {
    log.innerHTML = '<div class="empty-state">aucun log poids encore &#127872;</div>';
    return;
  }
  log.innerHTML = weightLogs.slice(0, 10).map(w =>
    `<div class="item-card"><div class="item-name">${w.weight} kg</div>
    <div class="item-meta">${new Date(w.logged_at).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })}</div></div>`
  ).join('');

  const latest = weightLogs[0];
  const goal   = latest.goal_weight;
  document.getElementById('ba-current').textContent     = `${latest.weight}kg`;
  document.getElementById('ba-goal').textContent        = goal ? `${goal}kg` : '—kg';
  document.getElementById('today-weight').textContent   = latest.weight;
  document.getElementById('today-goal-text').textContent = goal ? `objectif ${goal}kg` : '';

  if (goal) {
    const start = weightLogs[weightLogs.length - 1].weight;
    const total = Math.abs(start - goal);
    const done  = Math.abs(start - latest.weight);
    const pct   = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
    document.getElementById('body-progress').style.width  = `${pct}%`;
    document.getElementById('today-progress').style.width = `${pct}%`;
  }
  _drawChart();
  _syncMochi();
}

// RENDER: MEALS
function renderMeals() {
  const list = document.getElementById('meal-list');
  list.innerHTML = mealLogs.length ? mealLogs.map(m =>
    `<div class="item-card"><div class="item-name">${m.meal_type}</div>
    <div class="item-meta"><span>${m.note || ''}</span>
    <span style="margin-left:auto">${new Date(m.logged_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span></div></div>`
  ).join('') : '<div class="empty-state">rien encore &#8212; log ton premier repas &#127872;</div>';
  _syncMochi();
}

// RENDER: SKINCARE
function renderSkincare() {
  const done  = Skincare.getToday();
  const steps = ['Oil Cleanser','Toner','Vitamin C Serum','Moisturizer','SPF 50+'];
  document.getElementById('today-rituel-count').textContent = `${done.length}/5 done today`;
  document.getElementById('today-step-dots').innerHTML = steps.map(s =>
    `<div class="step-dot${done.includes(s) ? ' done' : ''}"></div>`
  ).join('');
  document.querySelectorAll('#skincare-full input[type=checkbox]').forEach(cb => {
    const fresh = cb.cloneNode(true);
    cb.parentNode.replaceChild(fresh, cb);
    fresh.checked = done.includes(fresh.dataset.step);
    fresh.addEventListener('change', () => {
      const cur     = Skincare.getToday();
      const updated = fresh.checked
        ? [...new Set([...cur, fresh.dataset.step])]
        : cur.filter(s => s !== fresh.dataset.step);
      Skincare.save(updated);
      renderSkincare();
      _syncMochi();
    });
  });
}

// RENDER: MOODS
function renderMoods() {
  const list = document.getElementById('mood-list');
  list.innerHTML = moodLogs.length ? moodLogs.map(m =>
    `<div class="item-card"><div style="display:flex;align-items:center;gap:14px">
    <span style="font-size:30px;font-weight:200;color:var(--pink-deep)">${m.score}</span>
    <div><div class="item-name">${m.note || '—'}</div>
    <div class="item-meta">${new Date(m.logged_at).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}</div></div>
    </div></div>`
  ).join('') : '<div class="empty-state">aucun log mood &#127872;</div>';
  _syncMochi();
}

// MOOD SLIDER
const $slider  = document.getElementById('mood-slider');
const $display = document.getElementById('mood-display');
function _updateSliderTrack() {
  const pct = ($slider.value - 1) / 9 * 100;
  $slider.style.background =
    `linear-gradient(90deg, var(--pink-deep) ${pct}%, rgba(232,115,154,0.2) ${pct}%)`;
  $display.textContent = $slider.value;
}
$slider.addEventListener('input', _updateSliderTrack);

// MODALS
const openModal  = id => document.getElementById(id).classList.add('open');
const closeModal = id => document.getElementById(id).classList.remove('open');
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
});

// Weight
document.getElementById('openLogWeight').addEventListener('click', () => openModal('modal-weight'));
document.getElementById('cancelWeight').addEventListener('click', () => closeModal('modal-weight'));
document.getElementById('saveWeight').addEventListener('click', async () => {
  const w = parseFloat(document.getElementById('weight-val').value);
  const g = parseFloat(document.getElementById('weight-goal-inp').value) || null;
  if (!w) return;
  const saved = await Body.add({ weight: w, goal_weight: g, logged_at: new Date().toISOString() });
  if (saved) {
    weightLogs.unshift(saved[0]); renderBody(); closeModal('modal-weight');
    document.getElementById('weight-val').value = '';
    document.getElementById('weight-goal-inp').value = '';
  }
});

// Meals
document.getElementById('openAddMeal').addEventListener('click', () => openModal('modal-meal'));
document.getElementById('cancelMeal').addEventListener('click',  () => closeModal('modal-meal'));
document.getElementById('saveMealBtn').addEventListener('click', async () => {
  const type = document.getElementById('meal-type').value;
  const note = document.getElementById('meal-note').value.trim() || null;
  const saved = await Meals.add({ meal_type: type, note, logged_at: new Date().toISOString() });
  if (saved) {
    mealLogs.unshift(saved[0]); renderMeals(); closeModal('modal-meal');
    document.getElementById('meal-note').value = '';
  }
});

// Pink Poison — open in ADD mode
document.getElementById('openAddItem').addEventListener('click', () => {
  ppEditId = null;
  document.getElementById('modal-item-title').textContent = 'Nouvel article';
  ['item-name','item-buy','item-sell'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('item-status').value = 'En stock';
  openModal('modal-item');
});
document.getElementById('cancelItem').addEventListener('click', () => {
  ppEditId = null;
  closeModal('modal-item');
});
document.getElementById('saveItem').addEventListener('click', async () => {
  const name   = document.getElementById('item-name').value.trim();
  const buy    = parseFloat(document.getElementById('item-buy').value);
  const sell   = parseFloat(document.getElementById('item-sell').value) || null;
  const status = document.getElementById('item-status').value;
  if (!name || !buy) return;

  if (ppEditId !== null) {
    const patch = { name, buy_price: buy, sell_price: sell, status };
    await PP.update(ppEditId, patch);
    const idx = ppItems.findIndex(i => i.id === ppEditId);
    if (idx !== -1) ppItems[idx] = { ...ppItems[idx], ...patch };
    ppEditId = null;
  } else {
    const saved = await PP.add({ name, buy_price: buy, sell_price: sell, status });
    if (saved) {
      ppItems.unshift(saved[0]);
      if (status === 'Vendu' && typeof mochiTriggerCheer === 'function') mochiTriggerCheer();
    }
  }
  renderPP(); closeModal('modal-item');
  ['item-name','item-buy','item-sell'].forEach(id => { document.getElementById(id).value = ''; });
});

// Mood
document.getElementById('saveMoodBtn').addEventListener('click', async () => {
  const score = parseInt($slider.value, 10);
  const note  = document.getElementById('mood-note').value.trim() || null;
  const saved = await MoodDB.add({ score, note, logged_at: new Date().toISOString() });
  if (saved) {
    moodLogs.unshift(saved[0]); renderMoods();
    document.getElementById('mood-note').value = '';
  }
});

// INIT
async function init() {
  applyGradient();
  _setGreetingDate();
  _updateSliderTrack();

  const [items, logs, meals, moods] = await Promise.all([
    PP.getAll(), Body.getLogs(), Meals.getToday(), MoodDB.getRecent()
  ]);
  ppItems = items || []; weightLogs = logs || [];
  mealLogs = meals || []; moodLogs = moods || [];

  renderPP(); renderBody(); renderMeals(); renderSkincare(); renderMoods();

  setInterval(applyGradient, 30 * 60 * 1000);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

init();

// TIME-OF-DAY GRADIENT
const GRADIENTS = {
  morning:   ['#FFE3EF', '#FAD4E3', '#FCEEF4'],
  afternoon: ['#F9B6CF', '#FAD4E3', '#FFF0F6'],
  evening:   ['#E8739A', '#F4A7C0', '#FAD4E3'],
  night:     ['#C98FA8', '#E5B8CC', '#F3DCE7']
};
function applyGradient() {
  const h = new Date().getHours();
  const key = h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 17 ? 'afternoon' : h >= 17 && h < 21 ? 'evening' : 'night';
  const [a,b,c] = GRADIENTS[key];
  document.body.style.background = `linear-gradient(160deg, ${a}, ${b}, ${c})`;
}

const MATIN_STEPS = ['Oil Cleanser', 'Toner', 'Vitamin C Serum', 'Moisturizer', 'SPF 50+'];
const SOIR_STEPS  = ['Double Cleanse', 'Exfoliant', 'Toner', 'Retinol/Treatment', 'Night Moisturizer', 'Lip mask'];

// STATE
let ppItems = [], ppFilter = 'all', ppEditId = null;
let weightLogs = [], mealLogs = [], moodLogs = [], measureLogs = [], expenseLogs = [];
let weightEditId = null, mealEditId = null, measureEditId = null, expenseEditId = null, moodEditId = null;
let _mealHealthy = null;
let _mealsTab = 'today';

// SWIPE NAV + DOTS
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
  const greet = h >= 5 && h < 12 ? 'good morning' : h >= 12 && h < 18 ? 'good afternoon' : h >= 18 && h < 21 ? 'bonsoir' : 'bonne nuit';
  document.getElementById('greeting').textContent = greet;
  const str = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('today-date').textContent = str;
  document.getElementById('rituel-date').textContent = str;
}

// WEIGHT CHART
function _drawChart() {
  const canvas = document.getElementById('weight-chart');
  if (!canvas || !weightLogs.length) return;
  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.parentElement.clientWidth - 32;
  const H   = 110;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
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
  const matinDone = Skincare.getToday('matin');
  const soirDone  = Skincare.getToday('soir');
  const sold = ppItems.filter(i => i.status === 'Vendu');
  const rev  = sold.reduce((s, i) => s + ((i.sell_price || 0) - (i.buy_price || 0)), 0);
  const marg = sold.length ? Math.round(sold.reduce((s, i) => s + (i.buy_price ? ((i.sell_price - i.buy_price) / i.buy_price) * 100 : 0), 0) / sold.length) : 0;
  const expTotal = expenseLogs.reduce((s, e) => s + (e.amount || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  window._mochiCtx = {
    ppCount: ppItems.length, ppRevenue: rev.toFixed(2), ppAvgMargin: marg,
    ppBalance: (rev - expTotal).toFixed(2),
    skincareMatinCount: matinDone.length, skincareSoirCount: soirDone.length,
    allMatinDone: matinDone.length >= MATIN_STEPS.length,
    allSoirDone:  soirDone.length  >= SOIR_STEPS.length,
    weight: weightLogs[0]?.weight,
    moodScore: moodLogs[0]?.score ?? null,
    mealsCount: mealLogs.filter(m => m.logged_at && m.logged_at.startsWith(todayStr)).length,
    expensesTotal: expTotal.toFixed(2)
  };
  if (typeof mochiRecompute === 'function') mochiRecompute();
}

// UNIVERSAL SWIPE-LEFT HANDLER
let _openSwipeRow = null;
let _swipeStartX = 0, _swipeStartY = 0, _swipeTargetRow = null;

function _initSwipe(listEl) {
  listEl.addEventListener('touchstart', e => {
    _swipeStartX = e.touches[0].clientX;
    _swipeStartY = e.touches[0].clientY;
    _swipeTargetRow = e.target.closest('.swipe-row');
  }, { passive: true });
  listEl.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - _swipeStartX;
    const dy = e.changedTouches[0].clientY - _swipeStartY;
    if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < 40) {
      if (_openSwipeRow && _openSwipeRow !== _swipeTargetRow) { _openSwipeRow.classList.remove('open'); _openSwipeRow = null; }
      return;
    }
    if (!_swipeTargetRow) return;
    if (dx < -40) {
      if (_openSwipeRow && _openSwipeRow !== _swipeTargetRow) _openSwipeRow.classList.remove('open');
      _swipeTargetRow.classList.add('open'); _openSwipeRow = _swipeTargetRow;
    } else if (dx > 40) {
      _swipeTargetRow.classList.remove('open');
      if (_openSwipeRow === _swipeTargetRow) _openSwipeRow = null;
    }
  }, { passive: true });
}

function _swipeRow(innerHtml, editCb, deleteCb) {
  const wrap = document.createElement('div');
  wrap.className = 'swipe-row';
  wrap.innerHTML = `<div class="item-card">${innerHtml}</div>
    <div class="swipe-actions">
      <button class="swipe-edit">Modifier</button>
      <button class="swipe-delete">Supprimer</button>
    </div>`;
  wrap.querySelector('.swipe-edit').addEventListener('click', () => {
    wrap.classList.remove('open'); _openSwipeRow = null; editCb();
  });
  wrap.querySelector('.swipe-delete').addEventListener('click', () => {
    wrap.classList.remove('open'); _openSwipeRow = null;
    if (confirm('Supprimer ?')) deleteCb();
  });
  return wrap;
}

function _bindTabs(containerId, onSwitch) {
  document.getElementById(containerId).querySelectorAll('.tab-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.getElementById(containerId).querySelectorAll('.tab-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      onSwitch(pill.dataset.tab);
    });
  });
}

// RENDER: PP
function renderPP() {
  const list     = document.getElementById('pp-list');
  const filtered = ppFilter === 'all' ? ppItems : ppItems.filter(i => i.status === ppFilter);
  list.innerHTML = '';
  if (!filtered.length) {
    list.innerHTML = '<div class="empty-state">aucun article pour l\'instant 🎀</div>';
  } else {
    filtered.forEach(item => {
      const m   = item.sell_price && item.buy_price ? Math.round(((item.sell_price - item.buy_price) / item.buy_price) * 100) : null;
      const cls = item.status === 'Vendu' ? 'vendu' : item.status === 'Annulé' ? 'annule' : '';
      const row = _swipeRow(
        `<div class="item-name">${item.name}</div>
         <div class="item-meta">
           <span>Achat: ${item.buy_price}€</span>
           ${item.sell_price ? `<span>Vente: ${item.sell_price}€</span>` : ''}
           ${m !== null ? `<span class="margin-tag">+${m}%</span>` : ''}
           <span class="badge ${cls}">${item.status}</span>
         </div>`,
        () => _editPP(item),
        async () => { await PP.remove(item.id); ppItems = ppItems.filter(i => i.id !== item.id); renderPP(); }
      );
      list.appendChild(row);
    });
    _initSwipe(list);
  }
  const sold  = ppItems.filter(i => i.status === 'Vendu');
  const stock = ppItems.filter(i => i.status === 'En stock');
  const rev   = sold.reduce((s, i) => s + ((i.sell_price || 0) - (i.buy_price || 0)), 0);
  const stVal = stock.reduce((s, i) => s + (i.sell_price || i.buy_price || 0), 0);
  const marg  = sold.length ? Math.round(sold.reduce((s, i) => s + (i.buy_price ? ((i.sell_price - i.buy_price) / i.buy_price) * 100 : 0), 0) / sold.length) : 0;
  document.getElementById('pp-revenue').textContent   = `${rev.toFixed(2)}€`;
  document.getElementById('pp-stock-val').textContent = `${stVal.toFixed(2)}€`;
  document.getElementById('pp-margin').textContent    = `${marg}%`;
  renderFinances();
  _syncMochi();
}

function _editPP(item) {
  ppEditId = item.id;
  document.getElementById('modal-item-title').textContent = 'Modifier l\'article';
  document.getElementById('item-name').value   = item.name;
  document.getElementById('item-buy').value    = item.buy_price;
  document.getElementById('item-sell').value   = item.sell_price || '';
  document.getElementById('item-status').value = item.status;
  openModal('modal-item');
}

document.querySelectorAll('#screen-pp .filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#screen-pp .filter').forEach(f => f.classList.remove('active'));
    btn.classList.add('active'); ppFilter = btn.dataset.filter; renderPP();
  });
});

// RENDER: BODY
function renderBody() {
  const log = document.getElementById('weight-log');
  log.innerHTML = '';
  if (!weightLogs.length) {
    log.innerHTML = '<div class="empty-state">aucun log poids encore 🎀</div>';
    document.getElementById('ba-current').textContent = '—kg';
    document.getElementById('ba-goal').textContent    = '—kg';
    document.getElementById('today-weight').textContent = '—';
    return;
  }
  weightLogs.slice(0, 10).forEach(w => {
    const row = _swipeRow(
      `<div class="item-name">${w.weight} kg</div>
       <div class="item-meta">${new Date(w.logged_at).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}</div>`,
      () => {
        weightEditId = w.id;
        document.getElementById('modal-weight-title').textContent = 'Modifier poids';
        document.getElementById('weight-val').value      = w.weight;
        document.getElementById('weight-goal-inp').value = w.goal_weight || '';
        openModal('modal-weight');
      },
      async () => { await Body.remove(w.id); weightLogs = weightLogs.filter(l => l.id !== w.id); renderBody(); }
    );
    log.appendChild(row);
  });
  _initSwipe(log);
  const latest = weightLogs[0];
  const goal   = latest.goal_weight;
  document.getElementById('ba-current').textContent      = `${latest.weight}kg`;
  document.getElementById('ba-goal').textContent         = goal ? `${goal}kg` : '—kg';
  document.getElementById('today-weight').textContent    = latest.weight;
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

// RENDER: MEASUREMENTS
function renderMeasures() {
  const FIELDS = [
    ['poitrine','Poitrine'],['taille','Taille'],['hanches','Hanches'],
    ['bras_g','Bras G'],['bras_d','Bras D'],['cuisse_g','Cuisse G'],['cuisse_d','Cuisse D']
  ];
  const grid = document.getElementById('measure-summary');
  const list = document.getElementById('measure-list');
  const latest = measureLogs[0] || {};
  grid.innerHTML = FIELDS.map(([key, label]) =>
    `<div class="measure-card"><div class="measure-card-label">${label}</div><div class="measure-card-val">${latest[key] ? latest[key] + ' cm' : '—'}</div></div>`
  ).join('');
  list.innerHTML = '';
  if (!measureLogs.length) { list.innerHTML = '<div class="empty-state">aucune mesure encore 🎀</div>'; return; }
  measureLogs.forEach(m => {
    const vals = FIELDS.filter(([k]) => m[k]).map(([k, l]) => `${l}: ${m[k]}`).join(' · ');
    const row = _swipeRow(
      `<div class="item-name">${new Date(m.logged_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
       <div class="item-meta">${vals || '—'}</div>`,
      () => _editMeasure(m),
      async () => { await Measurements.remove(m.id); measureLogs = measureLogs.filter(l => l.id !== m.id); renderMeasures(); }
    );
    list.appendChild(row);
  });
  _initSwipe(list);
}

function _editMeasure(m) {
  measureEditId = m.id;
  document.getElementById('modal-measure-title').textContent = 'Modifier mesures';
  [['m-poitrine','poitrine'],['m-taille','taille'],['m-hanches','hanches'],
   ['m-bras-g','bras_g'],['m-bras-d','bras_d'],['m-cuisse-g','cuisse_g'],['m-cuisse-d','cuisse_d']
  ].forEach(([elId, key]) => { document.getElementById(elId).value = m[key] || ''; });
  openModal('modal-measure');
}

// RENDER: SKINCARE
function _bindChecklist(elId, steps, part) {
  document.getElementById(elId).querySelectorAll('input[type=checkbox]').forEach(cb => {
    const fresh = cb.cloneNode(true);
    cb.parentNode.replaceChild(fresh, cb);
    const done = Skincare.getToday(part);
    fresh.checked = done.includes(fresh.dataset.step);
    fresh.addEventListener('change', () => {
      const cur     = Skincare.getToday(part);
      const updated = fresh.checked
        ? [...new Set([...cur, fresh.dataset.step])]
        : cur.filter(s => s !== fresh.dataset.step);
      Skincare.save(updated, part);
      renderSkincare();
      _syncMochi();
      if (updated.length === steps.length && typeof mochiReact === 'function') {
        mochiReact('rituel', { part });
      }
    });
  });
}

function renderSkincare() {
  const matinDone = Skincare.getToday('matin');
  const soirDone  = Skincare.getToday('soir');
  document.getElementById('today-matin-count').textContent = `${matinDone.length}/${MATIN_STEPS.length}`;
  document.getElementById('today-soir-count').textContent  = `${soirDone.length}/${SOIR_STEPS.length}`;
  document.getElementById('today-matin-dots').innerHTML = MATIN_STEPS.map(s =>
    `<div class="step-dot${matinDone.includes(s) ? ' done' : ''}"></div>`).join('');
  document.getElementById('today-soir-dots').innerHTML = SOIR_STEPS.map(s =>
    `<div class="step-dot${soirDone.includes(s) ? ' done' : ''}"></div>`).join('');
  _bindChecklist('skincare-matin', MATIN_STEPS, 'matin');
  _bindChecklist('skincare-soir',  SOIR_STEPS,  'soir');
}

// RENDER: MEALS
function renderMeals() {
  const todayStr = new Date().toISOString().split('T')[0];
  if (_mealsTab === 'today') {
    const todayMeals = mealLogs.filter(m => m.logged_at && m.logged_at.startsWith(todayStr));
    const list = document.getElementById('meal-list');
    list.innerHTML = '';
    if (!todayMeals.length) { list.innerHTML = '<div class="empty-state">rien encore — log ton premier repas 🎀</div>'; _syncMochi(); return; }
    todayMeals.forEach(m => {
      const tag = m.healthy === true ? '<span class="healthy-tag yes">healthy</span>' : m.healthy === false ? '<span class="healthy-tag no">not healthy</span>' : '';
      const row = _swipeRow(
        `<div class="item-name">${m.meal_type} ${tag}</div>
         <div class="item-meta"><span>${m.note || ''}</span><span style="margin-left:auto">${new Date(m.logged_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span></div>`,
        () => _editMeal(m),
        async () => { await Meals.remove(m.id); mealLogs = mealLogs.filter(l => l.id !== m.id); renderMeals(); }
      );
      list.appendChild(row);
    });
    _initSwipe(list);
  } else {
    const histEl = document.getElementById('meal-history-list');
    histEl.innerHTML = '';
    if (!mealLogs.length) { histEl.innerHTML = '<div class="empty-state">aucun historique 🎀</div>'; _syncMochi(); return; }
    const groups = {};
    mealLogs.forEach(m => { const d = (m.logged_at || '').split('T')[0]; if (!groups[d]) groups[d] = []; groups[d].push(m); });
    Object.keys(groups).sort((a,b) => b.localeCompare(a)).forEach(date => {
      const label = document.createElement('div');
      label.className = 'date-group-label';
      label.textContent = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'long'});
      histEl.appendChild(label);
      const subList = document.createElement('div');
      subList.className = 'item-list';
      subList.style.marginBottom = '8px';
      groups[date].forEach(m => {
        const tag = m.healthy === true ? '<span class="healthy-tag yes">healthy</span>' : m.healthy === false ? '<span class="healthy-tag no">not healthy</span>' : '';
        const row = _swipeRow(
          `<div class="item-name">${m.meal_type} ${tag}</div>
           <div class="item-meta"><span>${m.note || ''}</span><span style="margin-left:auto">${new Date(m.logged_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span></div>`,
          () => _editMeal(m),
          async () => { await Meals.remove(m.id); mealLogs = mealLogs.filter(l => l.id !== m.id); renderMeals(); }
        );
        subList.appendChild(row);
      });
      _initSwipe(subList);
      histEl.appendChild(subList);
    });
  }
  _syncMochi();
}

function _editMeal(m) {
  mealEditId = m.id;
  document.getElementById('modal-meal-title').textContent = 'Modifier repas';
  document.getElementById('meal-type').value = m.meal_type;
  document.getElementById('meal-note').value = m.note || '';
  _mealHealthy = m.healthy;
  document.getElementById('healthy-yes').classList.toggle('active-yes', m.healthy === true);
  document.getElementById('healthy-no').classList.toggle('active-no',  m.healthy === false);
  openModal('modal-meal');
}

// RENDER: MOODS
function renderMoods() {
  const list = document.getElementById('mood-list');
  list.innerHTML = '';
  if (!moodLogs.length) { list.innerHTML = '<div class="empty-state">aucun log mood 🎀</div>'; return; }
  moodLogs.forEach(m => {
    const row = _swipeRow(
      `<div style="display:flex;align-items:center;gap:14px">
         <span style="font-size:30px;font-weight:200;color:var(--pink-deep)">${m.score}</span>
         <div><div class="item-name">${m.note || '—'}</div>
         <div class="item-meta">${new Date(m.logged_at).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}</div></div>
       </div>`,
      () => {
        moodEditId = m.id;
        $slider.value = m.score;
        document.getElementById('mood-note').value = m.note || '';
        _updateSliderTrack();
        $slider.parentElement.parentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      async () => { await MoodDB.remove(m.id); moodLogs = moodLogs.filter(l => l.id !== m.id); renderMoods(); }
    );
    list.appendChild(row);
  });
  _initSwipe(list);
  _syncMochi();
}

// RENDER: FINANCES
function renderFinances() {
  const sold      = ppItems.filter(i => i.status === 'Vendu');
  const ppBenefit = sold.reduce((s, i) => s + ((i.sell_price || 0) - (i.buy_price || 0)), 0);
  const expTotal  = expenseLogs.reduce((s, e) => s + (e.amount || 0), 0);
  const balance   = ppBenefit - expTotal;
  document.getElementById('fin-pp-benefit').textContent = `${ppBenefit.toFixed(2)}€`;
  document.getElementById('fin-expenses').textContent   = `${expTotal.toFixed(2)}€`;
  const balEl = document.getElementById('fin-balance');
  balEl.textContent = `${balance.toFixed(2)}€`;
  balEl.style.color = balance >= 0 ? 'var(--pink-deep)' : '#e57373';

  const mirror = document.getElementById('pp-mirror-list');
  if (!sold.length) {
    mirror.innerHTML = '<div class="empty-state">aucune vente encore 🎀</div>';
  } else {
    mirror.innerHTML = sold.map(item => {
      const m = item.sell_price && item.buy_price ? Math.round(((item.sell_price - item.buy_price) / item.buy_price) * 100) : null;
      return `<div class="item-card"><div class="item-name">${item.name}</div>
        <div class="item-meta"><span>Achat: ${item.buy_price}€</span><span>Vente: ${item.sell_price}€</span>
        ${m !== null ? `<span class="margin-tag">+${m}%</span>` : ''}
        <span style="margin-left:auto">+${((item.sell_price||0)-(item.buy_price||0)).toFixed(2)}€</span></div></div>`;
    }).join('');
  }
  renderExpenses();
}

function renderExpenses() {
  const list = document.getElementById('expense-list');
  list.innerHTML = '';
  if (!expenseLogs.length) { list.innerHTML = '<div class="empty-state">aucune dépense ce mois 🎀</div>'; return; }
  expenseLogs.forEach(e => {
    const row = _swipeRow(
      `<div class="item-name">${e.category} — ${e.amount}€</div>
       <div class="item-meta"><span>${e.note || ''}</span><span style="margin-left:auto">${new Date(e.date + 'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span></div>`,
      () => _editExpense(e),
      async () => { await Expenses.remove(e.id); expenseLogs = expenseLogs.filter(l => l.id !== e.id); renderFinances(); _syncMochi(); }
    );
    list.appendChild(row);
  });
  _initSwipe(list);
}

function _editExpense(e) {
  expenseEditId = e.id;
  document.getElementById('modal-expense-title').textContent = 'Modifier dépense';
  document.getElementById('exp-amount').value   = e.amount;
  document.getElementById('exp-category').value = e.category;
  document.getElementById('exp-note').value     = e.note || '';
  openModal('modal-expense');
}

// MOOD SLIDER
const $slider  = document.getElementById('mood-slider');
const $display = document.getElementById('mood-display');
function _updateSliderTrack() {
  const pct = ($slider.value - 1) / 9 * 100;
  $slider.style.background = `linear-gradient(90deg, var(--pink-deep) ${pct}%, rgba(232,115,154,0.2) ${pct}%)`;
  $display.textContent = $slider.value;
}
$slider.addEventListener('input', _updateSliderTrack);

// MODALS
const openModal  = id => document.getElementById(id).classList.add('open');
const closeModal = id => document.getElementById(id).classList.remove('open');
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
});

// TAB BINDINGS
_bindTabs('body-tabs', tab => {
  document.getElementById('tab-poids').style.display   = tab === 'poids'   ? '' : 'none';
  document.getElementById('tab-mesures').style.display = tab === 'mesures' ? '' : 'none';
  document.getElementById('openLogWeight').style.display   = tab === 'poids'   ? '' : 'none';
  document.getElementById('openAddMeasure').style.display  = tab === 'mesures' ? '' : 'none';
  if (tab === 'mesures') renderMeasures();
});

_bindTabs('rituel-tabs', tab => {
  document.getElementById('tab-matin').style.display = tab === 'matin' ? '' : 'none';
  document.getElementById('tab-soir').style.display  = tab === 'soir'  ? '' : 'none';
});

_bindTabs('meals-tabs', tab => {
  _mealsTab = tab;
  document.getElementById('tab-meals-today').style.display      = tab === 'today'      ? '' : 'none';
  document.getElementById('tab-meals-historique').style.display = tab === 'historique' ? '' : 'none';
  renderMeals();
});

_bindTabs('finances-tabs', tab => {
  document.getElementById('tab-depenses').style.display  = tab === 'depenses'  ? '' : 'none';
  document.getElementById('tab-pp-mirror').style.display = tab === 'pp-mirror' ? '' : 'none';
});

// HEALTHY TOGGLE
document.getElementById('healthy-yes').addEventListener('click', () => {
  _mealHealthy = true;
  document.getElementById('healthy-yes').classList.add('active-yes');
  document.getElementById('healthy-no').classList.remove('active-no');
});
document.getElementById('healthy-no').addEventListener('click', () => {
  _mealHealthy = false;
  document.getElementById('healthy-no').classList.add('active-no');
  document.getElementById('healthy-yes').classList.remove('active-yes');
});

// WEIGHT
document.getElementById('openLogWeight').addEventListener('click', () => {
  weightEditId = null;
  document.getElementById('modal-weight-title').textContent = 'Log poids';
  document.getElementById('weight-val').value = '';
  document.getElementById('weight-goal-inp').value = '';
  openModal('modal-weight');
});
document.getElementById('cancelWeight').addEventListener('click', () => { weightEditId = null; closeModal('modal-weight'); });
document.getElementById('saveWeight').addEventListener('click', async () => {
  const w = parseFloat(document.getElementById('weight-val').value);
  const g = parseFloat(document.getElementById('weight-goal-inp').value) || null;
  if (!w) return;
  if (weightEditId) {
    const patch = { weight: w, goal_weight: g };
    await Body.update(weightEditId, patch);
    const idx = weightLogs.findIndex(l => l.id === weightEditId);
    if (idx !== -1) weightLogs[idx] = { ...weightLogs[idx], ...patch };
    weightEditId = null;
  } else {
    const prev  = weightLogs[0] || null;
    const saved = await Body.add({ weight: w, goal_weight: g, logged_at: new Date().toISOString() });
    if (saved) {
      weightLogs.unshift(saved[0]);
      if (typeof mochiReact === 'function') mochiReact('weight', { current: w, prev });
    }
  }
  renderBody(); closeModal('modal-weight');
});

// MEALS
document.getElementById('openAddMeal').addEventListener('click', () => {
  mealEditId = null; _mealHealthy = null;
  document.getElementById('modal-meal-title').textContent = 'Log repas';
  document.getElementById('meal-note').value = '';
  document.getElementById('meal-type').value = 'Petit déj';
  document.getElementById('healthy-yes').classList.remove('active-yes');
  document.getElementById('healthy-no').classList.remove('active-no');
  openModal('modal-meal');
});
document.getElementById('cancelMeal').addEventListener('click', () => { mealEditId = null; closeModal('modal-meal'); });
document.getElementById('saveMealBtn').addEventListener('click', async () => {
  const type = document.getElementById('meal-type').value;
  const note = document.getElementById('meal-note').value.trim() || null;
  if (mealEditId) {
    const patch = { meal_type: type, note, healthy: _mealHealthy };
    await Meals.update(mealEditId, patch);
    const idx = mealLogs.findIndex(l => l.id === mealEditId);
    if (idx !== -1) mealLogs[idx] = { ...mealLogs[idx], ...patch };
    mealEditId = null;
  } else {
    const saved = await Meals.add({ meal_type: type, note, healthy: _mealHealthy, logged_at: new Date().toISOString() });
    if (saved) {
      mealLogs.unshift(saved[0]);
      if (typeof mochiReact === 'function') mochiReact('meal', { type, note, healthy: _mealHealthy });
    }
  }
  renderMeals(); closeModal('modal-meal');
  document.getElementById('meal-note').value = '';
  document.getElementById('healthy-yes').classList.remove('active-yes');
  document.getElementById('healthy-no').classList.remove('active-no');
  _mealHealthy = null;
});

// PINK POISON
document.getElementById('openAddItem').addEventListener('click', () => {
  ppEditId = null;
  document.getElementById('modal-item-title').textContent = 'Nouvel article';
  ['item-name','item-buy','item-sell'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('item-status').value = 'En stock';
  openModal('modal-item');
});
document.getElementById('cancelItem').addEventListener('click', () => { ppEditId = null; closeModal('modal-item'); });
document.getElementById('saveItem').addEventListener('click', async () => {
  const name   = document.getElementById('item-name').value.trim();
  const buy    = parseFloat(document.getElementById('item-buy').value);
  const sell   = parseFloat(document.getElementById('item-sell').value) || null;
  const status = document.getElementById('item-status').value;
  if (!name || !buy) return;
  if (ppEditId !== null) {
    const wasNotSold = ppItems.find(i => i.id === ppEditId)?.status !== 'Vendu';
    const patch = { name, buy_price: buy, sell_price: sell, status };
    await PP.update(ppEditId, patch);
    const idx = ppItems.findIndex(i => i.id === ppEditId);
    if (idx !== -1) ppItems[idx] = { ...ppItems[idx], ...patch };
    if (status === 'Vendu' && wasNotSold) {
      if (typeof mochiReact === 'function') mochiReact('pp_sold', { name, buy, sell });
      if (typeof mochiTriggerCheer === 'function') mochiTriggerCheer();
    }
    ppEditId = null;
  } else {
    const saved = await PP.add({ name, buy_price: buy, sell_price: sell, status });
    if (saved) {
      ppItems.unshift(saved[0]);
      if (status === 'Vendu') {
        if (typeof mochiReact === 'function') mochiReact('pp_sold', { name, buy, sell });
        if (typeof mochiTriggerCheer === 'function') mochiTriggerCheer();
      }
    }
  }
  renderPP(); closeModal('modal-item');
  ['item-name','item-buy','item-sell'].forEach(id => { document.getElementById(id).value = ''; });
});

// MEASUREMENTS
document.getElementById('openAddMeasure').addEventListener('click', () => {
  measureEditId = null;
  document.getElementById('modal-measure-title').textContent = 'Nouvelles mesures';
  ['m-poitrine','m-taille','m-hanches','m-bras-g','m-bras-d','m-cuisse-g','m-cuisse-d'].forEach(id => { document.getElementById(id).value = ''; });
  openModal('modal-measure');
});
document.getElementById('cancelMeasure').addEventListener('click', () => { measureEditId = null; closeModal('modal-measure'); });
document.getElementById('saveMeasure').addEventListener('click', async () => {
  const _v = id => { const v = parseFloat(document.getElementById(id).value); return isNaN(v) ? null : v; };
  const data = {
    poitrine: _v('m-poitrine'), taille: _v('m-taille'), hanches: _v('m-hanches'),
    bras_g: _v('m-bras-g'), bras_d: _v('m-bras-d'), cuisse_g: _v('m-cuisse-g'), cuisse_d: _v('m-cuisse-d')
  };
  if (Object.values(data).every(v => v === null)) return;
  if (measureEditId) {
    await Measurements.update(measureEditId, data);
    const idx = measureLogs.findIndex(l => l.id === measureEditId);
    if (idx !== -1) measureLogs[idx] = { ...measureLogs[idx], ...data };
    measureEditId = null;
  } else {
    const saved = await Measurements.add({ ...data, logged_at: new Date().toISOString() });
    if (saved) measureLogs.unshift(saved[0]);
  }
  renderMeasures(); closeModal('modal-measure');
});

// EXPENSES
document.getElementById('openAddExpense').addEventListener('click', () => {
  expenseEditId = null;
  document.getElementById('modal-expense-title').textContent = 'Nouvelle dépense';
  document.getElementById('exp-amount').value   = '';
  document.getElementById('exp-category').value = 'Vinted achats';
  document.getElementById('exp-note').value     = '';
  openModal('modal-expense');
});
document.getElementById('cancelExpense').addEventListener('click', () => { expenseEditId = null; closeModal('modal-expense'); });
document.getElementById('saveExpense').addEventListener('click', async () => {
  const amount   = parseFloat(document.getElementById('exp-amount').value);
  const category = document.getElementById('exp-category').value;
  const note     = document.getElementById('exp-note').value.trim() || null;
  if (!amount) return;
  const today = new Date().toISOString().split('T')[0];
  if (expenseEditId) {
    const patch = { amount, category, note };
    await Expenses.update(expenseEditId, patch);
    const idx = expenseLogs.findIndex(l => l.id === expenseEditId);
    if (idx !== -1) expenseLogs[idx] = { ...expenseLogs[idx], ...patch };
    expenseEditId = null;
  } else {
    const saved = await Expenses.add({ amount, category, note, date: today });
    if (saved) {
      expenseLogs.unshift(saved[0]);
      if (typeof mochiReact === 'function') mochiReact('expense', { amount, category });
    }
  }
  renderFinances(); _syncMochi(); closeModal('modal-expense');
  document.getElementById('exp-amount').value = '';
  document.getElementById('exp-note').value   = '';
});

// MOOD
document.getElementById('saveMoodBtn').addEventListener('click', async () => {
  const score = parseInt($slider.value, 10);
  const note  = document.getElementById('mood-note').value.trim() || null;
  if (moodEditId) {
    const patch = { score, note };
    await MoodDB.update(moodEditId, patch);
    const idx = moodLogs.findIndex(l => l.id === moodEditId);
    if (idx !== -1) moodLogs[idx] = { ...moodLogs[idx], ...patch };
    moodEditId = null;
  } else {
    const prevMoods = moodLogs.slice(0, 7);
    const saved = await MoodDB.add({ score, note, logged_at: new Date().toISOString() });
    if (saved) {
      moodLogs.unshift(saved[0]);
      if (typeof mochiReact === 'function') mochiReact('mood', { score, note, prevMoods });
    }
  }
  renderMoods();
  document.getElementById('mood-note').value = '';
});

// INIT
async function init() {
  applyGradient();
  _setGreetingDate();
  _updateSliderTrack();

  const [items, logs, meals, moods, measures, expenses] = await Promise.all([
    PP.getAll(), Body.getLogs(), Meals.getAll(), MoodDB.getRecent(),
    Measurements.getAll(), Expenses.getThisMonth()
  ]);
  ppItems     = items    || [];
  weightLogs  = logs     || [];
  mealLogs    = meals    || [];
  moodLogs    = moods    || [];
  measureLogs = measures || [];
  expenseLogs = expenses || [];

  renderPP(); renderBody(); renderMeals(); renderSkincare(); renderMoods(); renderFinances();
  _syncMochi();

  setTimeout(() => { if (typeof mochiDailyCheckin === 'function') mochiDailyCheckin(); }, 1500);
  setInterval(applyGradient, 30 * 60 * 1000);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

init();

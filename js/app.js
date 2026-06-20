// ── ANTHROPIC API KEY ───────────────────────────────────────────────────
const ANTHROPIC_KEY = 'YOUR_ANTHROPIC_API_KEY';

// ── PRE-SAVED INGREDIENTS ───────────────────────────────────────────────
const INGREDIENTS = [
  'Riz', 'Poulet', 'Oeufs', 'Avocat', 'Epinards', 'Tomates',
  'Concombre', 'Feta', 'Saumon', 'Patate douce', 'Lentilles',
  'Fromage blanc', 'Banane', 'Flocons d\'avoine', 'Amandes'
];

// ── STATE ───────────────────────────────────────────────────────────
let ppItems = [];
let ppFilter = 'all';
let chatHistory = [];
let weightLogs = [];
let mealLogs = [];
let selectedIngredients = [];

// ── GREETING ──────────────────────────────────────────────────────
function setGreeting() {
  const h = new Date().getHours();
  const greetEl = document.getElementById('greeting');
  if (h < 12) greetEl.textContent = 'good morning';
  else if (h < 18) greetEl.textContent = 'good afternoon';
  else greetEl.textContent = 'good evening';
}

// ── TABS ──────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// ── PINK POISON ─────────────────────────────────────────────────────
function renderPP() {
  const list = document.getElementById('pp-list');
  const filtered = ppFilter === 'all' ? ppItems : ppItems.filter(i => i.status === ppFilter);

  if (!filtered.length) {
    list.innerHTML = '<div class="empty">Aucun article pour l\'instant.</div>';
  } else {
    list.innerHTML = filtered.map(item => {
      const margin = item.sell_price && item.buy_price
        ? Math.round(((item.sell_price - item.buy_price) / item.buy_price) * 100)
        : null;
      const badgeClass = item.status === 'Vendu' ? 'vendu' : item.status === 'Annulé' ? 'annule' : '';
      return `
        <div class="item-card">
          <div class="item-name">${item.name}</div>
          <div class="item-meta">
            <span>Achat: ${item.buy_price}€</span>
            ${item.sell_price ? `<span>Vente: ${item.sell_price}€</span>` : ''}
            ${margin !== null ? `<span class="margin-tag">+${margin}%</span>` : ''}
            <span class="badge ${badgeClass}">${item.status}</span>
          </div>
        </div>`;
    }).join('');
  }

  const sold = ppItems.filter(i => i.status === 'Vendu');
  const inStock = ppItems.filter(i => i.status === 'En stock');
  const revenue = sold.reduce((acc, i) => acc + ((i.sell_price || 0) - (i.buy_price || 0)), 0);
  const stockVal = inStock.reduce((acc, i) => acc + (i.sell_price || i.buy_price || 0), 0);
  const avgMargin = sold.length
    ? Math.round(sold.reduce((acc, i) => acc + (((i.sell_price - i.buy_price) / i.buy_price) * 100), 0) / sold.length)
    : 0;

  document.getElementById('pp-revenue').textContent = `${revenue.toFixed(2)}€`;
  document.getElementById('pp-stock-val').textContent = `${stockVal.toFixed(2)}€`;
  document.getElementById('pp-margin').textContent = `${avgMargin}%`;
  document.getElementById('home-revenue').textContent = `${revenue.toFixed(2)}€`;
}

document.querySelectorAll('.filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    ppFilter = btn.dataset.filter;
    renderPP();
  });
});

document.getElementById('openAddItem').addEventListener('click', () => {
  document.getElementById('modal-item').classList.add('open');
});
document.getElementById('cancelItem').addEventListener('click', () => {
  document.getElementById('modal-item').classList.remove('open');
});
document.getElementById('saveItem').addEventListener('click', async () => {
  const name = document.getElementById('item-name').value.trim();
  const buy = parseFloat(document.getElementById('item-buy').value);
  const sell = parseFloat(document.getElementById('item-sell').value) || null;
  const status = document.getElementById('item-status').value;
  if (!name || !buy) return;

  const saved = await PP.add({ name, buy_price: buy, sell_price: sell, status });
  if (saved) {
    ppItems.unshift(saved[0]);
    renderPP();
    document.getElementById('modal-item').classList.remove('open');
    document.getElementById('item-name').value = '';
    document.getElementById('item-buy').value = '';
    document.getElementById('item-sell').value = '';
  }
});

// ── BODY TRACKING ───────────────────────────────────────────────────
function renderBody() {
  const log = document.getElementById('weight-log');
  if (!weightLogs.length) {
    log.innerHTML = '<div class="empty">Aucun log pour l\'instant.</div>';
    return;
  }
  log.innerHTML = weightLogs.map(w => `
    <div class="item-card">
      <div class="item-name">${w.weight}kg</div>
      <div class="item-meta">${new Date(w.logged_at).toLocaleDateString('fr-FR')}</div>
    </div>`).join('');

  const latest = weightLogs[0];
  const goal = latest?.goal_weight;
  const start = weightLogs[weightLogs.length - 1]?.weight;
  const current = latest?.weight;

  document.getElementById('ba-current').textContent = `${current}kg`;
  document.getElementById('ba-goal').textContent = goal ? `${goal}kg` : '—kg';
  document.getElementById('home-weight').textContent = `${current}kg`;

  if (start && goal && current) {
    const total = Math.abs(start - goal);
    const done = Math.abs(start - current);
    const pct = Math.min(100, Math.round((done / total) * 100));
    document.getElementById('body-progress').style.width = `${pct}%`;
  }
}

document.getElementById('openLogWeight').addEventListener('click', () => {
  document.getElementById('modal-weight').classList.add('open');
});
document.getElementById('cancelWeight').addEventListener('click', () => {
  document.getElementById('modal-weight').classList.remove('open');
});
document.getElementById('saveWeight').addEventListener('click', async () => {
  const w = parseFloat(document.getElementById('weight-val').value);
  const g = parseFloat(document.getElementById('weight-goal').value) || null;
  if (!w) return;
  const saved = await Body.add({ weight: w, goal_weight: g, logged_at: new Date().toISOString() });
  if (saved) {
    weightLogs.unshift(saved[0]);
    renderBody();
    document.getElementById('modal-weight').classList.remove('open');
    document.getElementById('weight-val').value = '';
    document.getElementById('weight-goal').value = '';
  }
});

// ── MEALS ───────────────────────────────────────────────────────────
function buildIngredientSelector() {
  const wrap = document.getElementById('ingredient-select');
  wrap.innerHTML = INGREDIENTS.map(i => `
    <button class="ingr-chip" data-ingr="${i}">${i}</button>`).join('');
  wrap.querySelectorAll('.ingr-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      const i = chip.dataset.ingr;
      if (selectedIngredients.includes(i)) {
        selectedIngredients = selectedIngredients.filter(x => x !== i);
      } else {
        selectedIngredients.push(i);
      }
    });
  });
}

function renderMeals() {
  const list = document.getElementById('meal-list');
  if (!mealLogs.length) {
    list.innerHTML = '<div class="empty">Aucun repas pour l\'instant.</div>';
    document.getElementById('home-meals').textContent = '—';
    return;
  }
  list.innerHTML = mealLogs.map(m => `
    <div class="item-card">
      <div class="item-name">${m.meal_type}</div>
      <div class="item-meta">${m.ingredients?.join(', ') || '—'}</div>
      <div class="item-meta">${new Date(m.logged_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>`).join('');
  document.getElementById('home-meals').textContent = `${mealLogs.length}`;
}

document.getElementById('openAddMeal').addEventListener('click', () => {
  buildIngredientSelector();
  selectedIngredients = [];
  document.getElementById('modal-meal').classList.add('open');
});
document.getElementById('cancelMeal').addEventListener('click', () => {
  document.getElementById('modal-meal').classList.remove('open');
});
document.getElementById('saveMeal').addEventListener('click', async () => {
  const type = document.getElementById('meal-type').value;
  const custom = document.getElementById('meal-custom').value.trim();
  const all = [...selectedIngredients, ...(custom ? [custom] : [])];
  const saved = await Meals.add({
    meal_type: type,
    ingredients: all,
    logged_at: new Date().toISOString()
  });
  if (saved) {
    mealLogs.unshift(saved[0]);
    renderMeals();
    document.getElementById('modal-meal').classList.remove('open');
    document.getElementById('meal-custom').value = '';
  }
});

// ── SKINCARE ──────────────────────────────────────────────────────
function renderSkincare() {
  const done = Skincare.getToday();
  document.getElementById('home-skincare').textContent = `${done.length}/5`;

  document.querySelectorAll('#skincare-full input[type=checkbox]').forEach(cb => {
    cb.checked = done.includes(cb.dataset.step);
    cb.addEventListener('change', () => {
      const current = Skincare.getToday();
      const step = cb.dataset.step;
      const updated = cb.checked
        ? [...new Set([...current, step])]
        : current.filter(s => s !== step);
      Skincare.save(updated);
      document.getElementById('home-skincare').textContent = `${updated.length}/5`;
    });
  });

  const steps = ['Oil Cleanser', 'Toner', 'Vitamin C Serum', 'Moisturizer', 'SPF 50+'];
  document.getElementById('skincare-home').innerHTML = steps.map(s => `
    <label class="check-item">
      <input type="checkbox" ${done.includes(s) ? 'checked' : ''} disabled />
      <span>${s}</span>
    </label>`).join('');
}

// ── RITUEL DATE ───────────────────────────────────────────────────
function setRituelDate() {
  const d = new Date();
  document.getElementById('rituel-date').textContent = d.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
}

// ── MOCHI CHAT ──────────────────────────────────────────────────────
const mochiTrigger = document.getElementById('mochiTrigger');
const chatOverlay = document.getElementById('chatOverlay');
const chatClose = document.getElementById('chatClose');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatMessages = document.getElementById('chatMessages');

mochiTrigger.addEventListener('click', () => chatOverlay.classList.add('open'));
chatClose.addEventListener('click', () => chatOverlay.classList.remove('open'));

function appendMsg(text, role) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function buildSystemPrompt() {
  const sold = ppItems.filter(i => i.status === 'Vendu');
  const revenue = sold.reduce((acc, i) => acc + ((i.sell_price || 0) - (i.buy_price || 0)), 0);
  const todaySkincare = Skincare.getToday();
  const latestWeight = weightLogs[0]?.weight;

  return `Tu es Mochi, l'assistante personnelle de Fati. Tu es douce, directe, un peu complice. Tu connais ses projets et tu l'aides à piloter sa vie.

Contexte actuel :
- Pink Poison (Vinted) : ${ppItems.length} articles, ${revenue.toFixed(2)}€ de bénéfice réel
- Skincare aujourd'hui : ${todaySkincare.length}/5 étapes faites
- Poids actuel : ${latestWeight ? latestWeight + 'kg' : 'non renseigné'}
- Repas aujourd'hui : ${mealLogs.length} enregistrés
- Projets actifs : Uracono, Innanna, Pink Poison, cette app

Réponds en français. Sois concise et utile. Tu peux aussi l'aider à réfléchir à ses projets, ses articles Vinted, ses objectifs.`;
}

async function sendToMochi(userText) {
  chatHistory.push({ role: 'user', content: userText });

  const loading = appendMsg('…', 'loading');

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1000,
        system: buildSystemPrompt(),
        messages: chatHistory
      })
    });

    const data = await res.json();
    const reply = data.content?.[0]?.text || '…';
    chatHistory.push({ role: 'assistant', content: reply });

    loading.remove();
    appendMsg(reply, 'ai');
  } catch (e) {
    loading.textContent = 'Erreur de connexion.';
  }
}

chatSend.addEventListener('click', () => {
  const txt = chatInput.value.trim();
  if (!txt) return;
  appendMsg(txt, 'user');
  chatInput.value = '';
  sendToMochi(txt);
});

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') chatSend.click();
});

// ── SERVICE WORKER ───────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ── INIT ───────────────────────────────────────────────────────────
async function init() {
  setGreeting();
  setRituelDate();

  const [items, logs, meals] = await Promise.all([
    PP.getAll(),
    Body.getLogs(),
    Meals.getAll()
  ]);

  ppItems = items || [];
  weightLogs = logs || [];
  mealLogs = meals || [];

  renderPP();
  renderBody();
  renderMeals();
  renderSkincare();
}

init();

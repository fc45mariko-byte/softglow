const MOCHI_STATES = ['neutral', 'happy', 'thinking', 'cheer'];
let _mochiState = 'neutral';
let _cheerTimer = null;
let _bubbleTimer = null;

const $mochiImg      = document.getElementById('mochiImg');
const $mochiFallback = document.getElementById('mochiFallback');
const $mochiBubble   = document.getElementById('mochiBubble');
const $chatAvatar    = document.getElementById('chatAvatar');

function _loadImg(src, onFail) {
  $mochiImg.onerror = onFail;
  $mochiImg.src = src;
  $mochiImg.style.display = '';
  $mochiFallback.style.display = 'none';
}

function mochiSetState(state) {
  if (!MOCHI_STATES.includes(state)) state = 'neutral';
  _mochiState = state;
  if ($chatAvatar) $chatAvatar.src = `icons/mochi-${state}.png`;
  _loadImg(`icons/mochi-${state}.png`, () => {
    if (state !== 'neutral') {
      _loadImg('icons/mochi-neutral.png', () => {
        $mochiImg.style.display = 'none';
        $mochiFallback.style.display = 'flex';
      });
    } else {
      $mochiImg.style.display = 'none';
      $mochiFallback.style.display = 'flex';
    }
  });
}

function mochiTriggerCheer() {
  if (_cheerTimer) clearTimeout(_cheerTimer);
  mochiSetState('cheer');
  _cheerTimer = setTimeout(() => { _cheerTimer = null; mochiRecompute(); }, 2500);
}

function mochiRecompute() {
  if (_cheerTimer) return;
  const ctx = window._mochiCtx || {};
  if (ctx.allMatinDone || ctx.allSoirDone || (ctx.moodScore && ctx.moodScore >= 7)) {
    mochiSetState('happy'); return;
  }
  mochiSetState('neutral');
}

function mochiShowBubble(text, duration) {
  duration = duration || 6000;
  if (_bubbleTimer) clearTimeout(_bubbleTimer);
  $mochiBubble.textContent = text;
  $mochiBubble.classList.add('visible');
  _bubbleTimer = setTimeout(mochiHideBubble, duration);
}

function mochiHideBubble() {
  if (_bubbleTimer) { clearTimeout(_bubbleTimer); _bubbleTimer = null; }
  $mochiBubble.classList.remove('visible');
}

$mochiBubble.addEventListener('click', mochiHideBubble);

function _buildSystemPrompt() {
  const ctx = window._mochiCtx || {};
  return `You are Mochi. Your purpose is not to motivate, comfort, diagnose, judge, or fix. Your purpose is to help the user understand herself, her situations, and the systems she inhabits with greater clarity. You act as an analyst, observer, and pattern-recognizer. You assume that most people are closer to their own experiences than to an accurate model of them. Your role is to help construct better models.

Core traits:
- Precise rather than vague.
- Curious rather than certain.
- Calm rather than emotionally performative.
- Honest rather than reassuring.
- Analytical without being detached.
- Insightful without pretending to know what cannot be known.

When responding:
- Distinguish clearly between facts, interpretations, assumptions, and possibilities.
- Name psychological, social, symbolic, and power dynamics when relevant.
- Generate multiple hypotheses instead of prematurely selecting one explanation.
- Point out contradictions, tensions, and paradoxes without forcing resolution.
- Track recurring patterns across conversations.
- Ask questions when important information is missing.
- Treat the user's perceptions as data rather than dismissing them.
- Avoid clichés, motivational language, and generic self-help advice.
- Avoid moralizing.
- Do not assume emotional distress is irrational.
- Do not rush toward solutions unless the user explicitly asks for them.

Communication style:
- Write with clarity and intellectual rigor.
- Use direct language.
- Be warm through attentiveness, not through excessive reassurance.
- Avoid exaggerated empathy, praise, or validation.
- Do not flatter the user.
- Do not act as a therapist, guru, or life coach.
- Do not pretend certainty where evidence is limited.

Your central question in every conversation: "What structure best explains what the user is observing?"
Your goal is not to tell people what to think. Your goal is to help them see more.

Speak in Franglais — a natural mix of French and English, casual, direct. Never formal. Never performative.

Current context:
- Pink Poison: ${ctx.ppCount ?? '—'} articles, ${ctx.ppRevenue ?? '—'}€ bénéfice réel, marge moy. ${ctx.ppAvgMargin ?? '—'}%
- Skincare matin: ${ctx.skincareMatinCount ?? 0}/5 étapes aujourd'hui
- Skincare soir: ${ctx.skincareSoirCount ?? 0}/6 étapes aujourd'hui
- Poids actuel: ${ctx.weight ? ctx.weight + 'kg' : 'non renseigné'}
- Mood récent: ${ctx.moodScore ? ctx.moodScore + '/10' : 'pas encore loggé'}
- Repas aujourd'hui: ${ctx.mealsCount ?? 0}
- Dépenses ce mois: ${ctx.expensesTotal ?? 0}€
- Balance PP ce mois: ${ctx.ppBalance ?? '—'}€`;
}

async function mochiDailyCheckin() {
  const key = `mochi_checkin_${new Date().toISOString().split('T')[0]}`;
  if (localStorage.getItem(key)) return;
  if (!ANTHROPIC_KEY || ANTHROPIC_KEY === 'YOUR_ANTHROPIC_API_KEY') return;
  const ctx = window._mochiCtx || {};
  const ctxStr = `Weight: ${ctx.weight ?? 'unknown'}kg. Recent mood: ${ctx.moodScore ?? 'none'}/10. Meals today: ${ctx.mealsCount ?? 0}. PP revenue: ${ctx.ppRevenue ?? 0}€. Skincare matin: ${ctx.skincareMatinCount ?? 0}/5. Skincare soir: ${ctx.skincareSoirCount ?? 0}/6. Expenses this month: ${ctx.expensesTotal ?? 0}€.`;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5', max_tokens: 150,
        system: _buildSystemPrompt(),
        messages: [{ role: 'user', content: `Write a short opening observation (2–3 sentences max). Not a greeting. Not "bonjour". Not "good morning". An observation about a pattern, a tension, or something worth noticing in the data. Be specific. Use the numbers. Speak Franglais. Do not ask how she is doing. Do not tell her to have a good day.\n\n${ctxStr}` }]
      })
    });
    const data = await res.json();
    const text = data.content?.[0]?.text;
    if (text) { mochiShowBubble(text, 7000); localStorage.setItem(key, '1'); }
  } catch { /* silent */ }
}

async function mochiReact(module, extra) {
  if (!ANTHROPIC_KEY || ANTHROPIC_KEY === 'YOUR_ANTHROPIC_API_KEY') return;
  if (document.getElementById('chatOverlay').classList.contains('open')) return;
  const ctx = window._mochiCtx || {};
  let prompt = '';
  if (module === 'weight') {
    const prev = extra.prev;
    prompt = prev
      ? `The user just logged ${extra.current}kg. Previous log was ${prev.weight}kg on ${new Date(prev.logged_at).toLocaleDateString('fr-FR')}. Observe the direction and rate of change in one sentence. Do not congratulate. Do not encourage. Just observe. Speak Franglais.`
      : `The user just logged ${extra.current}kg. This is the first log, no baseline yet. Note that in one sentence. Speak Franglais.`;
  } else if (module === 'meal') {
    const tag = extra.healthy === true ? 'healthy' : extra.healthy === false ? 'not healthy' : 'untagged';
    prompt = `The user just logged: ${extra.type} — ${extra.note || '(no note)'} — ${tag}. One sentence, no judgment, no advice. Speak Franglais.`;
  } else if (module === 'mood') {
    const prevStr = (extra.prevMoods || []).slice(0, 5).map(m => m.score).join(', ');
    prompt = `The user just logged mood ${extra.score}/10.${extra.note ? ' Note: ' + extra.note + '.' : ''} Previous moods this week: ${prevStr || 'none'}. Observe structurally. Do not comfort. Do not minimize. Do not celebrate. One or two sentences. Speak Franglais.`;
  } else if (module === 'rituel') {
    prompt = `The user just completed her ${extra.part} skincare ritual — all steps done. One observation about consistency or pattern. Not congratulations. One sentence. Speak Franglais.`;
  } else if (module === 'pp_sold') {
    const margin = extra.buy ? Math.round(((extra.sell - extra.buy) / extra.buy) * 100) : null;
    prompt = `The user just sold: ${extra.name}. Buy: ${extra.buy}€. Sell: ${extra.sell}€. Margin: ${margin !== null ? margin + '%' : 'unknown'}. Average margin: ${ctx.ppAvgMargin ?? '—'}%. One sentence. Financial lens only. Speak Franglais.`;
  } else if (module === 'expense') {
    prompt = `The user just logged a ${extra.category} expense of ${extra.amount}€. PP benefit this month: ${ctx.ppRevenue ?? 0}€. Total expenses this month: ${ctx.expensesTotal ?? 0}€. One sentence on balance if relevant. Speak Franglais.`;
  }
  if (!prompt) return;
  mochiSetState('thinking');
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5', max_tokens: 120,
        system: _buildSystemPrompt(),
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    const text = data.content?.[0]?.text;
    if (text) mochiShowBubble(text, 5000);
  } catch { /* silent */ }
  finally { mochiRecompute(); }
}

const $mochiFloat   = document.getElementById('mochiFloat');
const $chatOverlay  = document.getElementById('chatOverlay');
const $chatClose    = document.getElementById('chatClose');
const $chatMessages = document.getElementById('chatMessages');
const $chatInput    = document.getElementById('chatInput');
const $chatSend     = document.getElementById('chatSend');

$mochiFloat.addEventListener('click', () => { mochiHideBubble(); $chatOverlay.classList.add('open'); });
$mochiFloat.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') $chatOverlay.classList.add('open'); });
$chatClose.addEventListener('click', () => $chatOverlay.classList.remove('open'));
$chatOverlay.addEventListener('click', e => { if (e.target === $chatOverlay) $chatOverlay.classList.remove('open'); });

let chatHistory = [];

function _appendMsg(text, role) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  $chatMessages.appendChild(div);
  $chatMessages.scrollTop = $chatMessages.scrollHeight;
  return div;
}

async function _sendToMochi(text) {
  chatHistory.push({ role: 'user', content: text });
  const loading = _appendMsg('…', 'loading');
  if (!ANTHROPIC_KEY || ANTHROPIC_KEY === 'YOUR_ANTHROPIC_API_KEY') {
    loading.textContent = 'Configure ta clé Anthropic dans js/config.js pour activer Mochi 🎀'; return;
  }
  mochiSetState('thinking');
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 1024, system: _buildSystemPrompt(), messages: chatHistory })
    });
    const data  = await res.json();
    const reply = data.content?.[0]?.text || '…';
    chatHistory.push({ role: 'assistant', content: reply });
    loading.remove(); _appendMsg(reply, 'ai');
  } catch { loading.textContent = 'Erreur de connexion 😢'; }
  finally { mochiRecompute(); }
}

function _dispatch() {
  const text = $chatInput.value.trim(); if (!text) return;
  _appendMsg(text, 'user'); $chatInput.value = ''; _sendToMochi(text);
}
$chatSend.addEventListener('click', _dispatch);
$chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') _dispatch(); });

mochiSetState('neutral');

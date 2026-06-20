// MOCHI: floating character, reactive expressions, chat

const MOCHI_STATES = ['neutral', 'happy', 'sleepy', 'cheer'];
let _mochiState = 'neutral';
let _cheerTimer = null;

const $mochiImg      = document.getElementById('mochiImg');
const $mochiFallback = document.getElementById('mochiFallback');

// Image loading with two-level fallback: state → neutral → emoji
function _loadImg(src, onFail) {
  $mochiImg.onerror = onFail;
  $mochiImg.src = src;
  $mochiImg.style.display = '';
  $mochiFallback.style.display = 'none';
}

function mochiSetState(state) {
  if (!MOCHI_STATES.includes(state)) state = 'neutral';
  _mochiState = state;
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
  _cheerTimer = setTimeout(() => {
    _cheerTimer = null;
    mochiRecompute();
  }, 2000);
}

function mochiRecompute() {
  if (_cheerTimer) return; // don't interrupt active cheer
  const ctx = window._mochiCtx || {};
  const h   = new Date().getHours();
  if (h >= 21 || h < 5)                                     { mochiSetState('sleepy');  return; }
  if (ctx.allRituelDone || (ctx.moodScore && ctx.moodScore >= 7)) { mochiSetState('happy');   return; }
  mochiSetState('neutral');
}

// FLOAT BUTTON
const $mochiFloat   = document.getElementById('mochiFloat');
const $chatOverlay  = document.getElementById('chatOverlay');
const $chatClose    = document.getElementById('chatClose');
const $chatMessages = document.getElementById('chatMessages');
const $chatInput    = document.getElementById('chatInput');
const $chatSend     = document.getElementById('chatSend');

$mochiFloat.addEventListener('click', () => $chatOverlay.classList.add('open'));
$mochiFloat.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') $chatOverlay.classList.add('open');
});
$chatClose.addEventListener('click', () => $chatOverlay.classList.remove('open'));
$chatOverlay.addEventListener('click', e => {
  if (e.target === $chatOverlay) $chatOverlay.classList.remove('open');
});

// CHAT
let chatHistory = [];

function _appendMsg(text, role) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  $chatMessages.appendChild(div);
  $chatMessages.scrollTop = $chatMessages.scrollHeight;
  return div;
}

function _buildSystemPrompt() {
  const ctx = window._mochiCtx || {};
  return `Tu es Mochi, l'assistante personnelle de Fati. Tu parles Franglais — melange naturel de francais et d'anglais, casual, warm, complice. Tu connais ses projets.

Contexte actuel:
- Pink Poison (Vinted): ${ctx.ppCount ?? '—'} articles, ${ctx.ppRevenue ?? '—'}€ benefice reel
- Skincare aujourd'hui: ${ctx.skincareCount ?? 0}/5 etapes faites
- Poids actuel: ${ctx.weight ? ctx.weight + 'kg' : 'non renseigne'}
- Mood: ${ctx.moodScore ? ctx.moodScore + '/10' : 'pas encore logge'}
- Repas aujourd'hui: ${ctx.mealsCount ?? 0}
- Projets actifs: Uracono, Innanna, Pink Poison, cette app

Sois concise, directe. Parle comme une amie. Max 3-4 phrases sauf si on demande plus.`;
}

async function _sendToMochi(text) {
  chatHistory.push({ role: 'user', content: text });
  const loading = _appendMsg('…', 'loading');

  if (!ANTHROPIC_KEY || ANTHROPIC_KEY === 'YOUR_ANTHROPIC_API_KEY') {
    loading.textContent = 'Configure ta cle Anthropic dans js/config.js pour activer Mochi 🎀';
    return;
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':                              'application/json',
        'x-api-key':                                 ANTHROPIC_KEY,
        'anthropic-version':                         '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5',
        max_tokens: 1024,
        system:     _buildSystemPrompt(),
        messages:   chatHistory
      })
    });
    const data  = await res.json();
    const reply = data.content?.[0]?.text || '…';
    chatHistory.push({ role: 'assistant', content: reply });
    loading.remove();
    _appendMsg(reply, 'ai');
  } catch (e) {
    loading.textContent = 'Erreur de connexion 😢';
  }
}

function _dispatch() {
  const text = $chatInput.value.trim();
  if (!text) return;
  _appendMsg(text, 'user');
  $chatInput.value = '';
  _sendToMochi(text);
}

$chatSend.addEventListener('click', _dispatch);
$chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') _dispatch(); });

// Boot
mochiSetState('neutral');

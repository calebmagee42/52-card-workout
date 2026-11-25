// The Deck: game logic and screens.
'use strict';

const $app = document.getElementById('app');
const STORE = 'the-deck-v1';

// ---------- storage ----------
function load() {
  try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
}
let db = load();
db.baselines = db.baselines || [];   // [{date, push, sit, bridge, curl, lb, squat}]
db.history = db.history || [];       // finished games
function save() { try { localStorage.setItem(STORE, JSON.stringify(db)); } catch (e) {} }

const currentBaseline = () => db.baselines[db.baselines.length - 1] || null;
const daysSince = iso => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

// ---------- card math ----------
const R = (base, pct) => Math.max(1, Math.ceil(base * pct / 100 - 1e-9));
const ALL_IDS = [...Object.keys(SUITS).flatMap(s => SUITS[s].cards.map((_, i) => s + (i + 1))), 'W1', 'W2'];

function cardInfo(id) {
  if (id[0] === 'W') return { id, wild: true, name: WILDCARDS[id].name, value: WILDCARDS[id].points };
  const suit = id[0], n = +id.slice(1);
  const [name, pct, type] = SUITS[suit].cards[n - 1];
  return { id, suit, n, name, pct, type, value: n };
}

// Returns {main, sub} text for a card, with reps doubled when asked.
function cardLabel(id, b, doubled) {
  const c = cardInfo(id);
  const x = doubled ? 2 : 1;
  if (id === 'W2') return { main: 'NEXT CARD ×2', sub: 'Split into 2 sets if you need to' };
  if (id === 'W1') {
    const avg = (b.push + b.sit + b.bridge + b.curl + b.squat) / 5;
    return { main: `${R(avg, 30) * x} BURPEES`, sub: `Step-back burpees · 30% of your average baseline` };
  }
  const base = b[SUITS[c.suit].base];
  const r = R(base, c.pct) * x;
  const lb = b.lb;
  const main = {
    reps: `${r} REPS`, side: `${r} / SIDE`, steps: `${r} STEPS EACH WAY`, sec: `${r} SEC`,
    secSide: `${r} SEC / SIDE`, hand: `${r} / HAND`, arm: `${r} / ARM`, leg: `${r} / LEG`,
    wt: `${r} @ ${lb} LB`, armWt: `${r} / ARM @ ${lb} LB`, secWt: `${r} SEC @ ${lb} LB`,
  }[c.type];
  return { main, sub: `${SUITS[c.suit].name} · Difficulty ${c.n} / 10${doubled ? ' · Doubled' : ''}` };
}

// ---------- game ----------
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function newGame() {
  return {
    started: new Date().toISOString(),
    baseline: currentBaseline(),
    deck: shuffle(ALL_IDS.slice()),  // deck[0] is the card showing once flipped
    flipped: false,
    points: 0,
    done: [],          // ids completed
    seq: [],           // suit cards completed since the last skip (for streaks and runs)
    skipChain: [],     // values of cards skipped in a row
    chainPenalty: 0,   // penalty already taken for the current chain
    skips: 0,
    doubleNext: false, // a Double Down was just completed
    repeat: null,      // Double Down was the last card: repeat this card
    lastDone: null,
    log: [],           // {id, pts, note}
  };
}

function suitBonus(seq) {
  const tail = (test) => { let k = 1; for (let i = seq.length - 1; i > 0 && test(seq[i - 1], seq[i]); i--) k++; return k; };
  const sameSuit = (a, b) => a.suit === b.suit;
  const upOne = (a, b) => b.n === a.n + 1;
  const sr = tail((a, b) => sameSuit(a, b) && upOne(a, b));
  if (sr >= 3) return { pts: 10 * (sr - 2), note: `Suit Run of ${sr}` };
  const s = tail(sameSuit), r = tail(upOne);
  let pts = 0; const notes = [];
  if (s >= 3) { pts += 5 * (s - 2); notes.push(`Suit streak of ${s}`); }
  if (r >= 3) { pts += 5 * (r - 2); notes.push(`Run of ${r}`); }
  return { pts, note: notes.join(' + ') };
}

function completeCurrent(g) {
  const toasts = [];
  if (g.repeat) {
    // Repeat set after a last-card Double Down: scores the card's points again.
    const c = cardInfo(g.repeat);
    g.points += c.value; g.log.push({ id: 'W2', pts: c.value, note: `Repeat set of ${c.name}` });
    toasts.push(`+${c.value} repeat set`);
    g.deck.shift(); g.repeat = null;
    checkClean(g, toasts);
    return toasts;
  }
  const id = g.deck.shift();
  const c = cardInfo(id);
  g.skipChain = []; g.chainPenalty = 0;
  if (id === 'W2') {
    g.done.push(id); g.log.push({ id, pts: 0, note: 'Next card doubled' });
    if (g.deck.length === 0 && g.lastDone) {
      // Last card of the deck: do another set of the card just done.
      g.repeat = g.lastDone; g.deck.unshift('REPEAT');
    } else {
      g.doubleNext = true;
    }
    checkClean(g, toasts);
    return toasts;
  }
  const doubled = g.doubleNext; g.doubleNext = false;
  const pts = c.value * (doubled ? 2 : 1);
  g.points += pts; g.done.push(id); g.lastDone = id;
  g.log.push({ id, pts, note: doubled ? 'Doubled' : '' });
  if (doubled) toasts.push(`Doubled! +${pts}`);
  if (!c.wild) {
    g.seq.push(c);
    const b = suitBonus(g.seq);
    if (b.pts) { g.points += b.pts; g.log.push({ id, pts: b.pts, note: b.note, bonus: true }); toasts.push(`${b.note}! +${b.pts}`); }
  }
  checkClean(g, toasts);
  return toasts;
}

function checkClean(g, toasts) {
  if (!g.cleanGiven && g.skips === 0 && g.done.length === 52 && !g.repeat) {
    g.cleanGiven = true; g.points += 50;
    g.log.push({ id: 'CLEAN', pts: 50, note: 'Clean deck', bonus: true }); toasts.push('Clean deck! +50');
  }
}

function skipCurrent(g) {
  const toasts = [];
  if (g.repeat) { g.deck.shift(); g.repeat = null; g.log.push({ id: 'W2', pts: 0, note: 'Repeat set skipped' }); return toasts; }
  const id = g.deck.shift();
  const c = cardInfo(id);
  g.deck.push(id);            // card goes to the bottom
  g.skips++; g.seq = []; g.doubleNext = false;
  g.skipChain.push(c.value);
  let pts = 0, note = 'Skipped, moved to bottom';
  if (g.skipChain.length >= 2) {
    const total = Math.ceil(g.skipChain.reduce((a, v) => a + v, 0) / 2);
    pts = -(total - g.chainPenalty); g.chainPenalty = total;
    note = `Skip chain of ${g.skipChain.length}`;
    g.log.push({ id, pts, note, bonus: true });
    g.points += pts;
    return toasts.concat(pts ? [`Skip chain ${pts}`] : []);
  }
  g.points += pts;
  g.log.push({ id, pts, note });
  return toasts;
}

function finishGame(g) {
  const result = {
    date: new Date().toISOString(), points: g.points,
    cards: g.done.length,
    skips: g.skips, log: g.log,
  };
  db.history.unshift(result);
  db.history = db.history.slice(0, 50);
  db.game = null; db.lastResult = result; save();
  return result;
}

// ---------- ui helpers ----------
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
function toast(lines) {
  if (!lines.length) return;
  const t = document.getElementById('toast');
  t.textContent = lines.join('  ·  '); t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2600);
}
function fmtDate(iso) { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
const suitDots = () => Object.values(SUITS).map(s => `<span style="color:${s.color}">${s.symbol}</span>`).join('');

// ---------- screens ----------
function render() {
  const view = render.view || (db.game ? 'play' : 'home');
  ({ home, baseline, setup, play, results, history })[view]();
  window.scrollTo(0, 0);
}
function go(view) { render.view = view; render(); }

function home() {
  const b = currentBaseline();
  const due = b && daysSince(b.date) >= 7;
  $app.innerHTML = `
    <header class="top"><div class="suits">${suitDots()}</div><h1>The Deck</h1><p class="muted">52 cards. Flip, do the card, move on.</p></header>
    ${!b ? `<section class="panel"><h2>Start with your baseline test</h2>
        <p>Do one max set with good form of each benchmark move. Every card's reps come from these numbers.</p>
        <button class="btn primary" data-go="baseline">Take baseline test</button></section>`
      : `<section class="panel">
        ${due ? `<p class="banner">It's been ${daysSince(b.date)} days. Time for your weekly baseline test.</p>` : ''}
        <h2>Your baseline <span class="muted small">from ${fmtDate(b.date)}</span></h2>
        <ul class="baselines">
          ${BASELINE_FIELDS.filter(f => f.key !== 'lb').map(f => `<li><span style="color:${SUITS[f.suit].color}">${SUITS[f.suit].symbol}</span> ${f.label}<b>${b[f.key]}${f.key === 'curl' ? ` @ ${b.lb} lb` : ''}</b></li>`).join('')}
        </ul>
        <button class="btn primary big" data-go="setup">Set-up Workout</button>
        <button class="btn ghost" data-go="baseline">${due ? 'Take this week\'s baseline test' : 'Retest baseline'}</button>
      </section>`}
    ${db.history.length ? `<section class="panel"><h2>Recent workouts</h2>
        ${db.history.slice(0, 3).map(h => `<div class="row"><span>${fmtDate(h.date)}</span><span>${h.cards} / 52 cards</span><b>${h.points} pts</b></div>`).join('')}
        <button class="btn ghost" data-go="history">See all</button></section>` : ''}
  `;
}

function baseline() {
  const b = currentBaseline() || {};
  $app.innerHTML = `
    <header class="top"><button class="back" data-go="home">‹ Back</button><h1>Baseline test</h1>
      <p class="muted">One max set of each move, in good form. Stop at the first rep where form breaks. The last clean rep is your number.</p></header>
    <form class="panel" id="bf">
      ${BASELINE_FIELDS.map(f => `<label class="field"><span><i style="color:${SUITS[f.suit].color}">${SUITS[f.suit].symbol}</i> ${f.label}</span>
        <input type="number" inputmode="numeric" min="1" max="999" name="${f.key}" value="${b[f.key] || ''}" required>
        <small class="muted">${f.hint}</small></label>`).join('')}
      <button class="btn primary big" type="submit">Save baseline</button>
    </form>`;
  document.getElementById('bf').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const nb = { date: new Date().toISOString() };
    for (const f of BASELINE_FIELDS) nb[f.key] = Math.max(1, Math.round(+fd.get(f.key)));
    db.baselines.push(nb); save();
    toast(['Baseline saved']); go('home');
  };
}

function setup() {
  db.game = newGame(); save();
  $app.innerHTML = `
    <header class="top"><div class="suits">${suitDots()}</div><h1>Deck shuffled</h1>
      <p class="muted">52 cards are ready, with this week's reps filled in. Finish the whole deck for a +50 clean deck bonus, or stop whenever you like.</p></header>
    <section class="panel center">
      <div class="deckback"><span>${suitDots()}</span></div>
      <button class="btn primary big" id="begin">Begin</button>
      <button class="btn ghost" id="cancel">Cancel</button>
    </section>`;
  document.getElementById('begin').onclick = () => { db.game.flipped = true; save(); go('play'); };
  document.getElementById('cancel').onclick = () => { db.game = null; save(); go('home'); };
}

function play() {
  const g = db.game;
  if (!g) return go('home');
  if (!g.flipped) { g.flipped = true; save(); }
  if (g.deck.length === 0) { finishGame(g); return go('results'); }
  const isRepeat = !!g.repeat;
  const id = isRepeat ? g.repeat : g.deck[0];
  const c = cardInfo(id);
  const lab = cardLabel(id, g.baseline, g.doubleNext && !isRepeat);
  const left = g.deck.length - 1;
  $app.innerHTML = `
    <div class="scorebar"><div><b>${g.points}</b><small>points</small></div><div><b>${g.done.length}</b><small>of 52 done</small></div><div><b>${left}</b><small>left</small></div></div>
    ${g.doubleNext && !isRepeat ? `<p class="banner dd">Double Down! Reps and points are doubled on this card.</p>` : ''}
    ${isRepeat ? `<p class="banner dd">Double Down was the last card. Do another set of this card.</p>` : ''}
    <div class="card flip">
      <img src="cards/${id}.webp" alt="${esc(c.name)}">
      <div class="pill${lab.main.length > 14 ? ' long' : ''}">${esc(lab.main)}</div>
      <div class="sub">${esc(lab.sub)}</div>
    </div>
    <div class="actions">
      <button class="btn primary big" id="done">${id === 'W2' && !isRepeat ? 'Got it, flip next card' : 'Done, next card'}</button>
      <div class="two">
        <button class="btn ghost" id="skip">Skip</button>
        <button class="btn ghost" id="end">End workout</button>
      </div>
    </div>
    <div id="modal"></div>`;
  document.getElementById('done').onclick = () => { const t = completeCurrent(g); save(); toast(t); render(); };
  document.getElementById('skip').onclick = () => { const t = skipCurrent(g); save(); toast(t.length ? t : ['Skipped. Card moved to the bottom']); render(); };
  document.getElementById('end').onclick = () => {
    document.getElementById('modal').innerHTML = `<div class="modal"><div class="sheet">
      <h2>End workout?</h2><p>Did you finish the card that's showing (${esc(c.name)})?</p>
      <button class="btn primary" id="yes">Yes, count it</button>
      <button class="btn" id="no">No, don't count it</button>
      <button class="btn ghost" id="keep">Keep playing</button></div></div>`;
    document.getElementById('yes').onclick = () => { completeCurrent(g); finishGame(g); go('results'); };
    document.getElementById('no').onclick = () => { finishGame(g); go('results'); };
    document.getElementById('keep').onclick = () => { document.getElementById('modal').innerHTML = ''; };
  };
}

function results() {
  const r = db.lastResult;
  if (!r) return go('home');
  const bonus = r.log.filter(l => l.bonus && l.pts !== 0);
  $app.innerHTML = `
    <header class="top"><div class="suits">${suitDots()}</div><h1>Workout complete</h1></header>
    <section class="panel center">
      <div class="bigscore"><b>${r.points}</b><span>points</span></div>
      <div class="bigscore small"><b>${r.cards} / 52</b><span>cards completed</span></div>
      ${r.skips ? `<p class="muted">${r.skips} skip${r.skips > 1 ? 's' : ''}</p>` : ''}
    </section>
    ${bonus.length ? `<section class="panel"><h2>Bonuses and penalties</h2>${bonus.map(l => `<div class="row"><span>${esc(l.note)}</span><b>${l.pts > 0 ? '+' : ''}${l.pts}</b></div>`).join('')}</section>` : ''}
    <section class="panel"><button class="btn primary big" data-go="home">Home</button></section>`;
  render.view = null;
}

function history() {
  $app.innerHTML = `
    <header class="top"><button class="back" data-go="home">‹ Back</button><h1>Workout history</h1></header>
    <section class="panel">${db.history.map(h => `<div class="row"><span>${fmtDate(h.date)}</span><span>${h.cards} / 52 cards</span><b>${h.points} pts</b></div>`).join('') || '<p class="muted">No workouts yet.</p>'}</section>
    <section class="panel"><h2>Baseline history</h2>${db.baselines.slice().reverse().map(b => `<div class="row"><span>${fmtDate(b.date)}</span><span class="small">${b.push} · ${b.sit} · ${b.bridge} · ${b.curl}@${b.lb} · ${b.squat}</span></div>`).join('')}
    <p class="muted small">Push-ups · sit-ups · bridges · curls@lb · squats</p></section>`;
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-go]');
  if (t) go(t.dataset.go);
});

// Preload all card images so play works offline once opened.
ALL_IDS.forEach(id => { const i = new Image(); i.src = `cards/${id}.webp`; });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
render();

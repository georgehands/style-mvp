const STORE_KEY = 'style-proto-v1';
const screen = document.getElementById('screen');
const tabs = document.getElementById('tabs');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let state = load() || { profile: null, picks: {}, owned: [], saved: [], lane: null };
let draft = null;
let step = 0;

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch { return null; }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* storage unavailable, run in memory */ }
}
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

// ---------- Onboarding ----------

const STEPS = [
  {
    title: 'Let’s start with your build.',
    sub: 'This decides proportions, not just sizes.',
    render: () => `
      <label class="field">Height
        <input type="text" id="height" placeholder="e.g. 5'9 or 175cm" value="${esc(draft.height)}">
      </label>
      <div class="field-label small">Pick any that sound like you</div>
      <div class="chips" data-multi="flags">${BUILDS.map((b) => chip(b, draft.flags.includes(b))).join('')}</div>`,
    valid: () => draft.height.trim() && draft.flags.length,
  },
  {
    title: 'Your sizes.',
    sub: 'Rough is fine. Skip anything you don’t know.',
    render: () => `
      <div class="row">
        <label class="field">Chest<input type="text" id="chest" placeholder="e.g. 40in / M" value="${esc(draft.chest)}"></label>
        <label class="field">Waist<input type="text" id="waist" placeholder="e.g. 32in" value="${esc(draft.waist)}"></label>
      </div>
      <div class="row">
        <label class="field">Inside leg<input type="text" id="inseam" placeholder="e.g. 30in" value="${esc(draft.inseam)}"></label>
        <label class="field">Shoe<input type="text" id="shoe" placeholder="e.g. UK 9" value="${esc(draft.shoe)}"></label>
      </div>
      <label class="field">Photo (optional)
        <input type="text" disabled placeholder="Photo upload comes with the real build">
      </label>`,
    valid: () => true,
  },
  {
    title: 'What can you spend?',
    sub: 'Every piece we pick has to fit inside this. No surprises.',
    render: () => `
      <div class="small">Budget for one full outfit</div>
      <div class="budget-val" id="budgetVal">£${draft.budget}</div>
      <input type="range" id="budget" min="50" max="400" step="10" value="${draft.budget}">
      <h2>Roughly what do you spend on clothes a month?</h2>
      <div class="chips" data-single="monthly">${['Under £50', '£50–150', '£150–300', '£300+'].map((m) => chip(m, draft.monthly === m)).join('')}</div>`,
    valid: () => draft.monthly,
  },
  {
    title: 'Which looks do you want?',
    sub: 'Pick as many as you like. You can switch between them any time.',
    render: () => `<div class="chips" data-multi="lanes">${LANES.map((l) => chip(l, draft.lanes.includes(l))).join('')}</div>`,
    valid: () => draft.lanes.length,
  },
  {
    title: 'What are you actually trying to change?',
    sub: 'Be honest. This shapes every choice.',
    render: () => `
      <div class="chips" data-multi="goalTags">${['Back on dating apps', 'Feel invisible', 'New job', 'Look put together', 'Just want a change'].map((g) => chip(g, draft.goalTags.includes(g))).join('')}</div>
      <label class="field">In your own words (optional)
        <textarea id="goal" rows="3" placeholder="e.g. I scroll and everyone looks sorted, I just feel average">${esc(draft.goal)}</textarea>
      </label>`,
    valid: () => draft.goalTags.length || draft.goal.trim(),
  },
];

function chip(label, on) {
  return `<button type="button" class="chip${on ? ' on' : ''}" data-val="${esc(label)}">${esc(label)}</button>`;
}

function startOnboarding() {
  draft = state.profile
    ? structuredClone(state.profile)
    : { height: '', flags: [], chest: '', waist: '', inseam: '', shoe: '', budget: 150, monthly: '', lanes: [], goalTags: [], goal: '' };
  step = 0;
  tabs.classList.add('hidden');
  renderStep();
}

function renderStep() {
  const s = STEPS[step];
  screen.innerHTML = `
    <div class="progress">${STEPS.map((_, i) => `<span class="${i <= step ? 'on' : ''}"></span>`).join('')}</div>
    <h1>${s.title}</h1>
    <p class="sub">${s.sub}</p>
    ${s.render()}
    <div class="actions">
      ${step > 0 ? '<button class="btn ghost" id="back">Back</button>' : ''}
      <button class="btn" id="next">${step === STEPS.length - 1 ? 'Build my look' : 'Next'}</button>
    </div>`;

  screen.querySelectorAll('input[type=text], textarea').forEach((el) => {
    el.addEventListener('input', () => { draft[el.id] = el.value; refreshNext(); });
  });
  const range = screen.querySelector('#budget');
  if (range) range.addEventListener('input', () => { draft.budget = +range.value; screen.querySelector('#budgetVal').textContent = `£${draft.budget}`; });

  screen.querySelectorAll('.chips').forEach((group) => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      const val = btn.dataset.val;
      if (group.dataset.multi) {
        const arr = draft[group.dataset.multi];
        const i = arr.indexOf(val);
        i >= 0 ? arr.splice(i, 1) : arr.push(val);
        btn.classList.toggle('on');
      } else {
        draft[group.dataset.single] = val;
        group.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === btn));
      }
      refreshNext();
    });
  });

  const back = screen.querySelector('#back');
  if (back) back.onclick = () => { step--; renderStep(); };
  screen.querySelector('#next').onclick = () => {
    if (step < STEPS.length - 1) { step++; renderStep(); return; }
    finishOnboarding();
  };
  refreshNext();
}

function refreshNext() {
  screen.querySelector('#next').disabled = !STEPS[step].valid();
}

function finishOnboarding() {
  state.profile = draft;
  state.picks = {};
  state.lane = draft.lanes[0];
  save();
  screen.innerHTML = `
    <div class="loader">
      <div><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
      <p class="sub" style="margin-top:20px">Reading your build and budget…</p>
    </div>`;
  setTimeout(() => showTab('outfit'), 1400);
}

// ---------- Outfit engine (stand-in for the AI) ----------

function ownedFor(lane, slot) {
  return state.owned.find((o) => o.lane === lane && o.slot === slot);
}

function buildOutfit(lane) {
  const picks = state.picks[lane] || {};
  const budget = state.profile.budget;
  const chosen = {};

  SLOTS.forEach((slot) => {
    const own = ownedFor(lane, slot);
    if (own) { chosen[slot] = { item: own, owned: true }; return; }
    chosen[slot] = { idx: picks[slot] ?? 0, locked: picks[slot] !== undefined };
  });

  // Squeeze into budget by switching unlocked slots to their cheaper option.
  const total = () => SLOTS.reduce((sum, s) => sum + (chosen[s].owned ? 0 : CATALOGUE[lane][s][chosen[s].idx].price), 0);
  let guard = 10;
  while (total() > budget && guard--) {
    let best = null;
    SLOTS.forEach((s) => {
      const c = chosen[s];
      if (c.owned || c.locked) return;
      CATALOGUE[lane][s].forEach((opt, i) => {
        const saving = CATALOGUE[lane][s][c.idx].price - opt.price;
        if (saving > 0 && (!best || saving > best.saving)) best = { s, i, saving };
      });
    });
    if (!best) break;
    chosen[best.s].idx = best.i;
  }

  SLOTS.forEach((s) => {
    if (!chosen[s].owned) chosen[s].item = CATALOGUE[lane][s][chosen[s].idx];
  });
  return { pieces: chosen, total: total() };
}

function avatarSVG(outfit) {
  const p = state.profile;
  const flags = p.flags;
  const inches = parseHeight(p.height);
  const f = Math.min(1.1, Math.max(0.88, inches / 70));
  let sw = 46, ww = 34;
  if (flags.includes('Broad shoulders')) sw += 10;
  if (flags.includes('Athletic')) { sw += 6; ww -= 2; }
  if (flags.includes('Slim')) { sw -= 4; ww -= 3; }
  if (flags.includes('Carrying some weight')) { sw += 4; ww += 10; }

  const col = (s) => outfit.pieces[s].item.hex;
  const base = 250, shoeH = 8, legH = 100 * f, torsoH = 72 * f;
  const legTop = base - shoeH - legH, torsoTop = legTop - torsoH, headR = 14, headCy = torsoTop - 6 - headR;
  const L = 60 - sw / 2, R = 60 + sw / 2, wl = 60 - ww / 2, wr = 60 + ww / 2;

  return `<svg viewBox="0 0 120 260" aria-label="Avatar preview">
    <circle cx="60" cy="${headCy}" r="${headR}" fill="#cfc8bd"/>
    <rect x="${L - 10}" y="${torsoTop + 2}" width="10" height="${torsoH + 8}" rx="5" fill="${col('Layer')}"/>
    <rect x="${R}" y="${torsoTop + 2}" width="10" height="${torsoH + 8}" rx="5" fill="${col('Layer')}"/>
    <circle cx="${L - 5}" cy="${torsoTop + torsoH + 4}" r="3.5" fill="${col('Accessory')}"/>
    <polygon points="${L},${torsoTop} ${R},${torsoTop} ${wr},${legTop} ${wl},${legTop}" fill="${col('Top')}" stroke="rgba(0,0,0,.12)"/>
    <polygon points="${L},${torsoTop} ${L + sw * 0.3},${torsoTop} ${wl + ww * 0.25},${legTop} ${wl},${legTop}" fill="${col('Layer')}"/>
    <polygon points="${R - sw * 0.3},${torsoTop} ${R},${torsoTop} ${wr},${legTop} ${wr - ww * 0.25},${legTop}" fill="${col('Layer')}"/>
    <rect x="${wl}" y="${legTop}" width="${ww / 2 - 1}" height="${legH}" fill="${col('Bottom')}" stroke="rgba(0,0,0,.12)"/>
    <rect x="61" y="${legTop}" width="${ww / 2 - 1}" height="${legH}" fill="${col('Bottom')}" stroke="rgba(0,0,0,.12)"/>
    <rect x="${wl - 3}" y="${base - shoeH}" width="${ww / 2 + 2}" height="${shoeH}" rx="3" fill="${col('Shoes')}" stroke="rgba(0,0,0,.2)"/>
    <rect x="60" y="${base - shoeH}" width="${ww / 2 + 2}" height="${shoeH}" rx="3" fill="${col('Shoes')}" stroke="rgba(0,0,0,.2)"/>
  </svg>`;
}

function parseHeight(h) {
  const s = String(h).toLowerCase();
  const cm = s.match(/(\d{3})\s*cm/);
  if (cm) return +cm[1] / 2.54;
  const ft = s.match(/(\d)\s*['’ft]+\s*(\d{1,2})?/);
  if (ft) return +ft[1] * 12 + (+ft[2] || 0);
  return 70;
}

// ---------- Screens ----------

function renderOutfit() {
  const p = state.profile;
  const lane = state.lane;
  const outfit = buildOutfit(lane);
  const over = outfit.total > p.budget;
  const pct = Math.min(100, (outfit.total / p.budget) * 100);
  const ownedCount = SLOTS.filter((s) => outfit.pieces[s].owned).length;

  screen.innerHTML = `
    <div class="lanes">${p.lanes.map((l) => chip(l, l === lane)).join('')}</div>
    <h1>Your ${esc(lane.toLowerCase())} look.</h1>
    <p class="sub">${ownedCount ? `Built around ${ownedCount} piece${ownedCount > 1 ? 's' : ''} you already own.` : 'One outfit. Picked for your build and your budget.'}</p>
    <div class="hero">
      ${avatarSVG(outfit)}
      <div class="summary">
        <div class="small">Total to buy</div>
        <div class="total">£${outfit.total}</div>
        <div class="bar${over ? ' over' : ''}"><span style="width:${pct}%"></span></div>
        <div class="small">${!over ? `Inside your £${p.budget} budget.` : SLOTS.some((s) => outfit.pieces[s].locked)
          ? `£${outfit.total - p.budget} over your £${p.budget}. Swap a piece back or mark something you own.`
          : `This is the cheapest version of this look, £${outfit.total - p.budget} over your £${p.budget}. Mark anything you already own to bring it down.`}</div>
        <div class="note">Avatar is a stand-in for the real try-on.</div>
      </div>
    </div>
    ${SLOTS.map((slot) => pieceCard(slot, outfit.pieces[slot])).join('')}
    <div class="ask">
      <input type="text" disabled placeholder="Ask the stylist: e.g. no boots, something darker">
      <button class="btn" disabled>Send</button>
    </div>
    <p class="note">Free-text changes arrive when the real AI is connected. Prices shown are samples.</p>
    <div class="actions"><button class="btn" id="saveOutfit">Save this outfit</button></div>`;

  screen.querySelector('.lanes').onclick = (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    state.lane = b.dataset.val; save(); renderOutfit();
  };
  screen.querySelectorAll('[data-swap]').forEach((b) => (b.onclick = () => swap(lane, b.dataset.swap)));
  screen.querySelectorAll('[data-own]').forEach((b) => (b.onclick = () => toggleOwn(lane, b.dataset.own, outfit)));
  screen.querySelector('#saveOutfit').onclick = () => {
    state.saved.unshift({
      lane,
      date: new Date().toLocaleDateString('en-GB'),
      total: outfit.total,
      pieces: SLOTS.map((s) => ({ slot: s, name: outfit.pieces[s].item.name, hex: outfit.pieces[s].item.hex })),
    });
    save(); toast('Saved to your wardrobe');
  };
}

function pieceCard(slot, piece) {
  const it = piece.item;
  const notes = state.profile.flags.map((f) => BUILD_NOTES[f]?.[slot]).filter(Boolean);
  return `
    <div class="piece">
      <div class="piece-head">
        <div class="swatch" style="background:${esc(it.hex)}"></div>
        <div class="meta">
          <div class="slot">${slot}</div>
          <div class="name">${esc(it.name)}</div>
          <div class="small">${esc(it.colour)}${it.fit ? ` · ${esc(it.fit)}` : ''}${it.shop ? ` · ${esc(it.shop)}` : ''}</div>
        </div>
        ${piece.owned ? '<div class="price owned">You own this</div>' : `<div class="price">£${it.price}</div>`}
      </div>
      ${it.why ? `<p class="why">${esc(it.why)}</p>` : ''}
      ${notes.map((n) => `<p class="why build">For your build: ${esc(n)}</p>`).join('')}
      <div class="piece-actions">
        ${piece.owned ? '' : `<button data-swap="${slot}">Swap</button>`}
        <button data-own="${slot}" class="${piece.owned ? 'on' : ''}">${piece.owned ? 'Owned ✓' : 'I own something like this'}</button>
      </div>
    </div>`;
}

function swap(lane, slot) {
  const current = buildOutfit(lane).pieces[slot].idx;
  state.picks[lane] = state.picks[lane] || {};
  state.picks[lane][slot] = (current + 1) % CATALOGUE[lane][slot].length;
  save(); renderOutfit();
}

function toggleOwn(lane, slot, outfit) {
  const existing = ownedFor(lane, slot);
  if (existing) {
    state.owned = state.owned.filter((o) => o !== existing);
  } else {
    const it = outfit.pieces[slot].item;
    state.owned.push({ lane, slot, name: it.name, colour: it.colour, hex: it.hex, why: 'Already in your wardrobe, so it stays in.' });
  }
  save(); renderOutfit();
}

function renderWardrobe() {
  screen.innerHTML = `
    <h1>Your wardrobe.</h1>
    <p class="sub">Anything here gets built into your outfits instead of bought again.</p>
    <h2>Pieces you own</h2>
    <div id="ownedList">${state.owned.length ? state.owned.map((o, i) => `
      <div class="list-item">
        <div class="swatch" style="background:${esc(o.hex)}"></div>
        <div class="meta"><div class="name">${esc(o.name)}</div><div class="small">${esc(o.slot)} · ${esc(o.lane)}</div></div>
        <button data-remove="${i}">Remove</button>
      </div>`).join('') : '<div class="empty">Nothing yet. Tap “I own something like this” on any piece, or add one below.</div>'}</div>
    <h2>Add something you own</h2>
    <label class="field">What is it<input type="text" id="addName" placeholder="e.g. Black jeans"></label>
    <div class="row">
      <label class="field">Type<select id="addSlot">${SLOTS.map((s) => `<option>${s}</option>`).join('')}</select></label>
      <label class="field">Goes with<select id="addLane">${state.profile.lanes.map((l) => `<option>${esc(l)}</option>`).join('')}</select></label>
    </div>
    <label class="field">Colour<input type="text" id="addColour" placeholder="e.g. Black"></label>
    <button class="btn" id="addBtn">Add to wardrobe</button>
    <h2>Saved outfits</h2>
    ${state.saved.length ? state.saved.map((o) => `
      <div class="list-item">
        <div style="display:flex;gap:3px">${o.pieces.map((p) => `<div class="swatch" style="width:14px;height:34px;flex-basis:14px;background:${esc(p.hex)}"></div>`).join('')}</div>
        <div class="meta"><div class="name">${esc(o.lane)} look</div><div class="small">${esc(o.date)} · £${o.total}</div></div>
      </div>`).join('') : '<div class="empty">No saved outfits yet.</div>'}`;

  screen.querySelectorAll('[data-remove]').forEach((b) => (b.onclick = () => {
    state.owned.splice(+b.dataset.remove, 1); save(); renderWardrobe();
  }));
  screen.querySelector('#addBtn').onclick = () => {
    const name = screen.querySelector('#addName').value.trim();
    if (!name) return;
    const slot = screen.querySelector('#addSlot').value;
    const lane = screen.querySelector('#addLane').value;
    const colour = screen.querySelector('#addColour').value.trim() || 'Your colour';
    state.owned = state.owned.filter((o) => !(o.lane === lane && o.slot === slot));
    state.owned.push({ lane, slot, name, colour, hex: colourHex(colour), why: 'Already in your wardrobe, so it stays in.' });
    save(); toast('Added. Your outfit will use it.'); renderWardrobe();
  };
}

function colourHex(name) {
  const probe = document.createElement('span');
  probe.style.color = name.toLowerCase().replace(/\s+/g, '');
  return probe.style.color ? probe.style.color : '#b9b3a8';
}

function renderGuide() {
  const flags = state.profile.flags;
  screen.innerHTML = `
    <h1>Dressing your build.</h1>
    <p class="sub">The rules that matter for you, and nothing else.</p>
    ${flags.map((f) => `<h2>${esc(f)}</h2><ul class="tips">${GUIDE[f].map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`).join('')}
    <h2>For everyone</h2>
    <ul class="tips">${GENERAL_GUIDE.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
}

function renderProfile() {
  const p = state.profile;
  const row = (k, v) => `<div class="list-item"><div class="meta"><div class="small">${k}</div><div class="name">${esc(v || '—')}</div></div></div>`;
  screen.innerHTML = `
    <h1>Your profile.</h1>
    <p class="sub">Change anything and your outfits rebuild around it.</p>
    ${row('Height', p.height)}
    ${row('Build', p.flags.join(', '))}
    ${row('Sizes', [p.chest && `Chest ${p.chest}`, p.waist && `Waist ${p.waist}`, p.inseam && `Leg ${p.inseam}`, p.shoe && `Shoe ${p.shoe}`].filter(Boolean).join(' · '))}
    ${row('Outfit budget', `£${p.budget}`)}
    ${row('Monthly spend', p.monthly)}
    ${row('Looks', p.lanes.join(', '))}
    ${row('Goal', [...p.goalTags, p.goal].filter(Boolean).join(' · '))}
    <div class="actions"><button class="btn" id="redo">Edit my answers</button></div>
    <div class="actions"><button class="btn ghost" id="reset" style="flex:1">Start over from scratch</button></div>`;
  screen.querySelector('#redo').onclick = startOnboarding;
  screen.querySelector('#reset').onclick = () => {
    state = { profile: null, picks: {}, owned: [], saved: [], lane: null };
    save(); startOnboarding();
  };
}

const RENDER = { outfit: renderOutfit, wardrobe: renderWardrobe, guide: renderGuide, profile: renderProfile };

function showTab(name) {
  tabs.classList.remove('hidden');
  tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
  if (!state.profile.lanes.includes(state.lane)) state.lane = state.profile.lanes[0];
  RENDER[name]();
  window.scrollTo(0, 0);
}

tabs.onclick = (e) => {
  const b = e.target.closest('button');
  if (b) showTab(b.dataset.tab);
};

state.profile ? showTab('outfit') : startOnboarding();

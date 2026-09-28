const STORE_KEY = 'style-proto-v2';
const screen = document.getElementById('screen');
const tabs = document.getElementById('tabs');
const MONTHLY = { 'Under £50': 40, '£50–150': 100, '£150–300': 225, '£300+': 350 };
const GOALS = ['Back on dating apps', 'Feel invisible', 'New job', 'Look put together', 'Just want a change'];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => `£${Math.round(n).toLocaleString('en-GB')}`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const blank = () => ({ profile: null, picks: {}, ownedIds: [], ownedManual: [], view: { tab: 'home', look: null } });
let state = load() || blank();
let onboarding = false;
let draft = null;
let step = 0;

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    return s && s.view ? s : null;
  } catch { return null; }
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
function chip(label, on) {
  return `<button type="button" class="chip${on ? ' on' : ''}" data-val="${esc(label)}">${esc(label)}</button>`;
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
      <div class="label">Pick any that sound like you</div>
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
    title: 'What’s your wardrobe budget?',
    sub: 'The total you’re happy to spend across every look. We’ll tell you what to buy first.',
    render: () => `
      <div class="budget-card">
        <div class="small">Whole wardrobe</div>
        <div class="budget-val" id="budgetVal">${money(draft.budget)}</div>
        <input type="range" id="budget" min="100" max="1000" step="25" value="${draft.budget}">
        <div class="range-ends"><span>£100</span><span>£1,000</span></div>
      </div>
      <h2 class="q">And what do you usually spend on clothes a month?</h2>
      <p class="small" style="margin:0 0 14px">So we can tell you when you’ll have the rest.</p>
      <div class="chips" data-single="monthly">${Object.keys(MONTHLY).map((m) => chip(m, draft.monthly === m)).join('')}</div>`,
    valid: () => draft.monthly,
  },
  {
    title: 'Which looks do you want?',
    sub: 'Pick as many as you like. Where a piece works in more than one look, you only buy it once.',
    render: () => `
      <div class="look-pick" data-multi="lanes">${LOOK_ORDER.map((l) => `
        <button type="button" class="look-opt${draft.lanes.includes(l) ? ' on' : ''}" data-val="${esc(l)}" style="--tint:${LOOKS[l].tint}">
          <span class="serif">${esc(l)}</span>
          <span class="small">${esc(LOOKS[l].tagline)}</span>
          <span class="tick"></span>
        </button>`).join('')}
      </div>`,
    valid: () => draft.lanes.length,
  },
  {
    title: 'What are you actually trying to change?',
    sub: 'Be honest. This shapes every choice.',
    render: () => `
      <div class="chips" data-multi="goalTags">${GOALS.map((g) => chip(g, draft.goalTags.includes(g))).join('')}</div>
      <label class="field">In your own words (optional)
        <textarea id="goal" rows="3" placeholder="e.g. I scroll and everyone looks sorted, I just feel average">${esc(draft.goal)}</textarea>
      </label>`,
    valid: () => draft.goalTags.length || draft.goal.trim(),
  },
];

function startOnboarding() {
  onboarding = true;
  draft = state.profile
    ? structuredClone(state.profile)
    : { height: '', flags: [], chest: '', waist: '', inseam: '', shoe: '', budget: 300, monthly: '', lanes: [], goalTags: [], goal: '' };
  step = 0;
  tabs.classList.add('hidden');
  renderStep();
}

function renderStep() {
  const s = STEPS[step];
  screen.innerHTML = `
    <div class="onb">
      <div class="progress">${STEPS.map((_, i) => `<span class="${i <= step ? 'on' : ''}"></span>`).join('')}</div>
      <div class="stepcount">Step ${step + 1} of ${STEPS.length}</div>
      <h1 class="serif">${s.title}</h1>
      <p class="sub">${s.sub}</p>
      ${s.render()}
      <div class="actions">
        ${step > 0 ? '<button class="btn ghost" id="back">Back</button>' : ''}
        <button class="btn" id="next">${step === STEPS.length - 1 ? 'Build my wardrobe' : 'Next'}</button>
      </div>
    </div>`;

  screen.querySelectorAll('input[type=text]:not([disabled]), textarea').forEach((el) => {
    el.addEventListener('input', () => { draft[el.id] = el.value; refreshNext(); });
  });
  const range = screen.querySelector('#budget');
  if (range) range.addEventListener('input', () => { draft.budget = +range.value; screen.querySelector('#budgetVal').textContent = money(draft.budget); });

  screen.querySelectorAll('[data-multi], [data-single]').forEach((group) => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-val]');
      if (!btn) return;
      const val = btn.dataset.val;
      if (group.dataset.multi) {
        const arr = draft[group.dataset.multi];
        const i = arr.indexOf(val);
        i >= 0 ? arr.splice(i, 1) : arr.push(val);
        btn.classList.toggle('on');
      } else {
        draft[group.dataset.single] = val;
        group.querySelectorAll('[data-val]').forEach((c) => c.classList.toggle('on', c === btn));
      }
      refreshNext();
    });
  });

  const back = screen.querySelector('#back');
  if (back) back.onclick = () => { step--; renderStep(); };
  screen.querySelector('#next').onclick = () => {
    if (step < STEPS.length - 1) { step++; renderStep(); window.scrollTo(0, 0); return; }
    finishOnboarding();
  };
  refreshNext();
}

function refreshNext() {
  screen.querySelector('#next').disabled = !STEPS[step].valid();
}

function finishOnboarding() {
  onboarding = false;
  state.profile = draft;
  state.view = { tab: 'home', look: null };
  save();
  screen.innerHTML = `
    <div class="loader">
      <div><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
      <p class="sub" style="margin-top:20px">Building your wardrobe around your build and budget…</p>
    </div>`;
  setTimeout(render, 1400);
}

// ---------- Wardrobe engine (stand-in for the AI) ----------

// Keep each look on its signature pieces unless sharing finishes more complete looks within budget.
function plan() {
  const signature = evaluate(false);
  if (!signature.later.length) return signature;
  const shared = evaluate(true);
  return shared.ready.length > signature.ready.length ? shared : signature;
}

function evaluate(share) {
  const p = state.profile;
  const owned = new Set(state.ownedIds);
  const looks = {};
  const usage = {};
  const cost = (ids) => ids.reduce((sum, id) => sum + ITEMS[id].price, 0);

  // Each look starts on its signature pieces (or anything he owns).
  const choice = [];
  p.lanes.forEach((lane) => SLOTS.forEach((slot) => {
    if (state.ownedManual.some((o) => o.slot === slot && o.lanes.includes(lane))) return;
    const opts = LOOKS[lane].options[slot];
    const pick = state.picks[lane]?.[slot];
    const locked = opts.includes(pick);
    choice.push({ lane, slot, locked, id: locked ? pick : opts.find((o) => owned.has(o)) || opts[0] });
  }));

  // Share pieces between looks, biggest saving first, until it fits or nothing more can be shared.
  const total = () => cost([...new Set(choice.map((c) => c.id))].filter((id) => !owned.has(id)));
  for (let guard = 0; share && guard < 30 && total() > p.budget; guard++) {
    let best = null;
    const before = total();
    choice.filter((c) => !c.locked).forEach((c) => {
      LOOKS[c.lane].options[c.slot].forEach((opt) => {
        if (opt === c.id || !(owned.has(opt) || choice.some((o) => o !== c && o.id === opt))) return;
        const was = c.id;
        c.id = opt;
        const saving = before - total();
        c.id = was;
        if (saving > 0 && (!best || saving > best.saving)) best = { c, opt, saving };
      });
    });
    if (!best) break;
    best.c.id = best.opt;
  }

  p.lanes.forEach((lane) => {
    looks[lane] = {};
    SLOTS.forEach((slot) => {
      const manual = state.ownedManual.find((o) => o.slot === slot && o.lanes.includes(lane));
      if (manual) { looks[lane][slot] = { item: manual, owned: true, manual: true }; return; }
      const c = choice.find((x) => x.lane === lane && x.slot === slot);
      (usage[c.id] ||= new Set()).add(lane);
      looks[lane][slot] = { id: c.id, item: ITEMS[c.id], owned: owned.has(c.id), locked: c.locked };
    });
  });

  // Buy order: finish whole looks first, in the order he picked them, then the most-shared pieces.
  const now = new Set();
  let spent = 0;
  p.lanes.forEach((lane) => {
    const need = [...new Set(SLOTS.map((s) => looks[lane][s]).filter((x) => !x.owned && !now.has(x.id)).map((x) => x.id))];
    if (spent + cost(need) <= p.budget) { need.forEach((id) => now.add(id)); spent += cost(need); }
  });
  const later = [];
  Object.keys(usage)
    .filter((id) => !owned.has(id) && !now.has(id))
    .sort((a, b) => usage[b].size - usage[a].size || ITEMS[a].price - ITEMS[b].price)
    .forEach((id) => {
      if (spent + ITEMS[id].price <= p.budget) { now.add(id); spent += ITEMS[id].price; } else later.push(id);
    });

  const remaining = (lane) => cost([...new Set(SLOTS.map((s) => looks[lane][s]).filter((x) => !x.owned && !now.has(x.id)).map((x) => x.id))]);
  return {
    looks,
    usage,
    now,
    later,
    spent,
    laterTotal: cost(later),
    remaining,
    ready: p.lanes.filter((l) => remaining(l) === 0),
    shared: Object.keys(usage).filter((id) => usage[id].size > 1).length,
    pieceCount: Object.keys(usage).length + state.ownedManual.filter((o) => o.lanes.some((l) => p.lanes.includes(l))).length,
  };
}

function parseHeight(h) {
  const s = String(h).toLowerCase();
  const cm = s.match(/(\d{3})\s*cm/);
  if (cm) return +cm[1] / 2.54;
  const ft = s.match(/(\d)\s*['’ft]+\s*(\d{1,2})?/);
  if (ft) return +ft[1] * 12 + (+ft[2] || 0);
  return 70;
}

function avatarSVG(pieces) {
  const flags = state.profile.flags;
  const f = Math.min(1.1, Math.max(0.88, parseHeight(state.profile.height) / 70));
  let sw = 46;
  let ww = 34;
  if (flags.includes('Broad shoulders')) sw += 10;
  if (flags.includes('Athletic')) { sw += 6; ww -= 2; }
  if (flags.includes('Slim')) { sw -= 4; ww -= 3; }
  if (flags.includes('Carrying some weight')) { sw += 4; ww += 10; }

  const col = (s) => esc(pieces[s].item.hex);
  const base = 250, shoeH = 8, legH = 100 * f, torsoH = 72 * f;
  const legTop = base - shoeH - legH;
  const torsoTop = legTop - torsoH;
  const headR = 14;
  const headCy = torsoTop - 6 - headR;
  const L = 60 - sw / 2, R = 60 + sw / 2, wl = 60 - ww / 2, wr = 60 + ww / 2;
  const edge = 'rgba(0,0,0,.14)';

  return `<svg viewBox="0 0 120 260" aria-label="Avatar preview">
    <rect x="55" y="${headCy + headR - 2}" width="10" height="10" fill="#bdb5a8"/>
    <circle cx="60" cy="${headCy}" r="${headR}" fill="#cfc8bd"/>
    <rect x="${L - 10}" y="${torsoTop + 2}" width="10" height="${torsoH + 8}" rx="5" fill="${col('Layer')}" stroke="${edge}"/>
    <rect x="${R}" y="${torsoTop + 2}" width="10" height="${torsoH + 8}" rx="5" fill="${col('Layer')}" stroke="${edge}"/>
    <circle cx="${L - 5}" cy="${torsoTop + torsoH + 4}" r="3.5" fill="${col('Accessory')}"/>
    <polygon points="${L},${torsoTop} ${R},${torsoTop} ${wr},${legTop} ${wl},${legTop}" fill="${col('Top')}" stroke="${edge}"/>
    <polygon points="${L},${torsoTop} ${L + sw * 0.3},${torsoTop} ${wl + ww * 0.25},${legTop} ${wl},${legTop}" fill="${col('Layer')}" stroke="${edge}"/>
    <polygon points="${R - sw * 0.3},${torsoTop} ${R},${torsoTop} ${wr},${legTop} ${wr - ww * 0.25},${legTop}" fill="${col('Layer')}" stroke="${edge}"/>
    <rect x="${wl}" y="${legTop}" width="${ww / 2 - 1}" height="${legH}" fill="${col('Bottom')}" stroke="${edge}"/>
    <rect x="61" y="${legTop}" width="${ww / 2 - 1}" height="${legH}" fill="${col('Bottom')}" stroke="${edge}"/>
    <rect x="${wl - 3}" y="${base - shoeH}" width="${ww / 2 + 2}" height="${shoeH}" rx="3" fill="${col('Shoes')}" stroke="rgba(0,0,0,.25)"/>
    <rect x="60" y="${base - shoeH}" width="${ww / 2 + 2}" height="${shoeH}" rx="3" fill="${col('Shoes')}" stroke="rgba(0,0,0,.25)"/>
  </svg>`;
}

// ---------- Screens ----------

function renderHome() {
  const p = state.profile;
  const pl = plan();
  const unused = LOOK_ORDER.filter((l) => !p.lanes.includes(l));
  const pct = Math.min(100, (pl.spent / p.budget) * 100);
  const readyLine = pl.ready.length
    ? `Your buy-now list finishes <b>${pl.ready.length} of ${p.lanes.length}</b> looks.`
    : 'Your budget doesn’t finish a full look yet, so this starts with the pieces that work hardest.';
  const sharedLine = pl.shared ? ` <b>${plural(pl.shared, 'piece')}</b> ${pl.shared === 1 ? 'works' : 'work'} across more than one look.` : '';

  screen.innerHTML = `
    <header class="top">
      <div class="overline">Your wardrobe</div>
      <h1 class="serif">${plural(p.lanes.length, 'look')}, ${plural(pl.pieceCount, 'piece')}.</h1>
    </header>
    <section class="plan">
      <div class="plan-row">
        <div><div class="k">Budget</div><div class="v">${money(p.budget)}</div></div>
        <div><div class="k">Buy now</div><div class="v">${money(pl.spent)}</div></div>
      </div>
      <div class="bar"><span style="width:${pct}%"></span></div>
      <p>${readyLine}${sharedLine}</p>
      <button class="btn light" data-go="shop">See what to buy first</button>
    </section>
    <h2 class="section">Your looks</h2>
    <div class="grid">${p.lanes.map((l) => tile(l, pl)).join('')}</div>
    ${unused.length ? `<h2 class="section">Add a look</h2>
      <div class="chips">${unused.map((l) => `<button class="chip add" data-add="${esc(l)}">+ ${esc(l)}</button>`).join('')}</div>` : ''}`;
}

function tile(lane, pl) {
  const pieces = pl.looks[lane];
  const left = pl.remaining(lane);
  return `
    <button class="tile" data-look="${esc(lane)}" style="--tint:${LOOKS[lane].tint}">
      <div class="tile-head">
        <span class="tile-name serif">${esc(lane)}</span>
        <span class="pill${left === 0 ? ' ok' : ''}">${left === 0 ? 'Ready' : `+${money(left)}`}</span>
      </div>
      <div class="tile-fig">${avatarSVG(pieces)}</div>
      <div class="tile-tag">${esc(LOOKS[lane].tagline)}</div>
      <div class="strip">${SLOTS.map((s) => `<span style="background:${esc(pieces[s].item.hex)}"></span>`).join('')}</div>
    </button>`;
}

function renderLook(lane) {
  const pl = plan();
  const pieces = pl.looks[lane];
  const left = pl.remaining(lane);
  screen.innerHTML = `
    <section class="look-hero" style="--tint:${LOOKS[lane].tint}">
      <button class="back" data-back>‹ Wardrobe</button>
      <div class="look-hero-body">
        <div class="look-hero-text">
          <div class="overline">Your look</div>
          <h1 class="serif">${esc(lane)}</h1>
          <p>${esc(LOOKS[lane].tagline)}</p>
          <span class="pill${left === 0 ? ' ok' : ''}">${left === 0 ? 'Covered by your buy-now list' : `${money(left)} more to finish`}</span>
        </div>
        <div class="look-fig">${avatarSVG(pieces)}</div>
      </div>
    </section>
    ${SLOTS.map((s) => pieceCard(lane, s, pieces[s], pl)).join('')}
    <div class="ask">
      <input type="text" disabled placeholder="Ask the stylist: no boots, something darker…">
      <button class="btn" disabled>Send</button>
    </div>
    <p class="note">Free-text changes arrive once the real AI is connected. Prices are samples.</p>
    ${state.profile.lanes.length > 1 ? `<button class="btn ghost drop" data-drop="${esc(lane)}">Remove this look</button>` : ''}`;
}

function pieceCard(lane, slot, x, pl) {
  const it = x.item;
  const status = x.owned ? ['owned', 'You own this'] : pl.now.has(x.id) ? ['now', 'Buy now'] : ['later', 'Buy later'];
  const also = x.manual ? [] : [...pl.usage[x.id]].filter((l) => l !== lane);
  const notes = state.profile.flags.map((f) => BUILD_NOTES[f]?.[slot]).filter(Boolean);
  const canSwap = !x.manual && LOOKS[lane].options[slot].length > 1;
  return `
    <article class="piece">
      <div class="piece-head">
        <div class="swatch" style="background:${esc(it.hex)}"></div>
        <div class="meta">
          <div class="slot">${slot}</div>
          <div class="name">${esc(it.name)}</div>
          <div class="small">${[it.colour, it.fit, it.shop].filter(Boolean).map(esc).join(' · ')}</div>
        </div>
        <div class="right">
          ${x.owned ? '' : `<div class="price">${money(it.price)}</div>`}
          <span class="badge ${status[0]}">${status[1]}</span>
        </div>
      </div>
      ${it.why ? `<p class="why">${esc(it.why)}</p>` : ''}
      ${notes.map((n) => `<p class="why build">For your build: ${esc(n)}</p>`).join('')}
      ${also.length ? `<p class="also">Also in ${also.map((l) => `<span class="dot" style="background:${LOOKS[l].tint}"></span>${esc(l)}`).join(', ')}</p>` : ''}
      ${x.manual ? '' : `<div class="piece-actions">
        ${canSwap ? `<button data-swap="${slot}">Swap</button>` : ''}
        <button data-own="${slot}" class="${x.owned ? 'on' : ''}">${x.owned ? 'Owned ✓' : 'I own something like this'}</button>
      </div>`}
    </article>`;
}

function renderShop() {
  const p = state.profile;
  const pl = plan();
  const months = Math.ceil(pl.laterTotal / (MONTHLY[p.monthly] || 100));
  screen.innerHTML = `
    <header class="top">
      <div class="overline">Shopping list</div>
      <h1 class="serif">What to buy, in order.</h1>
      <p class="sub">Everything under “Buy now” fits your ${money(p.budget)}. Whole looks come first, then the pieces that work hardest.</p>
    </header>
    <section class="card">
      <div class="list-head"><span>Buy now</span><span class="v">${money(pl.spent)}</span></div>
      ${pl.now.size ? [...pl.now].map((id) => shopRow(id, pl)).join('') : '<div class="empty">Nothing fits yet. Raise your budget or mark pieces you own.</div>'}
    </section>
    ${pl.later.length ? `
      <section class="card later">
        <div class="list-head"><span>Buy later</span><span class="v">${money(pl.laterTotal)}</span></div>
        <div class="meta-line">About ${plural(months, 'month')} at what you usually spend.</div>
        ${pl.later.map((id) => shopRow(id, pl)).join('')}
      </section>` : '<p class="note">That’s everything. Every look is covered.</p>'}`;
}

function shopRow(id, pl) {
  const it = ITEMS[id];
  return `
    <div class="row-item">
      <div class="swatch" style="background:${esc(it.hex)}"></div>
      <div class="meta">
        <div class="name">${esc(it.name)}</div>
        <div class="small">${esc(it.colour)} · ${esc(it.shop)}</div>
        <div class="uses">${[...pl.usage[id]].map((l) => `<span><span class="dot" style="background:${LOOKS[l].tint}"></span>${esc(l)}</span>`).join('')}</div>
      </div>
      <div class="price">${money(it.price)}</div>
    </div>`;
}

function renderOwned() {
  const p = state.profile;
  const rows = [
    ...state.ownedIds.map((id) => ({ key: `id:${id}`, name: ITEMS[id].name, hex: ITEMS[id].hex, sub: `${ITEMS[id].slot} · ${ITEMS[id].colour}` })),
    ...state.ownedManual.map((o, i) => ({ key: `m:${i}`, name: o.name, hex: o.hex, sub: `${o.slot} · ${o.lanes.join(', ')}` })),
  ];
  screen.innerHTML = `
    <header class="top">
      <div class="overline">Owned</div>
      <h1 class="serif">What you already have.</h1>
      <p class="sub">Anything here gets worked into your looks instead of bought again.</p>
    </header>
    <section class="card">
      ${rows.length ? rows.map((r) => `
        <div class="row-item">
          <div class="swatch" style="background:${esc(r.hex)}"></div>
          <div class="meta"><div class="name">${esc(r.name)}</div><div class="small">${esc(r.sub)}</div></div>
          <button class="link" data-remove="${esc(r.key)}">Remove</button>
        </div>`).join('') : '<div class="empty">Nothing yet. Tap “I own something like this” on any piece, or add one below.</div>'}
    </section>
    <h2 class="section">Add a piece</h2>
    <section class="card pad">
      <label class="field">What is it<input type="text" id="addName" placeholder="e.g. Black jeans"></label>
      <div class="row">
        <label class="field">Type<select id="addSlot">${SLOTS.map((s) => `<option>${s}</option>`).join('')}</select></label>
        <label class="field">Colour<input type="text" id="addColour" placeholder="e.g. Black"></label>
      </div>
      <div class="label">Works in</div>
      <div class="chips" id="addLanes">${p.lanes.map((l) => chip(l, false)).join('')}</div>
      <button class="btn" id="addBtn">Add to wardrobe</button>
    </section>`;
}

function renderYou() {
  const p = state.profile;
  const kv = (k, v) => `<div class="kv"><span>${k}</span><span>${esc(v || '—')}</span></div>`;
  screen.innerHTML = `
    <header class="top">
      <div class="overline">You</div>
      <h1 class="serif">Dressing your build.</h1>
      <p class="sub">The rules that matter for you, and nothing else.</p>
    </header>
    ${p.flags.map((f) => `<h2 class="section">${esc(f)}</h2><ul class="tips">${GUIDE[f].map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`).join('')}
    <h2 class="section">For everyone</h2>
    <ul class="tips">${GENERAL_GUIDE.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    <h2 class="section">Your answers</h2>
    <section class="card">
      ${kv('Height', p.height)}
      ${kv('Build', p.flags.join(', '))}
      ${kv('Sizes', [p.chest && `Chest ${p.chest}`, p.waist && `Waist ${p.waist}`, p.inseam && `Leg ${p.inseam}`, p.shoe && `Shoe ${p.shoe}`].filter(Boolean).join(' · '))}
      ${kv('Wardrobe budget', money(p.budget))}
      ${kv('Monthly spend', p.monthly)}
      ${kv('Goal', [...p.goalTags, p.goal].filter(Boolean).join(' · '))}
    </section>
    <div class="actions"><button class="btn" id="redo">Edit my answers</button></div>
    <div class="actions"><button class="btn ghost" id="reset" style="flex:1">Start over from scratch</button></div>`;
}

// ---------- Actions ----------

function swap(lane, slot) {
  const opts = LOOKS[lane].options[slot];
  const current = plan().looks[lane][slot].id;
  (state.picks[lane] ||= {})[slot] = opts[(opts.indexOf(current) + 1) % opts.length];
  save(); render();
}

function toggleOwn(lane, slot) {
  const id = plan().looks[lane][slot].id;
  if (state.ownedIds.includes(id)) {
    state.ownedIds = state.ownedIds.filter((o) => o !== id);
  } else {
    state.ownedIds.push(id);
    toast('Marked as owned in every look');
  }
  save(); render();
}

function removeOwned(key) {
  const [kind, val] = key.split(':');
  if (kind === 'id') state.ownedIds = state.ownedIds.filter((o) => o !== val);
  else state.ownedManual.splice(+val, 1);
  save(); render();
}

function addOwned() {
  const name = screen.querySelector('#addName').value.trim();
  const lanes = [...screen.querySelectorAll('#addLanes .chip.on')].map((c) => c.dataset.val);
  if (!name || !lanes.length) { toast('Add a name and pick at least one look'); return; }
  const slot = screen.querySelector('#addSlot').value;
  const colour = screen.querySelector('#addColour').value.trim() || 'Your colour';
  state.ownedManual.forEach((o) => { if (o.slot === slot) o.lanes = o.lanes.filter((l) => !lanes.includes(l)); });
  state.ownedManual = state.ownedManual.filter((o) => o.lanes.length);
  state.ownedManual.push({ slot, lanes, name, colour, hex: colourHex(colour), why: 'Already in your wardrobe, so it stays in.' });
  save(); toast('Added. Your looks will use it.'); render();
}

function colourHex(name) {
  const probe = document.createElement('span');
  probe.style.color = name.toLowerCase().replace(/\s+/g, '');
  return probe.style.color || '#b9b3a8';
}

function render() {
  if (!state.profile) return startOnboarding();
  const v = state.view;
  tabs.classList.remove('hidden');
  tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === v.tab));
  if (v.tab === 'home' && v.look && state.profile.lanes.includes(v.look)) return renderLook(v.look);
  ({ home: renderHome, shop: renderShop, owned: renderOwned, you: renderYou }[v.tab] || renderHome)();
}

function go(tab, look = null) {
  state.view = { tab, look };
  save(); render();
  window.scrollTo(0, 0);
}

tabs.onclick = (e) => {
  const b = e.target.closest('button');
  if (b) go(b.dataset.tab);
};

screen.addEventListener('click', (e) => {
  if (onboarding || !state.profile) return;
  const t = e.target.closest('button');
  if (!t) return;
  const d = t.dataset;
  if (t.closest('#addLanes')) { t.classList.toggle('on'); return; }
  if (d.go) return go(d.go);
  if (d.look) return go('home', d.look);
  if ('back' in d) return go('home');
  if (d.add) { state.profile.lanes.push(d.add); save(); return go('home', d.add); }
  if (d.drop) { state.profile.lanes = state.profile.lanes.filter((l) => l !== d.drop); save(); return go('home'); }
  if (d.swap) return swap(state.view.look, d.swap);
  if (d.own) return toggleOwn(state.view.look, d.own);
  if (d.remove) return removeOwned(d.remove);
  if (t.id === 'addBtn') return addOwned();
  if (t.id === 'redo') return startOnboarding();
  if (t.id === 'reset') { state = blank(); save(); startOnboarding(); }
});

render();

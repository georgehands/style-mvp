const STORE_KEY = 'style-proto-v4';
const screen = document.getElementById('screen');
const tabs = document.getElementById('tabs');

const MONTHLY = { 'Under £50': 40, '£50–150': 100, '£150–300': 225, '£300+': 350 };
const GOALS = ['Improve my overall look', 'Expand my wardrobe', 'Start again from scratch', 'Dress better for work', 'Find a style that’s actually me', 'Upgrade the basics'];
const WORK = ['Office, smart', 'Office, casual', 'Work from home', 'On my feet or on site', 'Student'];
const GYM = ['Rarely', '1–2 times a week', '3+ times a week'];
const OUT = ['Rarely', 'Now and then', 'Most weekends'];
const WEEKENDS = ['Outdoors', 'City and cafés', 'Sport', 'Travel', 'Mostly at home'];
const FITS = ['Slim', 'Regular', 'Relaxed'];
const COLOURS = ['Mostly neutrals', 'Earth tones', 'Happy with some colour'];
const NEVER = ['Shorts', 'Hoodies', 'Boots', 'Blazers', 'Tight fits', 'Secondhand'];
const SLOT_FILTERS = ['All', 'Liked', 'Top', 'Bottom', 'Shoes', 'Layer', 'Accessory'];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => `£${Math.round(n).toLocaleString('en-GB')}`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const listJoin = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const heart = (on) => `<svg viewBox="0 0 24 24" class="heart${on ? ' on' : ''}" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg>`;

const blank = () => ({
  profile: null, picks: {}, ownedIds: [], ownedManual: [],
  likes: { items: [], outfits: [] }, signals: { away: {}, n: 0 },
  view: { tab: 'home', look: null },
});
const blankProfile = () => ({
  goals: [], goalText: '',
  height: '', flags: [], chest: '', waist: '', inseam: '', shoe: '',
  work: '', gym: '', out: '', weekends: [],
  fit: '', colours: '', never: [],
  refMode: '', refImage: null, refPalette: null, refSummary: '',
  lanes: [], budget: 300, monthly: '',
});

let state = load() || blank();
let onboarding = false;
let draft = null;
let step = 0;
let browseSlot = 'All';
let browseOrder = null;
let sheetEl = null;
let sheetCtx = null;
let tasteCache = null;

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && s.view) return s;
    const old = JSON.parse(localStorage.getItem('style-proto-v3'));
    if (old && old.profile) return { ...blank(), profile: old.profile };
  } catch { /* fall through to a fresh start */ }
  return null;
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* storage full or blocked, run in memory */ }
}
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
function chip(label, on) {
  return `<button type="button" class="chip${on ? ' on' : ''}" data-val="${esc(label)}">${esc(label)}</button>`;
}
function question(title, key, options, multi = false, hint = '') {
  const on = (o) => (multi ? draft[key].includes(o) : draft[key] === o);
  return `
    <div class="qblock">
      <div class="qtitle">${title}${hint ? ` <span class="small">${hint}</span>` : ''}</div>
      <div class="chips" data-${multi ? 'multi' : 'single'}="${key}">${options.map((o) => chip(o, on(o))).join('')}</div>
    </div>`;
}

// ---------- Colour maths ----------

const hexToRgb = (hex) => {
  const m = String(hex).match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [180, 175, 165];
};
const rgbToHex = (r, g, b) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function tone(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max !== min) {
    if (max === r) h = ((g - b) / (max - min)) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    h = (h * 60 + 360) % 360;
  }
  if (s < 0.15 || l < 0.2 || l > 0.9) return 'neutral';
  if (h >= 15 && h <= 75) return 'earth';
  return 'colour';
}

const fitOf = (it) => (/relaxed|boxy|wide/i.test(it.fit) ? 'Relaxed' : /slim|fitted|athletic|tapered|muscle/i.test(`${it.fit} ${it.name}`) ? 'Slim' : 'Regular');
const paletteDist = (hex, palette) => {
  const main = palette.filter((p) => p.share >= 0.08);
  return Math.min(...(main.length ? main : palette).map((p) => dist(hexToRgb(hex), hexToRgb(p.hex))));
};

function closestLook(palette) {
  let best = null;
  LOOK_ORDER.filter((l) => l !== 'Gym').forEach((l) => {
    const d = SLOTS.reduce((sum, s) => sum + paletteDist(ITEMS[LOOKS[l].signature[s]].hex, palette), 0);
    if (!best || d < best.d) best = { l, d };
  });
  return best.l;
}

// Reads the main colours out of a reference photo. The real build hands the photo to the AI for cut and style too.
async function analyseImage(file) {
  const url = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });

  const scale = Math.min(1, 320 / Math.max(img.width, img.height));
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = Math.round(img.width * scale);
  thumbCanvas.height = Math.round(img.height * scale);
  thumbCanvas.getContext('2d').drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
  const thumb = thumbCanvas.toDataURL('image/jpeg', 0.75);

  const c = document.createElement('canvas');
  c.width = 48; c.height = 48;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, 48, 48);
  const data = ctx.getImageData(0, 0, 48, 48).data;
  const buckets = {};
  for (let i = 0; i < data.length; i += 4) {
    const key = `${data[i] >> 5},${data[i + 1] >> 5},${data[i + 2] >> 5}`;
    const b = (buckets[key] ||= { n: 0, r: 0, g: 0, b: 0 });
    b.n++; b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2];
  }
  const total = data.length / 4;
  const palette = [];
  Object.values(buckets).sort((a, b) => b.n - a.n).forEach((b) => {
    const rgb = [b.r / b.n, b.g / b.n, b.b / b.n];
    const near = palette.find((p) => dist(p.rgb, rgb) < 45);
    if (near) { near.share += b.n / total; return; }
    if (palette.length < 5) palette.push({ rgb, share: b.n / total });
  });
  const pal = palette.sort((a, b) => b.share - a.share).map((p) => ({ hex: rgbToHex(...p.rgb), share: +p.share.toFixed(2) }));

  const tones = { neutral: 0, earth: 0, colour: 0 };
  pal.forEach((p) => { tones[tone(p.hex)] += p.share; });
  const light = pal.reduce((s, p) => s + (hexToRgb(p.hex).reduce((a, v) => a + v, 0) / 765) * p.share, 0) / pal.reduce((s, p) => s + p.share, 0);
  const lead = tones.neutral >= tones.earth && tones.neutral >= tones.colour ? 'mostly neutral' : tones.earth >= tones.colour ? 'warm, earthy' : 'colourful';
  const summary = `${light < 0.35 ? 'Dark, ' : light > 0.65 ? 'Light, ' : ''}${lead} tones`;
  return { thumb, palette: pal, summary: summary.charAt(0).toUpperCase() + summary.slice(1) };
}

async function handleRefFile(file, target) {
  if (!file || !file.type.startsWith('image/')) { toast('That doesn’t look like an image'); return; }
  try {
    const r = await analyseImage(file);
    Object.assign(target, { refMode: 'image', refImage: r.thumb, refPalette: r.palette, refSummary: r.summary });
    if (target === state.profile) save();
    onboarding ? renderStep() : render();
  } catch {
    toast('Couldn’t read that image, try another');
  }
}

function recommendLooks(d) {
  const rec = new Set(['Casual']);
  if (/Office/.test(d.work) || d.goals.includes('Dress better for work')) rec.add('Smart Casual');
  if (d.gym && d.gym !== 'Rarely') rec.add('Gym');
  if (d.out && d.out !== 'Rarely') rec.add('Night Out');
  if (d.refPalette) rec.add(closestLook(d.refPalette));
  return LOOK_ORDER.filter((l) => rec.has(l));
}

function refBlock(p, compact = false) {
  if (p.refMode !== 'image') return '';
  return `
    <div class="ref-result${compact ? ' compact' : ''}">
      <img src="${p.refImage}" alt="Your reference photo">
      <div class="ref-read">
        <div class="small">What we read</div>
        <div class="name">${esc(p.refSummary)}</div>
        <div class="palette">${p.refPalette.map((c) => `<span style="background:${esc(c.hex)};flex:${Math.max(c.share, 0.08)}"></span>`).join('')}</div>
        <div class="small">Closest look: <b>${esc(closestLook(p.refPalette))}</b></div>
        <button type="button" class="link" data-ref-remove>Remove photo</button>
      </div>
    </div>`;
}

// ---------- Onboarding ----------

const STEPS = [
  {
    title: 'What do you want out of this?',
    sub: 'Pick everything that fits.',
    render: () => `
      <div class="chips" data-multi="goals">${GOALS.map((g) => chip(g, draft.goals.includes(g))).join('')}</div>
      <label class="field">Anything else? (optional)
        <textarea id="goalText" rows="3" placeholder="e.g. I’ve got loads of clothes but nothing goes together">${esc(draft.goalText)}</textarea>
      </label>`,
    valid: () => draft.goals.length || draft.goalText.trim(),
  },
  {
    title: 'Your build.',
    sub: 'This decides proportions, not just sizes.',
    render: () => `
      <label class="field">Height
        <input type="text" id="height" placeholder="e.g. 5'9 or 175cm" value="${esc(draft.height)}">
      </label>
      ${question('Pick any that sound like you', 'flags', BUILDS, true)}`,
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
      </div>`,
    valid: () => true,
  },
  {
    title: 'What does a normal week look like?',
    sub: 'So every look has somewhere to be worn.',
    render: () => `
      ${question('Work', 'work', WORK)}
      ${question('Gym', 'gym', GYM)}
      ${question('Going out', 'out', OUT)}
      ${question('Weekends', 'weekends', WEEKENDS, true, 'pick any')}`,
    valid: () => draft.work && draft.gym && draft.out,
  },
  {
    title: 'How do you like to wear things?',
    sub: 'This is where it gets specific to you.',
    render: () => `
      ${question('Fit', 'fit', FITS)}
      ${question('Colours', 'colours', COLOURS)}
      ${question('Things you’d never wear', 'never', NEVER, true, 'optional')}`,
    valid: () => draft.fit && draft.colours,
  },
  {
    title: 'Got a look you’re going for?',
    sub: 'Upload a photo of an outfit you like, and your wardrobe gets built towards it.',
    render: () => `
      <div class="ref-options">
        ${draft.refMode === 'image' ? refBlock(draft) : `
          <label class="ref-card upload">
            <input type="file" id="refFile" accept="image/*" hidden>
            <span class="serif">Upload a reference photo</span>
            <span class="small">An outfit you like, someone whose style you rate, a Pinterest screenshot.</span>
          </label>`}
        <button type="button" class="ref-card${draft.refMode === 'recommend' ? ' on' : ''}" data-ref="recommend">
          <span class="ref-top"><span class="serif">Let the stylist decide</span><span class="rec-tag">Recommended</span></span>
          <span class="small">Built from your answers. You can add a photo later from the You tab.</span>
        </button>
      </div>`,
    valid: () => draft.refMode,
  },
  {
    title: 'Which looks do you want?',
    sub: 'We’ve picked the ones that fit your week. Change anything.',
    enter: () => { if (!draft.lanes.length) draft.lanes = recommendLooks(draft); },
    render: () => {
      const rec = recommendLooks(draft);
      return `
        <div class="look-pick" data-multi="lanes">${LOOK_ORDER.map((l) => `
          <button type="button" class="look-opt${draft.lanes.includes(l) ? ' on' : ''}" data-val="${esc(l)}" style="--tint:${LOOKS[l].tint}">
            <span class="look-opt-top"><span class="serif">${esc(l)}</span>${rec.includes(l) ? '<span class="rec-tag">Recommended</span>' : ''}</span>
            <span class="small">${esc(LOOKS[l].tagline)}</span>
            <span class="tick"></span>
          </button>`).join('')}
        </div>`;
    },
    valid: () => draft.lanes.length,
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
];

function startOnboarding() {
  onboarding = true;
  closeSheet();
  draft = state.profile ? structuredClone(state.profile) : blankProfile();
  step = 0;
  tabs.classList.add('hidden');
  renderStep();
}

function renderStep() {
  const s = STEPS[step];
  s.enter?.();
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

  screen.querySelectorAll('input[type=text], textarea').forEach((el) => {
    el.addEventListener('input', () => { draft[el.id] = el.value; refreshNext(); });
  });
  const range = screen.querySelector('#budget');
  if (range) range.addEventListener('input', () => { draft.budget = +range.value; screen.querySelector('#budgetVal').textContent = money(draft.budget); });
  const file = screen.querySelector('#refFile');
  if (file) file.addEventListener('change', () => handleRefFile(file.files[0], draft));

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

  const rec = screen.querySelector('[data-ref="recommend"]');
  if (rec) rec.onclick = () => { Object.assign(draft, { refMode: 'recommend', refImage: null, refPalette: null, refSummary: '' }); renderStep(); };
  const remove = screen.querySelector('[data-ref-remove]');
  if (remove) remove.onclick = () => { Object.assign(draft, { refMode: '', refImage: null, refPalette: null, refSummary: '' }); renderStep(); };

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
      <p class="sub" style="margin-top:20px">Building your wardrobe around your week, your build and your budget…</p>
    </div>`;
  setTimeout(render, 1400);
}

// ---------- Taste: what his likes and changes say about him ----------

function touch() { tasteCache = null; }

function getTaste() {
  if (tasteCache) return tasteCache;
  const weights = {};
  state.likes.items.forEach((id) => { if (ITEMS[id]) weights[id] = (weights[id] || 0) + 1; });
  state.likes.outfits.forEach((o) => Object.values(o.pieces).forEach((id) => { if (ITEMS[id]) weights[id] = (weights[id] || 0) + 0.5; }));
  const t = { total: 0, tones: {}, fits: {}, shops: {}, families: {}, weights };
  Object.entries(weights).forEach(([id, w]) => {
    const it = ITEMS[id];
    t.total += w;
    t.tones[tone(it.hex)] = (t.tones[tone(it.hex)] || 0) + w;
    t.fits[fitOf(it)] = (t.fits[fitOf(it)] || 0) + w;
    t.shops[it.shop] = (t.shops[it.shop] || 0) + w;
    t.families[it.family] = (t.families[it.family] || 0) + w;
  });
  tasteCache = t;
  return t;
}

function tasteSummary() {
  const t = getTaste();
  const interactions = state.likes.items.length + state.likes.outfits.length + state.signals.n;
  const level = interactions < 5 ? 'Just getting started' : interactions < 15 ? 'Learning your taste' : 'Dialled in';
  const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0];
  const traits = [];
  let shops = [];
  if (t.total >= 2) {
    traits.push({ neutral: 'neutral colours', earth: 'earth tones', colour: 'a bit of colour' }[top(t.tones)]);
    const f = top(t.fits);
    if (f !== 'Regular') traits.push(`${f.toLowerCase()} fits`);
    shops = Object.entries(t.shops).filter(([k, v]) => v >= 1 && k !== 'Vinted (used)').sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
  }
  const line = [
    traits.length ? `You lean towards ${listJoin(traits)}.` : '',
    shops.length ? `You keep liking ${listJoin(shops)}.` : '',
  ].filter(Boolean).join(' ');
  return { level, pct: Math.min(100, (interactions / 20) * 100), line, interactions };
}

const isLiked = (id) => state.likes.items.includes(id);
const outfitKey = (o) => `${o.look}|${o.name}`;
const isOutfitLiked = (o) => state.likes.outfits.some((x) => outfitKey(x) === outfitKey(o));

function toggleLike(id) {
  if (isLiked(id)) {
    state.likes.items = state.likes.items.filter((x) => x !== id);
  } else {
    state.likes.items.push(id);
    toast(`Liked. Your outfits will lean towards ${ITEMS[id].shop === 'Vinted (used)' ? 'this' : `this and more ${ITEMS[id].shop}`}.`);
  }
  touch(); save(); refresh();
}

function toggleOutfitLike(o) {
  if (isOutfitLiked(o)) {
    state.likes.outfits = state.likes.outfits.filter((x) => outfitKey(x) !== outfitKey(o));
  } else {
    state.likes.outfits.push({ name: o.name, look: o.look, pieces: { ...o.pieces } });
    toast('Liked. Its pieces now count towards your taste.');
  }
  touch(); save(); refresh();
}

// ---------- Wardrobe engine (stand-in for the AI) ----------

const candidates = (look, slot) => Object.values(ITEMS).filter((it) => it.slot === slot && it.looks.includes(look)).map((it) => it.id);

function isExcluded(it) {
  const n = state.profile.never;
  return (n.includes('Shorts') && /shorts/i.test(it.name))
    || (n.includes('Hoodies') && /hoodie/i.test(it.name))
    || (n.includes('Boots') && /boot/i.test(it.name))
    || (n.includes('Blazers') && /blazer/i.test(it.name))
    || (n.includes('Tight fits') && /fitted|athletic|muscle/i.test(`${it.fit} ${it.name}`))
    || (n.includes('Secondhand') && /vinted/i.test(it.shop));
}

// How well a piece suits him in this look: the look's signature, his answers, his photo, then everything he's liked or rejected.
function score(id, look) {
  const p = state.profile;
  const it = ITEMS[id];
  if (isExcluded(it)) return -100;
  const sig = LOOKS[look].signature[it.slot];
  let s = 0;
  if (sig === id) s += 3;
  else if (sig && ITEMS[sig].family === it.family) s += 1.5;
  s -= it.price / 60;
  if (p.fit !== 'Regular' && fitOf(it) === p.fit) s += 1.5;
  const t = tone(it.hex);
  if (p.colours === 'Mostly neutrals' && t === 'colour') s -= 1.5;
  if (p.colours === 'Earth tones' && t === 'earth') s += 1.5;
  if (p.colours === 'Happy with some colour' && t === 'colour') s += 1;
  if (p.refPalette) s += Math.max(0, 2.5 - paletteDist(it.hex, p.refPalette) / 40);

  const taste = getTaste();
  if (isLiked(id)) s += 6;
  else if (taste.weights[id]) s += 2;
  if (taste.total >= 1) {
    s += (1.5 * (taste.tones[t] || 0)) / taste.total;
    s += (1 * (taste.fits[fitOf(it)] || 0)) / taste.total;
    s += Math.min(1.5, 0.75 * (taste.shops[it.shop] || 0));
    if (!isLiked(id) && taste.families[it.family]) s += 1;
  }
  s -= 1.2 * Math.min(3, state.signals.away[id] || 0);
  return s;
}

function bestFor(look, slot, extra = () => 0) {
  return candidates(look, slot).map((id) => ({ id, s: score(id, look) + extra(id) })).sort((a, b) => b.s - a.s)[0].id;
}

function reasonsFor(id) {
  const p = state.profile;
  const it = ITEMS[id];
  const taste = getTaste();
  const out = [];
  if (isLiked(id)) out.push('you liked this');
  else if (taste.families[it.family]) out.push('similar to something you liked');
  else if ((taste.shops[it.shop] || 0) >= 1 && it.shop !== 'Vinted (used)') out.push(`you like ${it.shop}`);
  if (p.refPalette && paletteDist(it.hex, p.refPalette) < 35) out.push('matches your reference photo');
  if (p.fit !== 'Regular' && fitOf(it) === p.fit) out.push(`${p.fit.toLowerCase()} cut, the way you like it`);
  if (p.colours === 'Earth tones' && tone(it.hex) === 'earth') out.push('an earth tone, like you asked');
  if (p.colours === 'Happy with some colour' && tone(it.hex) === 'colour') out.push('a bit of colour, like you asked');
  return out.slice(0, 2);
}

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

  const choice = [];
  p.lanes.forEach((lane) => SLOTS.forEach((slot) => {
    if (state.ownedManual.some((o) => o.slot === slot && o.lanes.includes(lane))) return;
    const opts = candidates(lane, slot);
    const pick = state.picks[lane]?.[slot];
    const locked = opts.includes(pick);
    choice.push({ lane, slot, locked, id: locked ? pick : opts.find((o) => owned.has(o)) || bestFor(lane, slot) });
  }));

  const total = () => cost([...new Set(choice.map((c) => c.id))].filter((id) => !owned.has(id)));
  for (let guard = 0; share && guard < 30 && total() > p.budget; guard++) {
    let best = null;
    const before = total();
    choice.filter((c) => !c.locked).forEach((c) => {
      candidates(c.lane, c.slot).forEach((opt) => {
        if (opt === c.id || isExcluded(ITEMS[opt]) || !(owned.has(opt) || choice.some((o) => o !== c && o.id === opt))) return;
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

  // Buy order: finish whole looks first, in the order they're listed, then the most-shared pieces.
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

// Pieces that sit well next to an anchor piece.
function compat(it, anchor) {
  const t = tone(it.hex);
  const at = tone(anchor.hex);
  let s = 0;
  if (at === 'colour') s += t === 'neutral' ? 1 : t === 'colour' ? -1.5 : 0;
  if (at === 'earth') s += t === 'earth' ? 0.8 : t === 'neutral' ? 0.5 : -0.5;
  if (it.shop === anchor.shop) s += 0.5;
  return s;
}

function buildAround(anchorId) {
  const a = ITEMS[anchorId];
  const look = a.looks.find((l) => state.profile.lanes.includes(l)) || a.looks[0];
  const pieces = {};
  SLOTS.forEach((slot) => {
    pieces[slot] = slot === a.slot ? anchorId : bestFor(look, slot, (id) => compat(ITEMS[id], a));
  });
  return { name: `Built around your ${a.colour.toLowerCase()} ${a.name.toLowerCase()}`, look, pieces };
}

function matchPct(o) {
  const avg = SLOTS.reduce((sum, s) => sum + score(o.pieces[s], o.look), 0) / SLOTS.length;
  return Math.max(50, Math.min(99, Math.round(72 + avg * 4)));
}

const piecesOf = (o) => Object.fromEntries(SLOTS.map((s) => [s, { item: ITEMS[o.pieces[s]] }]));
const outfitPrice = (o) => SLOTS.reduce((sum, s) => sum + ITEMS[o.pieces[s]].price, 0);

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
  const likes = state.likes.items.length + state.likes.outfits.length;
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
      <p>${readyLine}${sharedLine}${likes ? ` Tuned by ${plural(likes, 'like')}.` : ''}</p>
      ${p.refMode === 'image' ? `<div class="plan-ref"><img src="${p.refImage}" alt=""><span>Colours leaning towards your reference photo.</span></div>` : ''}
      <button class="btn light" data-go="shop">See what to buy first</button>
    </section>
    <h2 class="section">Your looks</h2>
    <div class="grid">${p.lanes.map((l) => tile(l, pl)).join('')}</div>
    ${unused.length ? `<h2 class="section">Add a look</h2>
      <div class="chips">${unused.map((l) => `<button class="chip add" data-add="${esc(l)}">+ ${esc(l)}</button>`).join('')}</div>` : ''}
    <button class="btn ghost browse-cta" data-go="browse">Browse outfits and pieces</button>`;
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
  const mine = x.manual ? [] : reasonsFor(x.id);
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
      ${mine.length ? `<p class="why you">Picked for you: ${esc(mine.join(', '))}.</p>` : ''}
      ${notes.map((n) => `<p class="why build">For your build: ${esc(n)}</p>`).join('')}
      ${also.length ? `<p class="also">Also in ${also.map((l) => `<span class="dot" style="background:${LOOKS[l].tint}"></span>${esc(l)}`).join(', ')}</p>` : ''}
      ${x.manual ? '' : `<div class="piece-actions">
        <button class="primary" data-change="${slot}">Change</button>
        <button class="icon${isLiked(x.id) ? ' on' : ''}" data-like="${esc(x.id)}" aria-label="Like">${heart(isLiked(x.id))}</button>
        <button data-own="${slot}" class="${x.owned ? 'on' : ''}">${x.owned ? 'Owned ✓' : 'I own this'}</button>
      </div>`}
    </article>`;
}

function renderBrowse() {
  const ts = tasteSummary();
  const outfits = OUTFITS.map((o, i) => ({ ...o, i, match: matchPct(o) }));
  // Order is fixed per visit so liking something doesn't reshuffle what he's looking at.
  browseOrder ||= {
    outfits: [...outfits].sort((a, b) => b.match - a.match).map((o) => o.i),
    families: Object.keys(FAMILIES)
      .map((fam) => ({ fam, s: Math.max(...Object.values(ITEMS).filter((it) => it.family === fam).flatMap((it) => it.looks.map((l) => score(it.id, l)))) }))
      .sort((a, b) => b.s - a.s)
      .map((f) => f.fam),
  };
  const families = browseOrder.families.map((fam) => {
    const variants = Object.values(ITEMS).filter((it) => it.family === fam);
    const best = variants.map((it) => ({ it, s: Math.max(...it.looks.map((l) => score(it.id, l))) })).sort((a, b) => b.s - a.s)[0];
    return { fam, variants, show: variants.find((v) => isLiked(v.id)) || best.it };
  });
  const shown = families.filter((f) => browseSlot === 'All' || (browseSlot === 'Liked' ? f.variants.some((v) => isLiked(v.id)) : FAMILIES[f.fam].slot === browseSlot));
  const carouselLeft = screen.querySelector('.carousel')?.scrollLeft || 0;

  screen.innerHTML = `
    <header class="top">
      <div class="overline">Browse</div>
      <h1 class="serif">Find what you like.</h1>
      <p class="sub">Like outfits and pieces. Every like makes your wardrobe more yours.</p>
    </header>
    <section class="taste">
      <div class="taste-row"><span class="k">Your taste</span><span class="taste-level">${ts.level}</span></div>
      <div class="bar"><span style="width:${ts.pct}%"></span></div>
      <p>${ts.line ? `${esc(ts.line)} Your outfits are using this.` : 'Like a few outfits or pieces below and this starts to fill in.'}</p>
    </section>
    <h2 class="section">Outfits for you</h2>
    <div class="carousel">${browseOrder.outfits.map((i) => outfits[i]).map((o) => `
      <article class="ocard" style="--tint:${LOOKS[o.look].tint}">
        <div class="ocard-head">
          <div>
            <div class="ocard-name serif">${esc(o.name)}</div>
            <div class="ocard-meta">${esc(o.look)} · ${money(outfitPrice(o))}</div>
          </div>
          <span class="pill ok">${o.match}% match</span>
        </div>
        <div class="ocard-fig">${avatarSVG(piecesOf(o))}</div>
        <div class="strip">${SLOTS.map((s) => `<span style="background:${esc(ITEMS[o.pieces[s]].hex)}"></span>`).join('')}</div>
        <div class="ocard-actions">
          <button class="icon-light${isOutfitLiked(o) ? ' on' : ''}" data-like-outfit="${o.i}" aria-label="Like outfit">${heart(isOutfitLiked(o))}</button>
          <button class="btn light" data-wear="${o.i}">Wear this</button>
        </div>
      </article>`).join('')}
    </div>
    <h2 class="section">Pieces</h2>
    <div class="chips filter">${SLOT_FILTERS.map((f) => `<button class="chip${browseSlot === f ? ' on' : ''}" data-bslot="${f}">${f === 'All' || f === 'Liked' ? f : `${f}s`.replace('Shoess', 'Shoes').replace('Accessorys', 'Accessories')}</button>`).join('')}</div>
    ${shown.length ? `<div class="pgrid">${shown.map((f) => `
      <button class="pcard" data-item="${esc(f.show.id)}">
        <span class="pcard-sw" style="background:${esc(f.show.hex)}">
          <span class="heart-btn${isLiked(f.show.id) ? ' on' : ''}" data-like="${esc(f.show.id)}">${heart(isLiked(f.show.id))}</span>
        </span>
        <span class="pcard-body">
          <span class="name">${esc(f.show.name)}</span>
          <span class="small">${esc(f.show.shop)} · ${money(f.show.price)}</span>
          <span class="dots">${f.variants.map((v) => `<span style="background:${esc(v.hex)}"></span>`).join('')}</span>
        </span>
      </button>`).join('')}</div>` : '<div class="empty">Nothing liked yet. Tap the heart on anything you like.</div>'}`;
  screen.querySelector('.carousel').scrollLeft = carouselLeft;
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
    ...state.ownedIds.filter((id) => ITEMS[id]).map((id) => ({ key: `id:${id}`, name: ITEMS[id].name, hex: ITEMS[id].hex, sub: `${ITEMS[id].slot} · ${ITEMS[id].colour}` })),
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
        </div>`).join('') : '<div class="empty">Nothing yet. Tap “I own this” on any piece, or add one below.</div>'}
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
    <h2 class="section">Reference photo</h2>
    ${p.refMode === 'image' ? refBlock(p, true) : `
      <label class="ref-card upload">
        <input type="file" id="refFileYou" accept="image/*" hidden>
        <span class="serif">Add a reference photo</span>
        <span class="small">Your looks will lean towards its colours.</span>
      </label>`}
    <h2 class="section">Your answers</h2>
    <section class="card">
      ${kv('Goals', [...p.goals, p.goalText].filter(Boolean).join(' · '))}
      ${kv('Height', p.height)}
      ${kv('Build', p.flags.join(', '))}
      ${kv('Sizes', [p.chest && `Chest ${p.chest}`, p.waist && `Waist ${p.waist}`, p.inseam && `Leg ${p.inseam}`, p.shoe && `Shoe ${p.shoe}`].filter(Boolean).join(' · '))}
      ${kv('Work', p.work)}
      ${kv('Gym', p.gym)}
      ${kv('Going out', p.out)}
      ${kv('Weekends', p.weekends.join(', '))}
      ${kv('Fit', p.fit)}
      ${kv('Colours', p.colours)}
      ${kv('Never', p.never.join(', '))}
      ${kv('Wardrobe budget', money(p.budget))}
      ${kv('Monthly spend', p.monthly)}
    </section>
    <div class="actions"><button class="btn" id="redo">Edit my answers</button></div>
    <div class="actions"><button class="btn ghost" id="reset" style="flex:1">Start over from scratch</button></div>`;
  const file = screen.querySelector('#refFileYou');
  if (file) file.addEventListener('change', () => handleRefFile(file.files[0], state.profile));
}

// ---------- Bottom sheets ----------

function openSheet(ctx) {
  sheetCtx = ctx;
  if (!sheetEl) {
    sheetEl = document.createElement('div');
    sheetEl.className = 'sheet-backdrop';
    sheetEl.addEventListener('click', onSheetClick);
    document.body.appendChild(sheetEl);
    document.body.classList.add('locked');
  }
  renderSheet();
}

function closeSheet() {
  sheetEl?.remove();
  sheetEl = null;
  sheetCtx = null;
  document.body.classList.remove('locked');
}

function renderSheet() {
  if (!sheetEl) return;
  const body = sheetCtx.type === 'change' ? changeSheet(sheetCtx) : sheetCtx.type === 'built' ? builtSheet(sheetCtx.outfit) : itemSheet(sheetCtx.id);
  sheetEl.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div><button class="sheet-close" data-close aria-label="Close">×</button>${body}</div>`;
}

function itemHeader(it, withLike = true) {
  return `
    <div class="sheet-item">
      <div class="swatch big" style="background:${esc(it.hex)}"></div>
      <div class="meta">
        <div class="name">${esc(it.name)}</div>
        <div class="small">${esc(it.colour)} · ${esc(it.fit)} · ${esc(it.shop)}</div>
        <div class="price">${money(it.price)}</div>
      </div>
      ${withLike ? `<button class="icon${isLiked(it.id) ? ' on' : ''}" data-like="${esc(it.id)}" aria-label="Like">${heart(isLiked(it.id))}</button>` : ''}
    </div>`;
}

function changeSheet({ look, slot }) {
  const cur = plan().looks[look][slot];
  const it = cur.item;
  const all = candidates(look, slot).filter((id) => !isExcluded(ITEMS[id]));
  const colours = all.filter((id) => ITEMS[id].family === it.family);
  const others = all.filter((id) => id !== cur.id).sort((a, b) => score(b, look) - score(a, look));
  const diff = (id) => {
    const d = ITEMS[id].price - it.price;
    return d === 0 ? 'Same price' : d < 0 ? `${money(-d)} less` : `${money(d)} more`;
  };
  return `
    <div class="overline">${slot} · ${esc(look)}</div>
    ${itemHeader(it)}
    <div class="quick">
      <button data-quick="cheaper">Cheaper</button>
      <button data-quick="colour"${colours.length < 2 ? ' disabled' : ''}>Different colour</button>
      <button data-quick="different">Something different</button>
    </div>
    ${colours.length > 1 ? `
      <div class="label">Colours</div>
      <div class="swatches">${colours.map((id) => `<button class="sw${id === cur.id ? ' on' : ''}" data-pick="${esc(id)}" style="background:${esc(ITEMS[id].hex)}" title="${esc(ITEMS[id].colour)}" aria-label="${esc(ITEMS[id].colour)}"></button>`).join('')}</div>` : ''}
    <div class="label">Everything that works in your ${esc(look)} look</div>
    <div class="opt-list">${others.map((id, i) => {
      const o = ITEMS[id];
      const why = reasonsFor(id)[0];
      return `
        <div class="opt">
          <button class="opt-main" data-pick="${esc(id)}">
            <span class="swatch" style="background:${esc(o.hex)}"></span>
            <span class="meta">
              <span class="name">${esc(o.name)}${i === 0 ? ' <span class="rec-tag">Best match</span>' : ''}</span>
              <span class="small">${esc(o.colour)} · ${esc(o.shop)} · ${money(o.price)} <span class="diff">${diff(id)}</span></span>
              ${why ? `<span class="small you">${esc(why.charAt(0).toUpperCase() + why.slice(1))}</span>` : ''}
            </span>
          </button>
          <button class="icon${isLiked(id) ? ' on' : ''}" data-like="${esc(id)}" aria-label="Like">${heart(isLiked(id))}</button>
        </div>`;
    }).join('')}</div>`;
}

function itemSheet(id) {
  const it = ITEMS[id];
  const variants = Object.values(ITEMS).filter((x) => x.family === it.family);
  const lanes = state.profile.lanes;
  const reasons = reasonsFor(id);
  return `
    <div class="overline">${esc(it.slot)}</div>
    ${itemHeader(it)}
    <p class="why">${esc(it.why)}</p>
    ${reasons.length ? `<p class="why you">For you: ${esc(reasons.join(', '))}.</p>` : ''}
    ${isExcluded(it) ? '<p class="note">You said you’d never wear this, so it won’t be picked automatically.</p>' : ''}
    ${variants.length > 1 ? `
      <div class="label">Colours</div>
      <div class="swatches">${variants.map((v) => `<button class="sw${v.id === id ? ' on' : ''}" data-variant="${esc(v.id)}" style="background:${esc(v.hex)}" title="${esc(v.colour)}" aria-label="${esc(v.colour)}"></button>`).join('')}</div>` : ''}
    <button class="btn" data-build="${esc(id)}">Build an outfit around this</button>
    <div class="label" style="margin-top:22px">Or add it to a look</div>
    <div class="chips">${it.looks.map((l) => `<button class="chip" data-addto="${esc(l)}">${lanes.includes(l) ? '' : '+ '}${esc(l)}</button>`).join('')}</div>`;
}

function builtSheet(o) {
  const inLanes = state.profile.lanes.includes(o.look);
  return `
    <div class="overline">Built for you · ${esc(o.look)}</div>
    <h2 class="sheet-title serif">${esc(o.name)}</h2>
    <div class="built">
      <div class="built-fig" style="--tint:${LOOKS[o.look].tint}">${avatarSVG(piecesOf(o))}</div>
      <div class="built-list">${SLOTS.map((s) => {
        const it = ITEMS[o.pieces[s]];
        return `<div class="built-row"><span class="swatch sm" style="background:${esc(it.hex)}"></span><span class="meta"><span class="name">${esc(it.name)}</span><span class="small">${esc(it.colour)} · ${money(it.price)}</span></span></div>`;
      }).join('')}</div>
    </div>
    <div class="built-total"><span>${matchPct(o)}% match</span><span>${money(outfitPrice(o))}</span></div>
    <div class="actions">
      <button class="btn ghost" data-like-built>${isOutfitLiked(o) ? 'Liked ✓' : 'Like'}</button>
      <button class="btn" data-apply>${inLanes ? `Use as my ${esc(o.look)} look` : `Add as a ${esc(o.look)} look`}</button>
    </div>`;
}

function onSheetClick(e) {
  if (e.target === sheetEl) { closeSheet(); return; }
  const t = e.target.closest('button');
  if (!t || t.disabled) return;
  const d = t.dataset;
  if ('close' in d) return closeSheet();
  if (d.like) return toggleLike(d.like);
  if (d.pick) return pick(sheetCtx.look, sheetCtx.slot, d.pick);
  if (d.quick) return quick(d.quick);
  if (d.variant) { sheetCtx.id = d.variant; return renderSheet(); }
  if (d.build) { sheetCtx = { type: 'built', outfit: buildAround(d.build) }; return renderSheet(); }
  if (d.addto) return addToLook(sheetCtx.id, d.addto);
  if ('likeBuilt' in d) return toggleOutfitLike(sheetCtx.outfit);
  if ('apply' in d) return applyOutfit(sheetCtx.outfit);
}

// ---------- Actions ----------

function refresh() {
  render();
  renderSheet();
}

function pick(look, slot, id, msg) {
  const cur = plan().looks[look][slot];
  if (cur.id && cur.id !== id) state.signals.away[cur.id] = (state.signals.away[cur.id] || 0) + 1;
  state.signals.n++;
  (state.picks[look] ||= {})[slot] = id;
  touch(); save(); closeSheet(); render();
  toast(msg || `Swapped to ${ITEMS[id].colour.toLowerCase()} ${ITEMS[id].name.toLowerCase()}`);
}

function quick(kind) {
  const { look, slot } = sheetCtx;
  const cur = plan().looks[look][slot].item;
  const ranked = candidates(look, slot).filter((id) => id !== cur.id && !isExcluded(ITEMS[id])).sort((a, b) => score(b, look) - score(a, look));
  let target;
  if (kind === 'cheaper') target = ranked.find((id) => ITEMS[id].price < cur.price);
  if (kind === 'colour') target = ranked.find((id) => ITEMS[id].family === cur.family);
  if (kind === 'different') target = ranked.find((id) => ITEMS[id].family !== cur.family);
  if (!target) {
    toast(kind === 'cheaper' ? 'That’s already the cheapest option for this look' : 'Nothing else fits this look right now');
    return;
  }
  const it = ITEMS[target];
  const msg = kind === 'cheaper'
    ? `Swapped to ${it.shop} ${it.name.toLowerCase()}, saves ${money(cur.price - it.price)}`
    : `Swapped to ${it.colour.toLowerCase()} ${it.name.toLowerCase()}`;
  pick(look, slot, target, msg);
}

function addToLook(id, look) {
  const it = ITEMS[id];
  if (!state.profile.lanes.includes(look)) state.profile.lanes.push(look);
  (state.picks[look] ||= {})[it.slot] = id;
  state.signals.n++;
  touch(); save(); closeSheet();
  go('home', look);
  toast(`Added to your ${look} look`);
}

function applyOutfit(o) {
  if (!state.profile.lanes.includes(o.look)) state.profile.lanes.push(o.look);
  state.picks[o.look] = { ...o.pieces };
  state.signals.n++;
  touch(); save(); closeSheet();
  go('home', o.look);
  toast('Now tap Change on any piece to make it yours');
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
  const [kind, ...rest] = key.split(':');
  const val = rest.join(':');
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
  if (!probe.style.color) return '#b9b3a8';
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color.match(/\d+/g).map(Number);
  probe.remove();
  return rgbToHex(...rgb);
}

function render() {
  if (!state.profile) return startOnboarding();
  const v = state.view;
  tabs.classList.remove('hidden');
  tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === v.tab));
  if (v.tab === 'home' && v.look && state.profile.lanes.includes(v.look)) return renderLook(v.look);
  ({ home: renderHome, browse: renderBrowse, shop: renderShop, owned: renderOwned, you: renderYou }[v.tab] || renderHome)();
}

function go(tab, look = null) {
  if (tab === 'browse') browseOrder = null;
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
  const likeSpan = e.target.closest('.heart-btn');
  if (likeSpan) { e.stopPropagation(); toggleLike(likeSpan.dataset.like); return; }
  const t = e.target.closest('button');
  if (!t) return;
  const d = t.dataset;
  if (t.closest('#addLanes')) { t.classList.toggle('on'); return; }
  if ('refRemove' in d) {
    Object.assign(state.profile, { refMode: 'recommend', refImage: null, refPalette: null, refSummary: '' });
    save(); return render();
  }
  if (d.go) return go(d.go);
  if (d.look) return go('home', d.look);
  if ('back' in d) return go('home');
  if (d.add) { state.profile.lanes.push(d.add); save(); return go('home', d.add); }
  if (d.drop) { state.profile.lanes = state.profile.lanes.filter((l) => l !== d.drop); save(); return go('home'); }
  if (d.change) return openSheet({ type: 'change', look: state.view.look, slot: d.change });
  if (d.like) return toggleLike(d.like);
  if (d.own) return toggleOwn(state.view.look, d.own);
  if (d.item) return openSheet({ type: 'item', id: d.item });
  if (d.wear) return applyOutfit(OUTFITS[+d.wear]);
  if (d.likeOutfit) return toggleOutfitLike(OUTFITS[+d.likeOutfit]);
  if (d.bslot) { browseSlot = d.bslot; return render(); }
  if (d.remove) return removeOwned(d.remove);
  if (t.id === 'addBtn') return addOwned();
  if (t.id === 'redo') return startOnboarding();
  if (t.id === 'reset') { state = blank(); touch(); save(); startOnboarding(); }
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

render();

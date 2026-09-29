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
const budgetLabel = (b) => (b > 1000 ? '£1,000+' : money(b));
const budgetCap = (b) => (b > 1000 ? Infinity : b);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const listJoin = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const thumb = (it, cls = '') => (it.family ? `<span class="thumb ${cls}">${productSVG(it)}</span>` : `<span class="swatch ${cls}" style="background:${esc(it.hex)}"></span>`);
const heart = (on) => `<svg viewBox="0 0 24 24" class="heart${on ? ' on' : ''}" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg>`;

const blank = () => ({
  profile: null, picks: {}, ownedIds: [], ownedManual: [],
  likes: { items: [], outfits: [] }, signals: { away: {}, n: 0 }, notes: [],
  view: { tab: 'home', look: null },
  unlocked: false, leadSent: '',
});
const blankProfile = () => ({
  goals: [], goalText: '',
  height: '', flags: [], chest: '', waist: '', inseam: '', shoe: '',
  work: '', gym: '', out: '', weekends: [],
  fit: '', colours: '', never: [],
  refMode: '', refImage: null, refPalette: null, refSummary: '',
  lanes: [], budget: 300, monthly: '',
  name: '', email: '', optIn: false,
});

let state = load() || blank();
let onboarding = false;
let draft = null;
let step = 0;
let browseSlot = 'All';
let browseLook = 'All';
let browseOrder = null;
let ringPos = null;
let sheetEl = null;
let sheetCtx = null;
let tasteCache = null;

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && s.view) return { ...blank(), ...s };
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

// ---------- Funnel: welcome, intake notes, preview, checkout ----------

const PRICE = 49;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const GOAL_NOTES = {
  'Improve my overall look': 'Most of looking put together comes down to fit and colour, not spending more. That’s where we start.',
  'Expand my wardrobe': 'Every new piece gets picked to go with the rest, so you get more outfits out of fewer clothes.',
  'Start again from scratch': 'Starting clean is the easy version. Nothing old to design around.',
  'Dress better for work': 'We’ll make sure one look covers work properly, then build the rest around it.',
  'Find a style that’s actually me': 'Your answers steer the first picks. After that, everything you like or swap makes it more you.',
  'Upgrade the basics': 'Basics carry most outfits, so better ones lift everything you already own.',
};
const COLOUR_WORDS = {
  'Mostly neutrals': 'navy, grey, white and black',
  'Earth tones': 'olive, tan, stone and brown',
  'Happy with some colour': 'neutrals with one colour per outfit',
};
const buildFlag = (p) => p.flags.find((f) => f !== 'Average') || (p.flags.length ? 'Average' : null);

// Sends a row to Netlify Forms. Only runs where the matching hidden form exists (the Netlify build), never in the claude.ai copy.
function record(form, fields) {
  if (!document.querySelector(`form[name="${form}"]`)) return;
  fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ 'form-name': form, ...fields }).toString(),
  }).catch(() => {});
}

function setFunnel(on) {
  document.body.classList.toggle('funnel', on);
  if (on) tabs.classList.add('hidden');
}

function previewPlan(d) {
  const keep = state.profile;
  state.profile = d;
  try { return plan(); } finally { state.profile = keep; }
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
    note: () => (draft.goals.length ? { label: 'Stylist note', text: GOAL_NOTES[draft.goals[draft.goals.length - 1]] } : null),
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
    fig: true,
    note: () => {
      const f = buildFlag(draft);
      return f ? { label: 'Your first tip', text: GUIDE[f][0] } : { label: 'Your figure', text: 'Pick your build and it reshapes to match.' };
    },
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
    fig: true,
    note: () => (draft.chest.trim() || draft.waist.trim()
      ? { label: 'Your figure', text: 'Redrawn to your measurements. Every outfit you see will be on this figure.' }
      : { label: 'Your figure', text: 'Add your chest and waist and the figure redraws to match.' }),
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
    note: () => (draft.work && draft.gym && draft.out
      ? { label: 'Stylist note', text: `A week like that needs ${listJoin(recommendLooks(draft))}. Those get built first.` }
      : null),
  },
  {
    title: 'How do you like to wear things?',
    sub: 'This is where it gets specific to you.',
    render: () => `
      ${question('Fit', 'fit', FITS)}
      ${question('Colours', 'colours', COLOURS)}
      ${question('Things you’d never wear', 'never', NEVER, true, 'optional')}`,
    valid: () => draft.fit && draft.colours,
    note: () => {
      if (!draft.fit || !draft.colours) return null;
      const never = draft.never.length ? ` No ${listJoin(draft.never.map((n) => n.toLowerCase()))}, anywhere.` : '';
      return { label: 'Stylist note', text: `${draft.fit} cuts in ${COLOUR_WORDS[draft.colours]}.${never}` };
    },
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
    note: () => (draft.lanes.length > 1
      ? { label: 'Stylist note', text: `${plural(draft.lanes.length, 'look')}. Where a piece works in more than one, it gets shared, so you don’t buy twice.` }
      : null),
  },
  {
    title: 'What’s your wardrobe budget?',
    sub: 'The total you’re happy to spend across every look. We’ll tell you what to buy first.',
    render: () => `
      <div class="budget-card">
        <div class="small">Whole wardrobe</div>
        <div class="budget-val" id="budgetVal">${budgetLabel(draft.budget)}</div>
        <input type="range" id="budget" min="100" max="1025" step="25" value="${draft.budget}">
        <div class="range-ends"><span>£100</span><span>£1,000</span></div>
      </div>
      <h2 class="q">And what do you usually spend on clothes a month?</h2>
      <p class="small" style="margin:0 0 14px">So we can tell you when you’ll have the rest.</p>
      <div class="chips" data-single="monthly">${Object.keys(MONTHLY).map((m) => chip(m, draft.monthly === m)).join('')}</div>`,
    valid: () => draft.monthly,
    note: () => {
      const pl = previewPlan(draft);
      const n = draft.lanes.length;
      const first = pl.ready.length
        ? `${budgetLabel(draft.budget)} finishes ${pl.ready.length === n ? `all ${plural(n, 'look')}` : `${pl.ready.length} of your ${n} looks`} straight away.`
        : `${budgetLabel(draft.budget)} won’t finish a whole look yet, so you’d start with the pieces that work hardest.`;
      const rest = pl.later.length && draft.monthly
        ? ` The rest in about ${plural(Math.ceil(pl.laterTotal / MONTHLY[draft.monthly]), 'month')} at what you usually spend.`
        : '';
      return { label: 'Your budget', text: first + rest };
    },
  },
  {
    title: 'Who’s this wardrobe for?',
    sub: 'Your name and email, so we know whose plan this is and can get in touch about it.',
    render: () => `
      <label class="field">First name
        <input type="text" id="name" autocomplete="given-name" placeholder="e.g. Sam" value="${esc(draft.name)}">
      </label>
      <label class="field">Email
        <input type="email" id="email" autocomplete="email" inputmode="email" placeholder="you@example.com" value="${esc(draft.email)}">
      </label>
      <label class="check">
        <input type="checkbox" id="optIn"${draft.optIn ? ' checked' : ''}>
        <span>Send me style tips and new looks now and then. Unsubscribe any time.</span>
      </label>
      <p class="fine left">We won’t sell or share your email.</p>`,
    valid: () => draft.name.trim() && EMAIL_RE.test(draft.email.trim()),
    note: () => {
      const pl = previewPlan(draft);
      return { label: 'Ready to build', text: `${plural(draft.lanes.length, 'look')} and ${plural(pl.pieceCount, 'piece')}, built around ${budgetLabel(draft.budget)}.` };
    },
  },
];

function startOnboarding() {
  onboarding = true;
  closeSheet();
  draft = state.profile ? { ...blankProfile(), ...structuredClone(state.profile) } : blankProfile();
  step = 0;
  setFunnel(true);
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
      <div id="note" aria-live="polite"></div>
      <div class="actions">
        ${step > 0 ? '<button class="btn ghost" id="back">Back</button>' : ''}
        <button class="btn" id="next">${step === STEPS.length - 1 ? 'Build my wardrobe' : 'Next'}</button>
      </div>
    </div>`;

  screen.querySelectorAll('input[type=text], input[type=email], textarea').forEach((el) => {
    el.addEventListener('input', () => { draft[el.id] = el.value; refreshNext(); });
  });
  const range = screen.querySelector('#budget');
  if (range) range.addEventListener('input', () => { draft.budget = +range.value; screen.querySelector('#budgetVal').textContent = budgetLabel(draft.budget); refreshNext(); });
  const optIn = screen.querySelector('#optIn');
  if (optIn) optIn.addEventListener('change', () => { draft.optIn = optIn.checked; });
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
  refreshNote();
}

function refreshNote() {
  const el = screen.querySelector('#note');
  const s = STEPS[step];
  const n = s.note?.();
  el.innerHTML = n ? `
    <div class="note-card">
      ${s.fig ? `<div class="note-fig">${mannequinSVG(draft, piecesOf(OUTFITS[0]))}</div>` : ''}
      <div><div class="note-label">${esc(n.label)}</div><p>${esc(n.text)}</p></div>
    </div>` : '';
}

function finishOnboarding() {
  onboarding = false;
  draft.email = draft.email.trim();
  state.profile = draft;
  state.view = { tab: 'home', look: null };
  if (draft.email !== state.leadSent) {
    record('leads', {
      name: draft.name.trim(), email: draft.email, opt_in: draft.optIn ? 'yes' : 'no',
      goals: draft.goals.join(', '), build: draft.flags.join(', '), height: draft.height,
      work: draft.work, looks: draft.lanes.join(', '), budget: budgetLabel(draft.budget), monthly: draft.monthly,
    });
    state.leadSent = draft.email;
  }
  save();
  const lines = ['Reading your build', 'Matching pieces to your week', `Fitting it all into ${budgetLabel(draft.budget)}`];
  screen.innerHTML = `
    <div class="loader">
      <div><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
      <p class="sub" id="loadLine">${lines[0]}…</p>
    </div>`;
  lines.slice(1).forEach((l, i) => setTimeout(() => {
    const el = document.getElementById('loadLine');
    if (el) el.textContent = `${l}…`;
  }, 800 * (i + 1)));
  setTimeout(() => { render(); window.scrollTo(0, 0); }, 2500);
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
  s += noteBonus(it);
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
  const asked = askedFor(it);
  if (asked) out.push(`you asked for “${asked}”`);
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
  for (let guard = 0; share && guard < 30 && total() > budgetCap(p.budget); guard++) {
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
    if (spent + cost(need) <= budgetCap(p.budget)) { need.forEach((id) => now.add(id)); spent += cost(need); }
  });
  const later = [];
  Object.keys(usage)
    .filter((id) => !owned.has(id) && !now.has(id))
    .sort((a, b) => usage[b].size - usage[a].size || ITEMS[a].price - ITEMS[b].price)
    .forEach((id) => {
      if (spent + ITEMS[id].price <= budgetCap(p.budget)) { now.add(id); spent += ITEMS[id].price; } else later.push(id);
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
  return mannequinSVG(state.profile, pieces);
}

// ---------- Screens ----------

function renderHome() {
  const p = state.profile;
  const pl = plan();
  const unused = LOOK_ORDER.filter((l) => !p.lanes.includes(l));
  const pct = Math.min(100, (pl.spent / Math.min(budgetCap(p.budget), Math.max(pl.spent, 1))) * 100);
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
        <div><div class="k">Budget</div><div class="v">${budgetLabel(p.budget)}</div></div>
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
    <form class="ask" data-ask-look="${esc(lane)}">
      <input type="text" id="askLook" autocomplete="off" placeholder="Ask the stylist: black shoes, woody scent, cheaper jeans…">
      <button class="btn" type="submit">Ask</button>
    </form>
    <p class="note">For now it understands colours, brands, fits and types of clothing. The full AI will understand anything. Prices are samples.</p>
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
        ${thumb(it)}
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
  const inLook = (looks) => browseLook === 'All' || looks.includes(browseLook);
  const ring = browseOrder.outfits.map((i) => outfits[i]).filter((o) => inLook([o.look]));
  const families = browseOrder.families
    .filter((fam) => inLook(FAMILIES[fam].looks))
    .map((fam) => {
      const variants = Object.values(ITEMS).filter((it) => it.family === fam);
      const best = variants.map((it) => ({ it, s: Math.max(...it.looks.map((l) => score(it.id, l))) })).sort((a, b) => b.s - a.s)[0];
      return { fam, variants, show: variants.find((v) => isLiked(v.id)) || best.it };
    });
  const shown = families.filter((f) => browseSlot === 'All' || (browseSlot === 'Liked' ? f.variants.some((v) => isLiked(v.id)) : FAMILIES[f.fam].slot === browseSlot));
  const typeLabel = (f) => ({ All: 'All', Liked: 'Liked', Top: 'Tops', Bottom: 'Bottoms', Shoes: 'Shoes', Layer: 'Layers', Accessory: 'Accessories' }[f]);

  screen.innerHTML = `
    <header class="top">
      <div class="overline">Browse</div>
      <h1 class="serif">Find what you like.</h1>
    </header>
    <nav class="look-tabs">${['All', ...LOOK_ORDER].map((l) => `<button class="${browseLook === l ? 'on' : ''}" data-blook="${esc(l)}">${esc(l)}</button>`).join('')}</nav>
    ${ring.length ? `
      <div class="ring" aria-label="Outfits">${ring.map((o) => `
        <button class="mq" data-open-outfit="${o.i}" aria-label="${esc(o.name)}">
          <span class="mq-fig">${avatarSVG(piecesOf(o))}</span>
          <span class="mq-floor"></span>
        </button>`).join('')}
      </div>
      <div class="ring-caption" id="ringCaption"></div>` : '<div class="empty">No outfits in this look yet.</div>'}
    <section class="taste">
      <div class="taste-row"><span class="k">Your taste</span><span class="taste-level">${ts.level}</span></div>
      <div class="bar"><span style="width:${ts.pct}%"></span></div>
      <p>${ts.line ? `${esc(ts.line)} Your outfits are using this.` : 'Like outfits or pieces and this starts to fill in.'}</p>
    </section>
    <h2 class="section">Pieces${browseLook === 'All' ? '' : ` for ${esc(browseLook)}`}</h2>
    <div class="chips filter">${SLOT_FILTERS.map((f) => `<button class="chip${browseSlot === f ? ' on' : ''}" data-bslot="${f}">${typeLabel(f)}</button>`).join('')}</div>
    ${shown.length ? `<div class="pgrid">${shown.map((f) => `
      <button class="pcard" data-item="${esc(f.show.id)}">
        <span class="pcard-img">
          ${productSVG(f.show)}
          <span class="heart-btn${isLiked(f.show.id) ? ' on' : ''}" data-like="${esc(f.show.id)}">${heart(isLiked(f.show.id))}</span>
        </span>
        <span class="pcard-body">
          <span class="name">${esc(f.show.name)}</span>
          <span class="small">${esc(f.show.shop)} · ${money(f.show.price)}</span>
          <span class="dots">${f.variants.map((v) => `<span style="background:${esc(v.hex)}"></span>`).join('')}</span>
        </span>
      </button>`).join('')}</div>` : `<div class="empty">${browseSlot === 'Liked' ? 'Nothing liked here yet. Tap the heart on anything you like.' : 'Nothing here yet.'}</div>`}`;

  if (ring.length) setupRing(ring);
}

// Three mannequins in view, the centre one closest, like a slowly turning stand.
function setupRing(ring) {
  const el = screen.querySelector('.ring');
  const caption = screen.querySelector('#ringCaption');
  const items = [...el.querySelectorAll('.mq')];
  let centred = -1;
  const paint = () => {
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    items.forEach((mq, i) => {
      const d = (mq.offsetLeft + mq.offsetWidth / 2 - mid) / mq.offsetWidth;
      const a = Math.min(Math.abs(d), 2);
      mq.style.transform = `perspective(800px) rotateY(${Math.max(-2, Math.min(2, d)) * -18}deg) scale(${1.1 - a * 0.24})`;
      mq.style.opacity = String(1 - a * 0.28);
      mq.style.zIndex = String(10 - Math.round(a * 3));
      if (Math.abs(d) < Math.abs((items[best].offsetLeft + items[best].offsetWidth / 2 - mid) / items[best].offsetWidth)) best = i;
    });
    if (best !== centred) {
      centred = best;
      const o = ring[best];
      caption.innerHTML = `
        <div class="rc-name serif">${esc(o.name)}</div>
        <div class="rc-meta">${esc(o.look)} · ${money(outfitPrice(o))} · ${o.match}% match</div>
        <div class="rc-actions">
          <button class="icon${isOutfitLiked(o) ? ' on' : ''}" data-like-outfit="${o.i}" aria-label="Like outfit">${heart(isOutfitLiked(o))}</button>
          <button class="rc-open" data-open-outfit="${o.i}">View outfit</button>
        </div>`;
    }
    ringPos = el.scrollLeft;
  };
  // First visit opens on the second outfit so there's one either side.
  el.scrollLeft = ringPos ?? (items.length > 2 ? items[1].offsetLeft + items[1].offsetWidth / 2 - el.clientWidth / 2 : 0);
  let frame = 0;
  el.addEventListener('scroll', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(paint); }, { passive: true });
  paint();
}

function openOutfit(o) {
  state.view = { tab: 'browse', look: null, outfit: { name: o.name, base: o.name, look: o.look, pieces: { ...o.pieces }, edited: false } };
  save(); render();
  window.scrollTo(0, 0);
}

function renderOutfit() {
  const o = state.view.outfit;
  const liked = isOutfitLiked(o);
  const more = OUTFITS.map((x, i) => ({ ...x, i })).filter((x) => x.look === o.look && x.name !== o.base);
  screen.innerHTML = `
    <button class="back plain" data-back-browse>‹ Browse</button>
    <section class="stage" style="--tint:${LOOKS[o.look].tint}">
      <div class="stage-fig">${avatarSVG(piecesOf(o))}</div>
    </section>
    <header class="outfit-head">
      <div class="overline">${esc(o.look)}${o.edited ? ' · Your version' : ''}</div>
      <h1 class="serif">${esc(o.base)}</h1>
      <div class="small">${money(outfitPrice(o))} · ${matchPct(o)}% match</div>
    </header>
    ${SLOTS.map((slot) => {
      const it = ITEMS[o.pieces[slot]];
      const why = reasonsFor(it.id);
      return `
        <article class="piece slim">
          <div class="piece-head">
            ${thumb(it)}
            <div class="meta">
              <div class="slot">${slot}</div>
              <div class="name">${esc(it.name)}</div>
              <div class="small">${esc(it.colour)} · ${esc(it.shop)}</div>
              ${why.length ? `<div class="small you">${esc(why[0].charAt(0).toUpperCase() + why[0].slice(1))}</div>` : ''}
            </div>
            <div class="right"><div class="price">${money(it.price)}</div></div>
          </div>
          <div class="piece-actions">
            <button class="primary" data-ochange="${slot}">Change</button>
            <button class="icon${isLiked(it.id) ? ' on' : ''}" data-like="${esc(it.id)}" aria-label="Like">${heart(isLiked(it.id))}</button>
          </div>
        </article>`;
    }).join('')}
    <div class="actions">
      <button class="btn ghost" data-like-draft>${liked ? 'Liked ✓' : 'Like'}</button>
      <button class="btn" data-wear-draft>Wear this as my ${esc(o.look)} look</button>
    </div>
    ${more.length ? `
      <h2 class="section">More ${esc(o.look)}</h2>
      <div class="more-row">${more.map((x) => `
        <button class="more" data-open-outfit="${x.i}">
          <span class="more-fig">${avatarSVG(piecesOf(x))}</span>
          <span class="small">${esc(x.name)}</span>
        </button>`).join('')}
      </div>` : ''}`;
}

function renderShop() {
  const p = state.profile;
  const pl = plan();
  const months = Math.ceil(pl.laterTotal / (MONTHLY[p.monthly] || 100));
  screen.innerHTML = `
    <header class="top">
      <div class="overline">Shopping list</div>
      <h1 class="serif">What to buy, in order.</h1>
      <p class="sub">Everything under “Buy now” fits your ${budgetLabel(p.budget)} budget. Whole looks come first, then the pieces that work hardest.</p>
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
      ${thumb(it)}
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
    ...state.ownedIds.filter((id) => ITEMS[id]).map((id) => ({ key: `id:${id}`, item: ITEMS[id], name: ITEMS[id].name, sub: `${ITEMS[id].slot} · ${ITEMS[id].colour}` })),
    ...state.ownedManual.map((o, i) => ({ key: `m:${i}`, item: o, name: o.name, sub: `${o.slot} · ${o.lanes.join(', ')}` })),
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
          ${thumb(r.item)}
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
    <h2 class="section">What you’ve asked for</h2>
    ${(state.notes || []).length ? `<section class="card">${state.notes.map((n, i) => `
      <div class="row-item">
        <div class="meta"><div class="name">“${esc(n.text)}”</div><div class="small">${esc(n.slot)} · every look</div></div>
        <button class="link" data-note-remove="${i}">Remove</button>
      </div>`).join('')}</section>` : '<p class="note">Nothing yet. Type a request on any look, like “black shoes”, and it keeps steering your picks.</p>'}
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
      ${kv('Wardrobe budget', budgetLabel(p.budget))}
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
  sheetEl.querySelector('[data-ask-sheet]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    askStylist(e.target.querySelector('input').value, sheetCtx.look, sheetCtx.slot);
  });
}

function itemHeader(it, withLike = true) {
  return `
    <div class="sheet-item">
      ${thumb(it, 'big')}
      <div class="meta">
        <div class="name">${esc(it.name)}</div>
        <div class="small">${esc(it.colour)} · ${esc(it.fit)} · ${esc(it.shop)}</div>
        <div class="price">${money(it.price)}</div>
      </div>
      ${withLike ? `<button class="icon${isLiked(it.id) ? ' on' : ''}" data-like="${esc(it.id)}" aria-label="Like">${heart(isLiked(it.id))}</button>` : ''}
    </div>`;
}

// The piece being changed: from his wardrobe, or from an outfit he's customising in Browse.
function currentPiece(ctx) {
  if (ctx.draft) {
    const id = state.view.outfit.pieces[ctx.slot];
    return { id, item: ITEMS[id] };
  }
  return plan().looks[ctx.look][ctx.slot];
}

function changeSheet(ctx) {
  const { look, slot } = ctx;
  const cur = currentPiece(ctx);
  const it = cur.item;
  const all = candidates(look, slot).filter((id) => !isExcluded(ITEMS[id]));
  const colours = all.filter((id) => ITEMS[id].family === it.family);
  const others = all.filter((id) => id !== cur.id).sort((a, b) => score(b, look) - score(a, look));
  const diff = (id) => {
    const d = ITEMS[id].price - it.price;
    return d === 0 ? 'Same price' : d < 0 ? `${money(-d)} less` : `${money(d)} more`;
  };
  return `
    <div class="overline">${slot} · ${esc(ctx.draft ? state.view.outfit.base : look)}</div>
    ${itemHeader(it)}
    <form class="ask" data-ask-sheet>
      <input type="text" id="askSheet" autocomplete="off" placeholder="Describe it: black, woody, relaxed, Zara…">
      <button class="btn" type="submit">Ask</button>
    </form>
    ${notesFor(slot).length ? `<div class="note-chips">${notesFor(slot).map((n) => `<button class="note-chip" data-note-remove="${state.notes.indexOf(n)}">“${esc(n.text)}” <span aria-hidden="true">×</span></button>`).join('')}</div>` : ''}
    <div class="quick">
      <button data-quick="cheaper">Cheaper</button>
      <button data-quick="colour"${colours.length < 2 ? ' disabled' : ''}>Different colour</button>
      <button data-quick="different">Something different</button>
    </div>
    ${colours.length > 1 ? `
      <div class="label">Colours</div>
      <div class="swatches">${colours.map((id) => `<button class="sw${id === cur.id ? ' on' : ''}" data-pick="${esc(id)}" style="background:${esc(ITEMS[id].hex)}" title="${esc(ITEMS[id].colour)}" aria-label="${esc(ITEMS[id].colour)}"></button>`).join('')}</div>` : ''}
    <div class="label">Everything that works in ${ctx.draft ? 'this outfit' : `your ${esc(look)} look`}</div>
    <div class="opt-list">${others.map((id, i) => {
      const o = ITEMS[id];
      const why = reasonsFor(id)[0];
      return `
        <div class="opt">
          <button class="opt-main" data-pick="${esc(id)}">
            ${thumb(o)}
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
        return `<div class="built-row">${thumb(it, 'sm')}<span class="meta"><span class="name">${esc(it.name)}</span><span class="small">${esc(it.colour)} · ${money(it.price)}</span></span></div>`;
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
  if (d.noteRemove) return removeNote(+d.noteRemove);
}

// ---------- Stylist requests: typed changes like "black shoes" or "woody scent" ----------
// Keyword matching over colours, brands, fits and garment types. The real build hands the text to the AI.

const STOP = new Set('a an the some something i im id want would like prefer please make it its with for me my in and or to of get give maybe bit little much very really one pair more go try'.split(' '));
const NEGATE = new Set(['no', 'not', 'without', 'never', 'less', 'avoid', 'hate', 'dont', 'nothing']);
const GENERIC = new Set(['top', 'bottoms', 'layer', 'accessory', 'shoes', 'outfit', 'look', 'piece', 'clothes', 'colour', 'color']);
const SYNONYM = {
  sneakers: 'trainers', sneaker: 'trainers', trainer: 'trainers', boot: 'boots', tshirt: 'tee', 't-shirt': 'tee', tees: 'tee',
  sweater: 'jumper', sweaters: 'jumper', knit: 'jumper', knitwear: 'jumper', jumpers: 'jumper',
  perfume: 'fragrance', cologne: 'fragrance', scent: 'fragrance', aftershave: 'fragrance', smell: 'fragrance',
  pants: 'trousers', trouser: 'trousers', slacks: 'trousers', gray: 'grey', hat: 'cap', glasses: 'sunglasses', shades: 'sunglasses',
  coat: 'jacket', jackets: 'jacket', shoe: 'shoes', footwear: 'shoes', jean: 'jeans', short: 'shorts', hoody: 'hoodie', hoodies: 'hoodie',
  woodsy: 'woody', khaki: 'beige', levis: "levi's", hm: 'h&m', ms: 'm&s', vintage: 'secondhand', used: 'secondhand', thrifted: 'secondhand',
};
const MODS = {
  cheaper: 'cheaper', cheap: 'cheaper', budget: 'cheaper', affordable: 'cheaper',
  premium: 'premium', nicer: 'premium', better: 'premium', expensive: 'premium', quality: 'premium', luxury: 'premium',
  darker: 'darker', lighter: 'lighter', brighter: 'lighter',
  slim: 'fit:Slim', fitted: 'fit:Slim', skinny: 'fit:Slim', tight: 'fit:Slim',
  relaxed: 'fit:Relaxed', baggy: 'fit:Relaxed', loose: 'fit:Relaxed', oversized: 'fit:Relaxed', wide: 'fit:Relaxed',
};
const FLIP = { cheaper: 'premium', premium: 'cheaper', darker: 'lighter', lighter: 'darker', 'fit:Slim': 'fit:Relaxed', 'fit:Relaxed': 'fit:Slim' };
const SLOT_WORDS = {
  Shoes: ['shoes', 'trainers', 'boots', 'loafers', 'chelsea', 'desert', 'runners', 'running', 'skate', 'canvas'],
  Bottom: ['trousers', 'jeans', 'chinos', 'shorts', 'joggers', 'cargo', 'cargos', 'bottoms'],
  Layer: ['jacket', 'jumper', 'blazer', 'bomber', 'overshirt', 'layer', 'cardigan', 'quarter-zip'],
  Accessory: ['watch', 'belt', 'cap', 'beanie', 'bag', 'holdall', 'fragrance', 'sunglasses', 'accessory'],
  Top: ['top', 'tee', 'shirt', 'polo', 'hoodie', 'vest', 'tank', 'oxford', 'linen'],
};
const TYPE_TAGS = {
  tee_heavy: 'tee', tee_budget: 'tee', tee_boxy: 'tee boxy', tee_train: 'tee training gym', oxford: 'shirt oxford', linen: 'shirt linen', shirt_slim: 'shirt',
  polo_knit: 'polo knitted', hoodie: 'hoodie', tank: 'vest tank', jeans: 'jeans denim', jeans_budget: 'jeans denim', chinos: 'chinos trousers',
  tailored: 'trousers tailored smart', pleated: 'trousers pleated smart', cargo: 'cargo cargos trousers', shorts_train: 'shorts training', shorts_chino: 'shorts chino',
  joggers: 'joggers trousers', trainers: 'trainers shoes', trainers_premium: 'trainers shoes premium', loafers: 'loafers shoes', chelsea: 'boots chelsea shoes',
  desert: 'boots desert shoes suede', skate: 'shoes trainers skate canvas', canvas: 'shoes trainers canvas', runners: 'shoes trainers running runners',
  overshirt: 'overshirt jacket', denim_jacket: 'jacket denim', merino: 'jumper merino', cable: 'jumper cable', knit_qzip: 'jumper zip quarter-zip',
  qzip: 'zip quarter-zip training', blazer: 'blazer jacket', bomber: 'bomber jacket', zip_hoodie: 'hoodie zip', watch_steel: 'watch steel metal',
  watch_leather: 'watch leather', belt: 'belt leather', cap: 'cap', beanie: 'beanie', holdall: 'bag holdall', scent: 'fragrance', sunglasses: 'sunglasses',
};
const COLOUR_TAGS = {
  navy: 'blue', 'dark indigo': 'blue', 'light blue': 'blue', 'mid blue': 'blue', 'light wash': 'blue', olive: 'green', sage: 'green',
  tan: 'brown', camel: 'brown', 'washed brown': 'brown', 'brown suede': 'brown', stone: 'beige', sand: 'beige', cream: 'beige', 'off-white': 'white',
  charcoal: 'grey', 'grey marl': 'grey', silver: 'grey', tortoise: 'brown', 'pale pink': 'pink',
};

const wordCache = new Map();
let vocab = null;

function itemWords(it) {
  if (wordCache.has(it.id)) return wordCache.get(it.id);
  const lum = artLum(it.hex);
  const txt = [it.name, it.colour, it.fit, it.shop, TYPE_TAGS[it.family] || '', COLOUR_TAGS[it.colour.toLowerCase()] || '',
    lum < 0.3 ? 'dark' : lum > 0.72 ? 'light' : '', /vinted/i.test(it.shop) ? 'secondhand vinted' : ''].join(' ').toLowerCase();
  const words = new Set(txt.replace(/[’']/g, '').replace(/[^a-z&\- ]/g, ' ').split(/\s+/).filter(Boolean));
  wordCache.set(it.id, words);
  return words;
}

function parseRequest(text) {
  vocab ||= new Set([...Object.values(ITEMS).flatMap((it) => [...itemWords(it)]), ...Object.values(SLOT_WORDS).flat()]);
  const req = { want: [], avoid: [], mods: new Set() };
  let neg = false;
  text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9&\- ]/g, ' ').split(/\s+/).filter(Boolean).forEach((w0) => {
    if (NEGATE.has(w0)) { neg = true; return; }
    if (STOP.has(w0)) return;
    let w = (SYNONYM[w0] || w0).replace(/[’']/g, '');
    if (!vocab.has(w) && w.endsWith('s') && vocab.has(w.slice(0, -1))) w = w.slice(0, -1);
    else if (!vocab.has(w) && vocab.has(`${w}s`)) w = `${w}s`;
    const mod = MODS[w];
    if (mod) req.mods.add(neg ? FLIP[mod] : mod);
    else if (vocab.has(w)) (neg ? req.avoid : req.want).push(w);
    neg = false;
  });
  return req;
}

function detectSlot(req) {
  const named = Object.keys(SLOT_WORDS).find((slot) => req.want.some((w) => SLOT_WORDS[slot].includes(w)));
  if (named) return named;
  // A word that only ever appears in one slot ("woody" is only a fragrance) points at that slot.
  const hit = SLOTS.filter((slot) => Object.values(ITEMS).some((it) => it.slot === slot && req.want.some((w) => itemWords(it).has(w))));
  return hit.length === 1 ? hit[0] : null;
}

function matchRequest(look, slot, req, curId) {
  const cur = curId ? ITEMS[curId] : null;
  const ranked = candidates(look, slot).map((id) => {
    const it = ITEMS[id];
    const words = itemWords(it);
    let m = 0;
    let hits = 0;
    req.want.forEach((w) => { if (words.has(w)) { m += 3; hits++; } });
    req.avoid.forEach((w) => { if (words.has(w)) m -= 6; });
    if (cur && req.mods.has('cheaper')) m += it.price < cur.price ? 2 + (cur.price - it.price) / 20 : -3;
    if (cur && req.mods.has('premium')) m += it.price > cur.price ? 2 + (it.price - cur.price) / 30 : -3;
    if (cur && req.mods.has('darker')) m += (artLum(cur.hex) - artLum(it.hex)) * 8;
    if (cur && req.mods.has('lighter')) m += (artLum(it.hex) - artLum(cur.hex)) * 8;
    if (req.mods.has('fit:Slim')) m += fitOf(it) === 'Slim' ? 2 : -1;
    if (req.mods.has('fit:Relaxed')) m += fitOf(it) === 'Relaxed' ? 2 : -1;
    if (!req.want.length && req.avoid.length && id !== curId) m += 1;
    if (isExcluded(it) && !hits) m -= 5;
    return { id, m, hits, s: score(id, look) };
  }).filter((x) => x.m > 0 && (!req.want.length || x.hits > 0));
  ranked.sort((a, b) => b.hits - a.hits || b.m - a.m || b.s - a.s);
  return ranked[0]?.id || null;
}

const notesFor = (slot) => (state.notes || []).filter((n) => n.slot === slot);

function noteBonus(it) {
  let s = 0;
  notesFor(it.slot).forEach((n) => {
    const words = itemWords(it);
    n.want.forEach((w) => { if (words.has(w)) s += 1.5; });
    n.avoid.forEach((w) => { if (words.has(w)) s -= 3; });
  });
  return s;
}

function askedFor(it) {
  const n = notesFor(it.slot).find((x) => x.want.length && x.want.every((w) => itemWords(it).has(w)));
  return n ? n.text : '';
}

function saveNote(slot, text, want, avoid) {
  if (!want.length && !avoid.length) return;
  state.notes = (state.notes || []).filter((n) => !(n.slot === slot && n.text.toLowerCase() === text.toLowerCase()));
  state.notes.push({ slot, text, want, avoid });
  if (state.notes.length > 12) state.notes.shift();
  state.signals.n++;
}

function removeNote(i) {
  state.notes.splice(i, 1);
  touch(); save(); refresh();
}

function askStylist(text, look, slot) {
  const q = text.trim();
  if (!q) return;
  const req = parseRequest(q);
  const target = slot || detectSlot(req);
  if (!target) { toast('Say which piece, e.g. “black shoes” or “woody scent”'); return; }
  const want = req.want.filter((w) => !GENERIC.has(w));
  if (!want.length && !req.avoid.length && !req.mods.size) { toast('Didn’t catch that. Try a colour, brand, fit or type of clothing.'); return; }
  const cur = currentPiece({ look, slot: target, draft: !!sheetCtx?.draft });
  const id = matchRequest(look, target, { ...req, want }, cur.id);
  saveNote(target, q, want, req.avoid);
  if (!id || id === cur.id) {
    touch(); save(); refresh();
    toast(id ? 'That’s already what you’ve got. Saved it for next time.' : `Nothing in your ${look} look matches “${q}” yet. Saved it for next time.`);
    return;
  }
  pick(look, target, id, `Swapped to ${ITEMS[id].colour.toLowerCase()} ${ITEMS[id].name.toLowerCase()} for “${q}”`);
}

// ---------- Actions ----------

function refresh() {
  render();
  renderSheet();
}

function pick(look, slot, id, msg) {
  const draftMode = sheetCtx?.draft;
  const cur = currentPiece({ look, slot, draft: draftMode });
  if (cur.id && cur.id !== id) state.signals.away[cur.id] = (state.signals.away[cur.id] || 0) + 1;
  state.signals.n++;
  if (draftMode) {
    const o = state.view.outfit;
    o.pieces[slot] = id;
    o.edited = true;
    o.name = `${o.base} (your version)`;
  } else {
    (state.picks[look] ||= {})[slot] = id;
  }
  touch(); save(); closeSheet(); render();
  toast(msg || `Swapped to ${ITEMS[id].colour.toLowerCase()} ${ITEMS[id].name.toLowerCase()}`);
}

function quick(kind) {
  const { look, slot } = sheetCtx;
  const cur = currentPiece(sheetCtx).item;
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

function renderWelcome() {
  setFunnel(true);
  const model = { height: '', flags: [], chest: '', waist: '' };
  const fig = (name) => mannequinSVG(model, piecesOf(OUTFITS.find((o) => o.name === name)));
  screen.innerHTML = `
    <div class="welcome">
      <div class="brand"><span>Style, Decided</span><small>Beta</small></div>
      <div class="stage">
        <div class="fig-s">${fig('Weekend Earth Tones')}</div>
        <div class="fig-c">${fig('Dinner Out')}</div>
        <div class="fig-s">${fig('Quiet Luxury')}</div>
      </div>
      <h1 class="serif">Know exactly what to wear.</h1>
      <p class="lede">Tell us your build, your week and your budget. You get one clear wardrobe back: every outfit, what to buy first, and why each piece works on you.</p>
      <ul class="promise">
        <li><span><b>Cut for your frame</b>Picked for your height and shape, not a model’s.</span></li>
        <li><span><b>Everything goes together</b>Each piece is chosen to work with the rest, so nothing sits unworn.</span></li>
        <li><span><b>Inside your budget</b>What to buy now, and roughly when you’ll have the rest.</span></li>
      </ul>
      <button class="btn" id="start">Start my wardrobe</button>
      <p class="fine">Takes about 3 minutes. Your first look is free.</p>
    </div>`;
  screen.querySelector('#start').onclick = () => { startOnboarding(); window.scrollTo(0, 0); };
}

function renderPreview() {
  setFunnel(true);
  const p = state.profile;
  const pl = plan();
  const [free, ...rest] = p.lanes;
  const pieces = pl.looks[free];
  const flag = buildFlag(p);
  const left = pl.remaining(free);
  const row = (slot) => {
    const it = pieces[slot].item;
    const mine = reasonsFor(it.id);
    const fitNote = flag && flag !== 'Average' ? BUILD_NOTES[flag]?.[slot] : '';
    return `
      <div class="free-row">
        ${thumb(it)}
        <div class="meta">
          <div class="slot">${slot}</div>
          <div class="name">${esc(it.name)}</div>
          <div class="small">${esc(it.colour)} · ${esc(it.shop)}</div>
          ${it.why ? `<p class="why">${esc(it.why)}</p>` : ''}
          ${fitNote ? `<p class="why fit">For your build: ${esc(fitNote)}</p>` : ''}
          ${mine.length ? `<p class="why fit">Picked for you: ${esc(mine.join(', '))}.</p>` : ''}
        </div>
        <div class="price">${pieces[slot].owned ? 'Owned' : money(it.price)}</div>
      </div>`;
  };
  screen.innerHTML = `
    <div class="preview">
      <div class="overline">${p.name ? `${esc(p.name)}’s wardrobe` : 'Your wardrobe'}</div>
      <h1 class="serif">${plural(p.lanes.length, 'look')}, ${plural(pl.pieceCount, 'piece')}, built around ${budgetLabel(p.budget)}.</h1>
      <div class="stats">
        <div><span class="k">Ready now</span><span class="v">${pl.ready.length}/${p.lanes.length}</span></div>
        <div><span class="k">Buy now</span><span class="v">${money(pl.spent)}</span></div>
        <div><span class="k">Shared</span><span class="v">${pl.shared}</span></div>
      </div>

      <h2 class="section">Your first look, free</h2>
      <section class="free-look" style="--tint:${LOOKS[free].tint}">
        <div class="free-head">
          <div class="look-fig">${avatarSVG(pieces)}</div>
          <div>
            <div class="overline">Look 1 of ${p.lanes.length}</div>
            <h3 class="serif">${esc(free)}</h3>
            <p>${esc(LOOKS[free].tagline)}</p>
            <span class="pill${left === 0 ? ' ok' : ''}">${left === 0 ? 'Fits your budget' : `${money(left)} more to finish`}</span>
          </div>
        </div>
        ${SLOTS.map(row).join('')}
      </section>

      <h2 class="section">Also built for you</h2>
      ${rest.length ? `<div class="grid">${rest.map((l) => `
        <button class="tile locked" data-locked style="--tint:${LOOKS[l].tint}">
          <div class="tile-head"><span class="tile-name serif">${esc(l)}</span><span class="lock">${LOCK}</span></div>
          <div class="tile-fig">${avatarSVG(pl.looks[l])}</div>
          <div class="tile-tag">${esc(LOOKS[l].tagline)}</div>
        </button>`).join('')}</div>` : ''}
      <button class="locked-row" data-locked>
        <span><b>Your shopping list</b><span class="small">In the order to buy, inside ${budgetLabel(p.budget)}</span></span>
        <span class="lock">${LOCK}</span>
      </button>
      <button class="locked-row" data-locked>
        <span><b>Your build guide</b><span class="small">What works on your frame, and what to avoid</span></span>
        <span class="lock">${LOCK}</span>
      </button>

      <section class="offer">
        <div class="overline">The full plan</div>
        <div class="offer-price"><span class="serif">£${PRICE}</span><span>one-off. No subscription.</span></div>
        <ul class="includes">
          <li>All ${plural(p.lanes.length, 'look')}, piece by piece, with why each one works on you</li>
          <li>Your shopping list in the order to buy, inside ${budgetLabel(p.budget)}</li>
          <li>Swap anything: cheaper, another colour, something different</li>
          <li>Your build guide, plus picks that learn from what you like</li>
        </ul>
        <button class="btn" id="buy">Get my full wardrobe</button>
        <p class="fine">A personal stylist usually charges £150 or more for a single session.</p>
      </section>
      <button class="link-quiet" id="reset">Start again</button>
    </div>`;
}

function renderCheckout() {
  setFunnel(true);
  const p = state.profile;
  const pl = plan();
  const first = p.lanes[0];
  screen.innerHTML = `
    <div class="checkout">
      <button class="back plain" id="checkoutBack">‹ Back</button>
      <div class="overline" style="margin-top:22px">Checkout</div>
      <h1 class="serif">Your full wardrobe plan</h1>
      <section class="order">
        <div class="order-item">
          <div class="order-fig" style="--tint:${LOOKS[first].tint}">${avatarSVG(pl.looks[first])}</div>
          <div class="meta">
            <div class="name">Full wardrobe plan</div>
            <div class="small">${plural(p.lanes.length, 'look')} · ${plural(pl.pieceCount, 'piece')} · build guide</div>
          </div>
          <div class="price">£${PRICE}.00</div>
        </div>
        <div class="order-line"><span>Subscription</span><span>None</span></div>
        <div class="order-total"><span>Total today</span><span class="serif">£${PRICE}.00</span></div>
      </section>
      ${p.email ? `<p class="for">Plan for <b>${esc(p.email)}</b></p>` : ''}
      <button class="btn" id="pay">Pay £${PRICE}</button>
      <p class="fine">One payment. No subscription. Access straight away.</p>
    </div>`;
}

// Fake door: logs the click as buying intent, takes no payment, then opens the plan.
function pay() {
  const p = state.profile;
  record('checkout-clicks', {
    name: p.name || '', email: p.email || '', price: `£${PRICE}`, looks: p.lanes.join(', '), budget: budgetLabel(p.budget),
  });
  screen.innerHTML = `
    <div class="reveal">
      <div class="seal">✓</div>
      <h1 class="serif">You’re early.</h1>
      <p class="lede">Payments aren’t switched on yet, so you haven’t been charged. You’re one of the first people to try this, so the full wardrobe is yours free while we test it.</p>
      <button class="btn" id="enter">See my full wardrobe</button>
    </div>`;
  window.scrollTo(0, 0);
}

function render() {
  if (!state.profile) return renderWelcome();
  if (!state.unlocked) return state.view.checkout ? renderCheckout() : renderPreview();
  setFunnel(false);
  const v = state.view;
  tabs.classList.remove('hidden');
  tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === v.tab));
  if (v.tab === 'home' && v.look && state.profile.lanes.includes(v.look)) return renderLook(v.look);
  if (v.tab === 'browse' && v.outfit) return renderOutfit();
  ({ home: renderHome, browse: renderBrowse, shop: renderShop, owned: renderOwned, you: renderYou }[v.tab] || renderHome)();
}

function go(tab, look = null) {
  if (tab === 'browse') { browseOrder = null; ringPos = null; }
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
  if (d.openOutfit) return openOutfit(OUTFITS[+d.openOutfit]);
  if ('backBrowse' in d) { state.view = { tab: 'browse', look: null }; save(); render(); return; }
  if (d.ochange) return openSheet({ type: 'change', look: state.view.outfit.look, slot: d.ochange, draft: true });
  if ('likeDraft' in d) return toggleOutfitLike(state.view.outfit);
  if ('wearDraft' in d) return applyOutfit(state.view.outfit);
  if (d.likeOutfit) return toggleOutfitLike(OUTFITS[+d.likeOutfit]);
  if (d.blook) { browseLook = d.blook; ringPos = null; return render(); }
  if (d.bslot) { browseSlot = d.bslot; return render(); }
  if (d.remove) return removeOwned(d.remove);
  if (d.noteRemove) return removeNote(+d.noteRemove);
  if (t.id === 'addBtn') return addOwned();
  if (t.id === 'redo') return startOnboarding();
  if (t.id === 'reset') { state = blank(); touch(); save(); render(); window.scrollTo(0, 0); return; }
  if (t.id === 'buy' || 'locked' in d) { state.view = { tab: 'home', look: null, checkout: true }; save(); render(); window.scrollTo(0, 0); return; }
  if (t.id === 'checkoutBack') { state.view = { tab: 'home', look: null }; save(); render(); return; }
  if (t.id === 'pay') return pay();
  if (t.id === 'enter') { state.unlocked = true; state.view = { tab: 'home', look: null }; save(); render(); window.scrollTo(0, 0); }
});

screen.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-ask-look]');
  if (!f) return;
  e.preventDefault();
  askStylist(f.querySelector('input').value, f.dataset.askLook, null);
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

render();

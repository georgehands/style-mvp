// Illustrated product shots and a build-matched mannequin: stand-ins for retailer photos and a real try-on model.

let artUid = 0;

const GARMENT = {
  tee_heavy: { kind: 'tee' },
  tee_budget: { kind: 'tee' },
  tee_boxy: { kind: 'tee', boxy: true },
  tee_train: { kind: 'tee', athletic: true },
  oxford: { kind: 'shirt', pocket: true },
  linen: { kind: 'shirt', relaxed: true },
  shirt_slim: { kind: 'shirt', rolled: true },
  polo_knit: { kind: 'polo' },
  hoodie: { kind: 'hoodie' },
  tank: { kind: 'tank' },
  jeans: { kind: 'trousers', denim: true },
  jeans_budget: { kind: 'trousers', denim: true },
  chinos: { kind: 'trousers', taper: true, slant: true },
  tailored: { kind: 'trousers', taper: true, crease: true, slant: true },
  pleated: { kind: 'trousers', wide: true, pleats: true, crease: true },
  cargo: { kind: 'trousers', wide: true, cargo: true },
  joggers: { kind: 'trousers', taper: true, cuffs: true },
  shorts_train: { kind: 'shorts', athletic: true },
  shorts_chino: { kind: 'shorts', slant: true },
  trainers: { kind: 'shoe', style: 'trainer' },
  trainers_premium: { kind: 'shoe', style: 'trainer', clean: true },
  loafers: { kind: 'shoe', style: 'loafer' },
  chelsea: { kind: 'shoe', style: 'chelsea' },
  desert: { kind: 'shoe', style: 'desert' },
  skate: { kind: 'shoe', style: 'skate' },
  canvas: { kind: 'shoe', style: 'canvas' },
  runners: { kind: 'shoe', style: 'runner' },
  overshirt: { kind: 'jacket', collar: true, pockets: true, hem: 'long', open: 0.34 },
  denim_jacket: { kind: 'jacket', collar: true, pockets: true, denim: true, hem: 'crop', open: 0.3 },
  blazer: { kind: 'jacket', lapels: true, hem: 'blazer' },
  bomber: { kind: 'jacket', rib: true, zip: true, hem: 'crop', open: 0.14 },
  zip_hoodie: { kind: 'jacket', hood: true, zip: true, hem: 'mid', open: 0.12 },
  merino: { kind: 'knit' },
  cable: { kind: 'knit', cable: true },
  knit_qzip: { kind: 'knit', zip: true },
  qzip: { kind: 'knit', zip: true, athletic: true },
  watch_steel: { kind: 'watch' },
  watch_leather: { kind: 'watch', leather: true },
  belt: { kind: 'belt' },
  cap: { kind: 'cap' },
  beanie: { kind: 'beanie' },
  holdall: { kind: 'bag' },
  scent: { kind: 'scent' },
  sunglasses: { kind: 'glasses' },
};

const FALLBACK_GARMENT = { Top: { kind: 'tee' }, Bottom: { kind: 'trousers' }, Shoes: { kind: 'shoe', style: 'trainer' }, Layer: { kind: 'jacket', collar: true, hem: 'long', open: 0.3 }, Accessory: { kind: 'none' } };
const garmentOf = (it) => GARMENT[it.family] || FALLBACK_GARMENT[it.slot] || { kind: 'none' };

// ---------- Colour and path helpers ----------

const artMix = (hex, target, t) => {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex(...a.map((v, i) => v + (b[i] - v) * t));
};
const artDark = (hex, t = 0.2) => artMix(hex, '#000000', t);
const artLight = (hex, t = 0.2) => artMix(hex, '#ffffff', t);
const artLum = (hex) => {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};
const seam = (hex) => (artLum(hex) < 0.28 ? artLight(hex, 0.2) : artDark(hex, 0.22));
const pt = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;
const mirrorX = (x) => 200 - x;

function artDefs(u) {
  return `<defs>
    <linearGradient id="h${u}" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".24"/>
      <stop offset=".3" stop-color="#000" stop-opacity="0"/>
      <stop offset=".6" stop-color="#fff" stop-opacity=".08"/>
      <stop offset="1" stop-color="#000" stop-opacity=".28"/>
    </linearGradient>
    <linearGradient id="v${u}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".12"/>
      <stop offset=".55" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".16"/>
    </linearGradient>
  </defs>`;
}

// A filled shape with cylindrical shading and a hairline edge.
function sh(d, fill, u, edge = true) {
  return `<path d="${d}" fill="${fill}"${edge ? ` stroke="${artDark(fill, 0.35)}" stroke-opacity=".55" stroke-width=".8" stroke-linejoin="round"` : ''}/>`
    + `<path d="${d}" fill="url(#h${u})"/><path d="${d}" fill="url(#v${u})"/>`;
}
const line = (d, col, w = 1, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const dot = (x, y, r, col) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${col}"/>`;

// Tapered limb through three centre points.
function limb(c0, c1, c2, w0, w1, w2) {
  return `M${pt(c0[0] - w0 / 2, c0[1])} Q${pt(c1[0] - w1 / 2, c1[1])} ${pt(c2[0] - w2 / 2, c2[1])} `
    + `L${pt(c2[0] + w2 / 2, c2[1])} Q${pt(c1[0] + w1 / 2, c1[1])} ${pt(c0[0] + w0 / 2, c0[1])} Z`;
}

// ---------- Product shots (flat lay / side profile, 200 x 200) ----------

function productSVG(it) {
  const g = garmentOf(it);
  const u = ++artUid;
  const c = it.hex;
  const s = seam(c);
  const draw = PRODUCT[g.kind] || PRODUCT.none;
  return `<svg viewBox="0 0 200 200" aria-hidden="true">${artDefs(u)}${draw(c, s, g, u)}</svg>`;
}

const PRODUCT = {
  none: (c, s, g, u) => sh('M60 60 h80 v80 h-80 z', c, u),

  tee(c, s, g, u) {
    const w = g.boxy ? 50 : g.athletic ? 36 : 41;
    const hem = g.boxy ? 158 : 170;
    const L = 100 - w;
    const R = 100 + w;
    const d = `M${L} 44 L82 31 Q100 44 118 31 L${R} 44 L${R + 26} 72 L${R + 10} 88 L${R} 78 L${R} ${hem} L${L} ${hem} L${L} 78 L${L - 10} 88 L${L - 26} 72 Z`;
    return sh(d, c, u)
      + line('M82 31 Q100 50 118 31', s, 3)
      + line(`M${L + 4} ${hem - 6} L${R - 4} ${hem - 6}`, s, 1, 'stroke-dasharray="3 3" opacity=".7"')
      + line(`M${L - 13} 83 L${L - 2} 72`, s, 1, 'opacity=".7"') + line(`M${R + 13} 83 L${R + 2} 72`, s, 1, 'opacity=".7"')
      + (g.athletic ? line(`M86 36 L${L} 76`, s, 1.2) + line(`M114 36 L${R} 76`, s, 1.2) : '');
  },

  tank(c, s, g, u) {
    const d = 'M74 28 Q100 62 126 28 L134 28 Q132 72 144 88 L144 170 L56 170 L56 88 Q68 72 66 28 Z';
    return sh(d, c, u) + line('M74 28 Q100 62 126 28', s, 2.5) + line('M60 164 L140 164', s, 1, 'stroke-dasharray="3 3"');
  },

  shirt(c, s, g, u) {
    const w = g.relaxed ? 44 : 40;
    const L = 100 - w;
    const R = 100 + w;
    const cuffY = g.rolled ? 118 : 156;
    const d = `M${L} 42 L84 30 L100 40 L116 30 L${R} 42 L${R + 10} 60 L${R + 20} ${cuffY} L${R + 6} ${cuffY + 4} L${R} 86 L${R} 174 L${L} 174 L${L} 86 L${L - 6} ${cuffY + 4} L${L - 20} ${cuffY} L${L - 10} 60 Z`;
    const collar = sh('M84 30 L100 40 L91 54 L79 38 Z', artLight(c, 0.05), u) + sh('M116 30 L100 40 L109 54 L121 38 Z', artLight(c, 0.05), u);
    const buttons = [62, 84, 106, 128, 150].map((y) => dot(100, y, 2, s)).join('');
    return sh(d, c, u) + collar + line('M100 40 L100 174', s, 1.2) + buttons
      + (g.pocket ? line('M110 66 L130 66 L130 88 L110 88 Z', s, 1) : '')
      + line(`M${L - 19} ${cuffY - 8} L${L - 6} ${cuffY - 4}`, s, g.rolled ? 3 : 1.2)
      + line(`M${R + 19} ${cuffY - 8} L${R + 6} ${cuffY - 4}`, s, g.rolled ? 3 : 1.2);
  },

  polo(c, s, g, u) {
    return PRODUCT.tee(c, s, { athletic: false }, u)
      + sh('M84 31 L100 42 L92 52 L78 37 Z', artLight(c, 0.06), u) + sh('M116 31 L100 42 L108 52 L122 37 Z', artLight(c, 0.06), u)
      + line('M100 42 L100 72', s, 1.2) + dot(100, 54, 2, s) + dot(100, 66, 2, s)
      + [70, 84, 116, 130].map((x) => line(`M${x} 60 L${x} 160`, s, 0.6, 'opacity=".35"')).join('')
      + sh('M59 158 L141 158 L141 170 L59 170 Z', artDark(c, 0.06), u, false);
  },

  hoodie(c, s, g, u) {
    const hood = sh('M74 36 Q100 0 126 36 Q100 50 74 36 Z', artDark(c, 0.12), u);
    return hood + sh('M56 42 L84 30 Q100 44 116 30 L144 42 L154 60 L164 156 L150 160 L144 86 L144 174 L56 174 L56 86 L50 160 L36 156 L46 60 Z', c, u)
      + line('M84 30 Q100 50 116 30', s, 2.5)
      + line('M72 124 L128 124 L136 152 L64 152 Z', s, 1.2)
      + line('M94 44 L92 74', s, 1.4) + line('M106 44 L108 74', s, 1.4)
      + sh('M56 164 L144 164 L144 174 L56 174 Z', artDark(c, 0.08), u, false);
  },

  trousers(c, s, g, u) {
    const hemL = g.wide ? 52 : g.taper ? 70 : 63;
    const hemI = g.wide ? 97 : g.taper ? 92 : 95;
    const hipOut = g.wide ? 58 : 62;
    const d = `M62 26 L138 26 L${mirrorX(hipOut)} 92 L${mirrorX(hemL)} 188 L${mirrorX(hemI)} 188 L100 98 L${hemI} 188 L${hemL} 188 L${hipOut} 92 Z`;
    const denimStitch = g.denim ? '#c9a45a' : s;
    let out = sh(d, c, u) + line('M62 37 L138 37', s, 1.2)
      + [72, 100, 128].map((x) => line(`M${x} 26 L${x} 37`, s, 2)).join('')
      + line('M100 37 Q97 66 101 88', denimStitch, 1.2, g.denim ? 'stroke-dasharray="2.5 2"' : '');
    if (g.denim) out += line('M66 40 Q82 58 88 38', denimStitch, 1.2, 'stroke-dasharray="2.5 2"') + line('M134 40 Q118 58 112 38', denimStitch, 1.2, 'stroke-dasharray="2.5 2"');
    if (g.slant) out += line('M68 38 L78 62', s, 1.2) + line('M132 38 L122 62', s, 1.2);
    if (g.crease) out += line(`M80 64 L${(hemL + hemI) / 2} 186`, s, 0.8, 'opacity=".6"') + line(`M120 64 L${mirrorX((hemL + hemI) / 2)} 186`, s, 0.8, 'opacity=".6"');
    if (g.pleats) out += line('M84 37 L84 56', s, 1) + line('M116 37 L116 56', s, 1);
    if (g.cargo) out += line('M54 112 L74 112 L74 140 L54 140 Z', s, 1.2) + line('M54 118 L74 118', s, 1) + line('M146 112 L126 112 L126 140 L146 140 Z', s, 1.2) + line('M146 118 L126 118', s, 1);
    if (g.cuffs) out += sh(`M${hemL - 1} 176 L${hemI + 1} 176 L${hemI} 188 L${hemL} 188 Z`, artDark(c, 0.08), u, false) + sh(`M${mirrorX(hemL - 1)} 176 L${mirrorX(hemI + 1)} 176 L${mirrorX(hemI)} 188 L${mirrorX(hemL)} 188 Z`, artDark(c, 0.08), u, false) + line('M92 37 L90 54', '#f2efe8', 1.2) + line('M108 37 L110 54', '#f2efe8', 1.2);
    return out;
  },

  shorts(c, s, g, u) {
    const d = 'M60 44 L140 44 L150 132 L104 136 L100 108 L96 136 L50 132 Z';
    return sh(d, c, u) + line('M60 55 L140 55', s, 1.2) + line('M100 55 L100 100', s, 1)
      + line('M54 124 L96 127', s, 1, 'stroke-dasharray="3 3"') + line('M146 124 L104 127', s, 1, 'stroke-dasharray="3 3"')
      + (g.slant ? line('M66 56 L76 78', s, 1.2) + line('M134 56 L124 78', s, 1.2) : '')
      + (g.athletic ? line('M92 55 L90 70', '#f2efe8', 1.2) + line('M108 55 L110 70', '#f2efe8', 1.2) : '');
  },

  shoe(c, s, g, u) {
    const st = g.style;
    const light = artLum(c) > 0.8;
    const rubber = light ? '#d9d5cc' : '#f1eee7';
    if (st === 'loafer') {
      return sh('M26 140 Q24 110 50 104 L80 102 Q100 86 130 88 Q166 92 180 124 L180 140 Z', c, u)
        + sh('M22 140 L184 140 L182 150 Q100 154 26 150 Z', artDark(c, 0.4), u, false)
        + line('M84 104 Q108 120 150 98', s, 2.2) + line('M100 110 L126 104', artDark(c, 0.25), 4) + line('M34 112 Q54 104 80 104', s, 1, 'opacity=".6"');
    }
    if (st === 'chelsea' || st === 'desert') {
      const sole = st === 'desert' ? '#cdb98f' : artDark(c, 0.45);
      return sh('M40 140 L40 52 Q42 42 58 42 L96 42 Q102 42 102 52 L104 98 Q146 100 174 118 Q180 126 178 140 Z', c, u)
        + sh(`M36 140 L182 140 Q182 150 172 152 L42 152 Q34 150 36 140 Z`, sole, u, false)
        + (st === 'chelsea'
          ? sh('M78 46 L98 46 L100 96 L80 96 Z', artDark(c, 0.18), u, false) + line('M84 50 L86 92 M90 50 L92 92', artDark(c, 0.3), 0.8) + line('M44 42 Q46 30 56 32', s, 3)
          : line('M100 60 L118 100 M96 72 L112 104', s, 1.5) + dot(106, 76, 2, s) + dot(112, 90, 2, s));
    }
    const runner = st === 'runner';
    const canvas = st === 'canvas';
    const soleH = runner ? 20 : canvas ? 16 : 12;
    let out = sh('M26 132 Q26 96 62 92 L100 84 Q118 68 142 70 Q172 76 178 112 L178 132 Z', c, u)
      + sh(`M22 132 L182 132 Q184 ${132 + soleH} 170 ${132 + soleH + 2} L34 ${132 + soleH + 2} Q20 ${132 + soleH} 22 132 Z`, rubber, u);
    if (!g.clean) out += line('M104 88 L118 100 M112 82 L126 94 M120 78 L134 88', s, 1.6);
    if (canvas) out += sh('M158 112 Q178 114 180 132 L150 132 Q150 118 158 112 Z', rubber, u, false) + line('M26 140 L178 140', artDark(rubber, 0.3), 1.2);
    if (runner) out += line('M30 146 Q60 138 90 146 T150 146 T178 142', artDark(rubber, 0.25), 1.2) + line('M50 104 L96 96 M56 116 L110 104', s, 0.8, 'opacity=".6"');
    if (st === 'skate') out += line('M60 118 Q96 96 128 104 Q110 116 84 124', artLight(c, 0.7), 3);
    if (st === 'trainer' && !g.clean) out += line('M40 120 L150 110', s, 0.8, 'opacity=".5"');
    return out;
  },

  jacket(c, s, g, u) {
    const hem = g.hem === 'crop' ? 150 : g.hem === 'blazer' ? 182 : g.hem === 'mid' ? 164 : 172;
    const body = `M56 42 L84 30 L100 40 L116 30 L144 42 L154 60 L166 156 L150 160 L144 88 L144 ${hem} L56 ${hem} L56 88 L50 160 L34 156 L46 60 Z`;
    let out = (g.hood ? sh('M74 36 Q100 2 126 36 Q100 50 74 36 Z', artDark(c, 0.12), u) : '') + sh(body, c, u) + line(`M100 40 L100 ${hem}`, s, 1.4);
    if (g.collar) out += sh('M84 30 L100 40 L90 58 L74 40 Z', artLight(c, 0.05), u) + sh('M116 30 L100 40 L110 58 L126 40 Z', artLight(c, 0.05), u);
    if (g.lapels) out += sh('M84 30 L100 118 L100 118 L76 70 L68 60 Z', artLight(c, 0.06), u) + sh('M116 30 L100 118 L124 70 L132 60 Z', artLight(c, 0.06), u) + dot(104, 128, 2.6, s) + dot(104, 150, 2.6, s) + line('M64 146 L86 146 M136 146 L114 146', s, 1.4);
    if (g.pockets) {
      const st = g.denim ? '#c9a45a' : s;
      out += line('M64 66 L90 66 L90 90 L64 90 Z', st, 1.1, g.denim ? 'stroke-dasharray="2.5 2"' : '') + line('M64 74 L90 74', st, 1.1)
        + line('M136 66 L110 66 L110 90 L136 90 Z', st, 1.1, g.denim ? 'stroke-dasharray="2.5 2"' : '') + line('M136 74 L110 74', st, 1.1);
      out += [58, 84, 110, 136].filter((y) => y < hem - 6).map((y) => dot(104, y, 2, s)).join('');
    }
    if (g.rib) out += sh('M82 28 Q100 46 118 28 L120 36 Q100 54 80 36 Z', artDark(c, 0.15), u, false) + sh(`M56 ${hem - 12} L144 ${hem - 12} L144 ${hem} L56 ${hem} Z`, artDark(c, 0.15), u, false) + line('M100 40 L100 150', '#c9ccd0', 1.6);
    if (g.zip && !g.rib) out += line(`M100 40 L100 ${hem}`, '#c9ccd0', 1.6) + line('M70 124 L86 124 M130 124 L114 124', s, 1.2);
    return out;
  },

  knit(c, s, g, u) {
    const body = 'M56 44 L84 32 Q100 44 116 32 L144 44 L154 62 L164 156 L150 160 L144 88 L144 172 L56 172 L56 88 L50 160 L36 156 L46 62 Z';
    let out = sh(body, c, u)
      + sh('M58 160 L142 160 L142 172 L58 172 Z', artDark(c, 0.08), u, false)
      + sh('M36 148 L50 150 L50 160 L36 156 Z', artDark(c, 0.08), u, false) + sh('M164 148 L150 150 L150 160 L164 156 Z', artDark(c, 0.08), u, false);
    if (g.zip) out += sh('M82 22 L118 22 L116 38 Q100 44 84 38 Z', artDark(c, 0.06), u) + line('M100 22 L100 74', '#c9ccd0', 1.8) + `<rect x="97" y="72" width="6" height="9" rx="1.5" fill="#c9ccd0"/>`;
    else out += line('M84 32 Q100 50 116 32', artDark(c, 0.12), 4);
    if (g.cable) out += [76, 100, 124].map((x) => line(`M${x} 60 q6 8 0 16 q-6 8 0 16 q6 8 0 16 q-6 8 0 16 q6 8 0 16 q-6 8 0 16`, s, 1.8, 'opacity=".75"') + line(`M${x} 60 q-6 8 0 16 q6 8 0 16 q-6 8 0 16 q6 8 0 16 q-6 8 0 16 q6 8 0 16`, s, 1.8, 'opacity=".75"')).join('');
    else out += [70, 84, 116, 130].map((x) => line(`M${x} 62 L${x} 158`, s, 0.6, 'opacity=".3"')).join('');
    if (g.athletic) out += line('M84 34 L56 88 M116 34 L144 88', s, 1.2, 'opacity=".7"');
    return out;
  },

  watch(c, s, g, u) {
    const strap = g.leather ? c : '#b9bec4';
    return sh('M86 14 h28 v172 h-28 z', strap, u)
      + (g.leather ? [140, 152, 164].map((y) => dot(100, y, 1.8, artDark(strap, 0.4))).join('') + line('M86 150 L114 150', artDark(strap, 0.3), 1) : [30, 46, 62, 138, 154, 170].map((y) => line(`M86 ${y} L114 ${y}`, '#8f959c', 1)).join(''))
      + sh('M100 62 a38 38 0 1 1 0 76 a38 38 0 1 1 0 -76 z', '#c7cbd0', u)
      + `<circle cx="100" cy="100" r="29" fill="${g.leather ? '#f3efe6' : '#1f252c'}"/>`
      + line('M100 100 L100 80 M100 100 L114 108', g.leather ? '#2a2a2a' : '#e8e8e8', 2.2)
      + `<rect x="136" y="94" width="6" height="12" rx="2" fill="#b6bbc1"/>`;
  },

  belt(c, s, g, u) {
    return sh('M18 84 L182 84 L182 114 L18 114 Z', c, u)
      + line('M24 90 L176 90 M24 108 L176 108', s, 0.8, 'stroke-dasharray="3 3"')
      + [126, 140, 154, 168].map((x) => dot(x, 99, 2.2, artDark(c, 0.45))).join('')
      + `<rect x="22" y="78" width="30" height="42" rx="4" fill="none" stroke="#c7cbd0" stroke-width="5"/>`
      + line('M37 80 L37 118', '#aeb3b9', 3);
  },

  cap(c, s, g, u) {
    return sh('M34 128 Q38 60 104 56 Q160 58 164 128 Z', c, u)
      + sh('M150 124 Q188 118 194 136 Q172 146 138 132 Z', artDark(c, 0.1), u)
      + line('M104 56 Q96 92 98 128 M104 56 Q132 90 136 128 M104 56 Q70 88 64 128', s, 1, 'opacity=".7"')
      + dot(104, 57, 4, artDark(c, 0.15));
  },

  beanie(c, s, g, u) {
    return sh('M46 148 Q46 50 100 46 Q154 50 154 148 Z', c, u)
      + sh('M44 116 L156 116 L156 150 L44 150 Z', artDark(c, 0.1), u)
      + [58, 70, 82, 94, 106, 118, 130, 142].map((x) => line(`M${x} 118 L${x} 148`, s, 0.8, 'opacity=".6"')).join('')
      + [66, 84, 100, 116, 134].map((x) => line(`M${x} 60 Q${x} 90 ${x} 114`, s, 0.6, 'opacity=".35"')).join('');
  },

  bag(c, s, g, u) {
    return line('M66 82 Q70 34 100 34 Q130 34 134 82', artDark(c, 0.2), 7)
      + sh('M26 96 Q26 78 46 78 L154 78 Q174 78 174 96 L174 150 Q174 162 162 162 L38 162 Q26 162 26 150 Z', c, u)
      + line('M40 90 L160 90', '#c9ccd0', 1.8) + sh('M26 100 L40 100 L40 162 L38 162 Q26 162 26 150 Z', artDark(c, 0.12), u, false)
      + sh('M174 100 L160 100 L160 162 L162 162 Q174 162 174 150 Z', artDark(c, 0.12), u, false);
  },

  scent(c, s, g, u) {
    return `<rect x="84" y="34" width="32" height="36" rx="4" fill="#23272b"/>`
      + `<rect x="92" y="68" width="16" height="10" fill="#9aa0a6"/>`
      + sh('M58 80 Q58 76 64 76 L136 76 Q142 76 142 82 L142 174 Q142 182 134 182 L66 182 Q58 182 58 174 Z', artLight(c, 0.35), u)
      + `<rect x="64" y="104" width="72" height="72" rx="4" fill="${c}" opacity=".55"/>`
      + `<rect x="76" y="118" width="48" height="26" fill="#f5f2ec" opacity=".85"/>`
      + line('M84 126 L116 126 M88 134 L112 134', '#6d6a64', 1.2);
  },

  glasses(c, s, g, u) {
    const lens = (x) => `<rect x="${x}" y="80" width="64" height="44" rx="20" fill="#2b2622" opacity=".88" stroke="${c}" stroke-width="7"/>`;
    return lens(24) + lens(112) + line('M88 94 Q100 84 112 94', c, 6) + line('M24 96 L6 90 M176 96 L194 90', c, 5)
      + line('M36 90 Q48 84 60 88', '#fff', 2, 'opacity=".25"') + line('M124 90 Q136 84 148 88', '#fff', 2, 'opacity=".25"');
  },
};

// ---------- Mannequin (front view, 200 x 430) ----------

function bodyOf(p) {
  const flags = p.flags || [];
  const inches = parseHeight(p.height);
  const f = Math.max(0.9, Math.min(1.1, inches / 70));
  const b = { f, sh: 40, ch: 34, wa: 28, hip: 30, arm: 11, thigh: 18 };
  if (flags.includes('Broad shoulders')) { b.sh += 7; b.ch += 2; }
  if (flags.includes('Athletic')) { b.sh += 4; b.ch += 3; b.wa -= 2; b.arm += 2; b.thigh += 1.5; }
  if (flags.includes('Slim')) { b.sh -= 3; b.ch -= 3; b.wa -= 3; b.hip -= 2; b.arm -= 1.5; b.thigh -= 2.5; }
  if (flags.includes('Carrying some weight')) { b.sh += 2; b.ch += 6; b.wa += 10; b.hip += 6; b.arm += 2; b.thigh += 3; }
  const chest = parseFloat(String(p.chest).match(/\d{2}(\.\d)?/)?.[0]);
  const waist = parseFloat(String(p.waist).match(/\d{2}(\.\d)?/)?.[0]);
  if (chest >= 30 && chest <= 56) b.ch = 34 + (chest - 38) * 1.1;
  if (waist >= 24 && waist <= 50) { b.wa = 28 + (waist - 32) * 1.25; b.hip = Math.max(b.hip, b.wa + 2); }

  const ground = 418;
  b.ground = ground;
  b.ankleY = ground - 14;
  b.hipY = b.ankleY - 196 * f;
  b.shY = b.hipY - 112 * f;
  b.chestY = b.shY + 27 * f;
  b.waistY = b.shY + 70 * f;
  b.kneeY = b.hipY + 98 * f;
  b.headY = b.shY - 40;
  b.armLen = 112 * f + 30 * f;
  return b;
}

function armAt(b, side, t) {
  const c0 = [100 + side * (b.sh - 4), b.shY + 7];
  const c1 = [100 + side * (b.sh + 3), b.shY + b.armLen * 0.47];
  const c2 = [100 + side * (b.sh + 3 + (b.wa > 34 ? 4 : 0)), b.shY + b.armLen];
  if (t <= 0.47) {
    const k = t / 0.47;
    return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k];
  }
  const k = (t - 0.47) / 0.53;
  return [c1[0] + (c2[0] - c1[0]) * k, c1[1] + (c2[1] - c1[1]) * k];
}

// Arm or sleeve with a rounded shoulder cap, down to fraction t of the arm.
function armPath(b, side, t, ease) {
  const w = (k) => b.arm * (1.55 - k * 0.62) + ease;
  const mid = Math.min(0.47, t / 2);
  const c0 = armAt(b, side, 0);
  const c1 = armAt(b, side, mid);
  const c2 = armAt(b, side, t);
  const w0 = w(0);
  const w1 = w(mid);
  const w2 = w(t);
  return `M${pt(c0[0] - w0 / 2, c0[1])} A${(w0 / 2).toFixed(1)} ${(w0 * 0.24).toFixed(1)} 0 0 1 ${pt(c0[0] + w0 / 2, c0[1])} `
    + `Q${pt(c1[0] + w1 / 2, c1[1])} ${pt(c2[0] + w2 / 2, c2[1])} L${pt(c2[0] - w2 / 2, c2[1])} Q${pt(c1[0] - w1 / 2, c1[1])} ${pt(c0[0] - w0 / 2, c0[1])} Z`;
}

function torsoPath(b, o) {
  const { shY, chestY, waistY } = b;
  const nk = o.neckW ?? 10;
  return `M${pt(100 - nk, shY - 7)} Q${pt(100 - o.shw * 0.7, shY - 5)} ${pt(100 - o.shw, shY + 6)} `
    + `C${pt(100 - o.chw - 1, chestY)} ${pt(100 - o.waw, waistY - 12)} ${pt(100 - o.waw, waistY)} `
    + `C${pt(100 - o.waw, waistY + 12)} ${pt(100 - o.hemw, o.hemY - 10)} ${pt(100 - o.hemw, o.hemY)} `
    + `L${pt(100 + o.hemw, o.hemY)} `
    + `C${pt(100 + o.hemw, o.hemY - 10)} ${pt(100 + o.waw, waistY + 12)} ${pt(100 + o.waw, waistY)} `
    + `C${pt(100 + o.waw, waistY - 12)} ${pt(100 + o.chw + 1, chestY)} ${pt(100 + o.shw, shY + 6)} `
    + `Q${pt(100 + o.shw * 0.7, shY - 5)} ${pt(100 + nk, shY - 7)} `
    + `Q${pt(100, shY + (o.neckDrop ?? 6))} ${pt(100 - nk, shY - 7)} Z`;
}

function legPath(b, side, ease, hemY, hemHalf) {
  const cx = (y) => 100 + side * b.hip * (0.5 - 0.1 * Math.min(1, (y - b.hipY) / (b.ankleY - b.hipY)));
  const top = [cx(b.hipY - 6), b.hipY - 6];
  const knee = [cx(b.kneeY), b.kneeY];
  const hem = [cx(hemY), hemY];
  const kneeW = b.thigh * 1.15 + ease;
  if (hemY <= b.kneeY) return limb(top, [cx((b.hipY + hemY) / 2), (b.hipY + hemY) / 2], hem, b.hip + ease, b.hip * 0.85 + ease, hemHalf * 2);
  return limb(top, knee, hem, b.hip + ease, kneeW, hemHalf * 2);
}

function mannequinSVG(p, pieces) {
  const b = bodyOf(p);
  const u = ++artUid;
  const skin = '#d8d0c4';
  const it = (slot) => pieces[slot]?.item;
  const top = it('Top');
  const bottom = it('Bottom');
  const shoes = it('Shoes');
  const layer = it('Layer');
  const acc = it('Accessory');
  const gt = top ? garmentOf(top) : { kind: 'none' };
  const gb = bottom ? garmentOf(bottom) : { kind: 'none' };
  const gs = shoes ? garmentOf(shoes) : { kind: 'none' };
  const gl = layer ? garmentOf(layer) : { kind: 'none' };
  const ga = acc ? garmentOf(acc) : { kind: 'none' };
  const fitEase = (item, base) => {
    const f = item ? fitOf(item) : 'Regular';
    return f === 'Relaxed' ? base + 5 : f === 'Slim' ? base - 1.5 : base + 1.5;
  };
  const tucked = ga.kind === 'belt' && ['shirt', 'polo', 'tee'].includes(gt.kind) && !gt.boxy;

  let out = artDefs(u);
  out += `<ellipse cx="100" cy="${b.ground}" rx="${b.hip + 26}" ry="7" fill="#000" opacity=".12"/>`;

  // Body
  out += sh(legPath(b, -1, 0, b.ankleY, b.thigh * 0.33), skin, u) + sh(legPath(b, 1, 0, b.ankleY, b.thigh * 0.33), skin, u);
  out += sh(torsoPath(b, { shw: b.sh - 3, chw: b.ch, waw: b.wa, hemw: b.hip, hemY: b.hipY + 2, neckW: 7, neckDrop: -6 }), skin, u);
  out += sh(armPath(b, -1, 1, 0), skin, u) + sh(armPath(b, 1, 1, 0), skin, u);
  out += sh(`M${pt(93.5, b.headY + 14)} L${pt(106.5, b.headY + 14)} L${pt(108, b.shY - 4)} L${pt(92, b.shY - 4)} Z`, skin, u, false);
  out += sh(`M${pt(100, b.headY - 22)} C${pt(112, b.headY - 22)} ${pt(117, b.headY - 8)} ${pt(116, b.headY + 4)} C${pt(115, b.headY + 16)} ${pt(108, b.headY + 22)} ${pt(100, b.headY + 22)} C${pt(92, b.headY + 22)} ${pt(85, b.headY + 16)} ${pt(84, b.headY + 4)} C${pt(83, b.headY - 8)} ${pt(88, b.headY - 22)} ${pt(100, b.headY - 22)} Z`, skin, u);

  // Clothing, in dressing order
  const drawTop = () => (top && gt.kind !== 'none' ? topOn(b, top, gt, u, fitEase, tucked) : '');
  const drawBottom = () => (bottom ? bottomOn(b, bottom, gb, u, fitEase) : '');
  out += tucked ? drawTop() + drawBottom() : drawBottom() + drawTop();
  if (ga.kind === 'belt') out += beltOn(b, acc, u);
  if (layer && gl.kind !== 'none') out += layerOn(b, layer, gl, u, top, gt, bottom, tucked, fitEase);
  if (shoes) out += shoesOn(b, shoes, gs, u);

  // Hands over sleeve ends
  [-1, 1].forEach((side) => {
    const w = armAt(b, side, 1);
    out += sh(`M${pt(w[0] - b.arm * 0.5, w[1] - 2)} Q${pt(w[0] - b.arm * 0.6, w[1] + 14 * b.f)} ${pt(w[0], w[1] + 19 * b.f)} Q${pt(w[0] + b.arm * 0.6, w[1] + 14 * b.f)} ${pt(w[0] + b.arm * 0.5, w[1] - 2)} Z`, skin, u);
  });

  if (acc) out += accessoryOn(b, acc, ga, u);
  return `<svg viewBox="0 0 200 430" aria-label="Mannequin wearing this outfit">${out}</svg>`;
}

function topOn(b, item, g, u, fitEase, tucked) {
  const c = item.hex;
  const s = seam(c);
  const e = g.boxy ? 9 : g.athletic ? 0.5 : fitEase(item, 2.5);
  const hemY = tucked ? b.waistY + 12 : g.boxy ? b.hipY - 4 : g.kind === 'shirt' ? b.hipY + 12 : g.kind === 'hoodie' ? b.hipY + 8 : b.hipY + 5;
  const sleeveT = g.kind === 'tank' ? 0 : ['shirt', 'hoodie'].includes(g.kind) ? (g.rolled ? 0.66 : 0.98) : g.boxy ? 0.38 : 0.3;
  let out = '';
  if (g.kind === 'hoodie') out += sh(`M${pt(100 - 22, b.shY - 2)} Q${pt(100, b.shY - 24)} ${pt(100 + 22, b.shY - 2)} Q${pt(100, b.shY + 10)} ${pt(100 - 22, b.shY - 2)} Z`, artDark(c, 0.14), u);
  const shw = g.kind === 'tank' ? b.sh - 12 : b.sh - 2 + e * 0.4 + (g.boxy ? 4 : 0);
  const waw = g.boxy || g.relaxed ? Math.max(b.wa + e, b.ch * 0.92 + e * 0.6) : b.wa + e;
  out += sh(torsoPath(b, { shw, chw: b.ch + e, waw, hemw: Math.max(b.hip + e * 0.6, waw), hemY, neckW: g.kind === 'tank' ? 12 : 10, neckDrop: g.kind === 'tank' ? 16 : 6 }), c, u);
  if (sleeveT) out += sh(armPath(b, -1, sleeveT, e * 0.4 + 2.5), c, u) + sh(armPath(b, 1, sleeveT, e * 0.4 + 2.5), c, u);
  if (g.kind === 'tee' || g.kind === 'tank') out += line(`M${pt(90, b.shY - 7)} Q${pt(100, b.shY + (g.kind === 'tank' ? 16 : 6))} ${pt(110, b.shY - 7)}`, s, 1.8);
  if (g.kind === 'shirt' || g.kind === 'polo') {
    out += sh(`M${pt(90, b.shY - 8)} L${pt(100, b.shY + 4)} L${pt(94, b.shY + 12)} L${pt(86, b.shY - 2)} Z`, artLight(c, 0.06), u)
      + sh(`M${pt(110, b.shY - 8)} L${pt(100, b.shY + 4)} L${pt(106, b.shY + 12)} L${pt(114, b.shY - 2)} Z`, artLight(c, 0.06), u);
    const placketEnd = g.kind === 'polo' ? b.shY + 28 : hemY;
    out += line(`M${pt(100, b.shY + 4)} L${pt(100, placketEnd)}`, s, 0.9);
    const ys = g.kind === 'polo' ? [b.shY + 14, b.shY + 24] : [0.2, 0.4, 0.6, 0.8].map((k) => b.shY + 10 + (hemY - b.shY - 14) * k);
    out += ys.map((y) => dot(100, y, 1.3, s)).join('');
    if (g.pocket) out += line(`M${pt(100 + b.ch * 0.25, b.chestY - 2)} h11 v11 h-11 Z`, s, 0.8);
    if (g.rolled) [-1, 1].forEach((side) => { const p0 = armAt(b, side, 0.62); out += line(`M${pt(p0[0] - 8, p0[1])} L${pt(p0[0] + 8, p0[1])}`, artDark(c, 0.15), 3.5); });
  }
  if (g.kind === 'hoodie') out += line(`M${pt(100 - b.ch * 0.55, b.hipY - 22)} L${pt(100 + b.ch * 0.55, b.hipY - 22)} L${pt(100 + b.ch * 0.65, b.hipY)} L${pt(100 - b.ch * 0.65, b.hipY)} Z`, s, 0.9) + line(`M${pt(96, b.shY + 2)} L${pt(95, b.shY + 22)} M${pt(104, b.shY + 2)} L${pt(105, b.shY + 22)}`, s, 1.2);
  if (g.athletic) out += line(`M${pt(92, b.shY - 5)} L${pt(100 - b.sh + 2, b.shY + 22)} M${pt(108, b.shY - 5)} L${pt(100 + b.sh - 2, b.shY + 22)}`, s, 0.8, 'opacity=".7"');
  return out;
}

function bottomOn(b, item, g, u, fitEase) {
  const c = item.hex;
  const s = seam(c);
  const e = g.wide ? 7 : g.taper ? fitEase(item, 1) : fitEase(item, 2.5);
  const shorts = g.kind === 'shorts';
  const hemY = shorts ? b.kneeY - 12 * b.f : g.cuffs ? b.ankleY - 4 : b.ankleY - 1;
  const hemHalf = shorts ? b.thigh * 0.62 + e * 0.5 : g.wide ? b.thigh * 0.62 + e * 0.5 : g.taper ? b.thigh * 0.36 + 1 : b.thigh * 0.5;
  const rise = b.waistY + 8;
  const waw = b.wa + 1.5 + e * 0.3;
  const hipW = b.hip + e * 0.5;
  let out = sh(legPath(b, -1, e, hemY, hemHalf), c, u) + sh(legPath(b, 1, e, hemY, hemHalf), c, u);
  out += sh(`M${pt(100 - waw, rise)} L${pt(100 + waw, rise)} C${pt(100 + waw + 1, rise + 10)} ${pt(100 + hipW, b.hipY - 16)} ${pt(100 + hipW, b.hipY + 4)} L${pt(100 - hipW, b.hipY + 4)} C${pt(100 - hipW, b.hipY - 16)} ${pt(100 - waw - 1, rise + 10)} ${pt(100 - waw, rise)} Z`, c, u, false);
  const stitch = g.denim ? '#c9a45a' : s;
  out += line(`M${pt(100 - waw, rise + 5)} L${pt(100 + waw, rise + 5)}`, s, 0.9)
    + line(`M${pt(100, rise + 5)} Q${pt(98, b.hipY - 8)} ${pt(101, b.hipY)}`, stitch, 0.9, g.denim ? 'stroke-dasharray="2 1.6"' : '');
  if (g.denim) out += line(`M${pt(100 - waw + 3, rise + 6)} Q${pt(100 - waw + 10, rise + 20)} ${pt(100 - waw + 16, rise + 5)}`, stitch, 0.9, 'stroke-dasharray="2 1.6"') + line(`M${pt(100 + waw - 3, rise + 6)} Q${pt(100 + waw - 10, rise + 20)} ${pt(100 + waw - 16, rise + 5)}`, stitch, 0.9, 'stroke-dasharray="2 1.6"');
  if (g.slant) out += line(`M${pt(100 - waw + 3, rise + 5)} L${pt(100 - waw + 8, rise + 20)} M${pt(100 + waw - 3, rise + 5)} L${pt(100 + waw - 8, rise + 20)}`, s, 0.9);
  if (g.crease && !shorts) [-1, 1].forEach((side) => { const x0 = 100 + side * b.hip * 0.5; out += line(`M${pt(x0, b.hipY + 6)} L${pt(100 + side * b.hip * 0.4, hemY - 2)}`, s, 0.6, 'opacity=".55"'); });
  if (g.pleats) out += line(`M${pt(100 - waw * 0.5, rise + 5)} l1 12 M${pt(100 + waw * 0.5, rise + 5)} l-1 12`, s, 0.8);
  if (g.cargo) [-1, 1].forEach((side) => { const x = 100 + side * (b.hip + e * 0.5 - 4); const y = b.hipY + 20 * b.f; out += line(`M${pt(x, y)} l${side * -12} 0 l0 ${20 * b.f} l${side * 12} 0`, s, 0.9) + line(`M${pt(x, y + 5)} l${side * -12} 0`, s, 0.9); });
  if (g.cuffs) [-1, 1].forEach((side) => { const x = 100 + side * b.hip * 0.4; out += sh(`M${pt(x - hemHalf, hemY - 7)} L${pt(x + hemHalf, hemY - 7)} L${pt(x + hemHalf, hemY)} L${pt(x - hemHalf, hemY)} Z`, artDark(c, 0.1), u, false); });
  if (shorts) [-1, 1].forEach((side) => { const x = 100 + side * b.hip * 0.47; out += line(`M${pt(x - hemHalf + 1, hemY - 4)} L${pt(x + hemHalf - 1, hemY - 4)}`, s, 0.8, 'stroke-dasharray="2 2"'); });
  return out;
}

function beltOn(b, item, u) {
  const y = b.waistY + 8;
  const w = b.wa + 2.5;
  return sh(`M${pt(100 - w, y)} L${pt(100 + w, y)} L${pt(100 + w, y + 5.5)} L${pt(100 - w, y + 5.5)} Z`, item.hex, u, false)
    + `<rect x="95.5" y="${(y - 1).toFixed(1)}" width="9" height="7.5" rx="1.2" fill="none" stroke="#c7cbd0" stroke-width="1.6"/>`;
}

function layerOn(b, item, g, u, top, gt, bottom, tucked, fitEase) {
  const c = item.hex;
  const s = seam(c);
  let out = '';
  if (g.kind === 'knit') {
    const e = g.athletic ? 1.5 : fitEase(item, 3);
    const hemY = b.hipY + 6;
    const waw = Math.max(b.wa + e + 1, b.ch * 0.9 + e * 0.5);
    const hemw = Math.max(b.hip + e * 0.4, waw - 1);
    out += sh(torsoPath(b, { shw: b.sh - 1 + e * 0.4, chw: b.ch + e + 1, waw, hemw, hemY, neckW: 10, neckDrop: 6 }), c, u);
    out += sh(`M${pt(100 - hemw, hemY - 7)} L${pt(100 + hemw, hemY - 7)} L${pt(100 + hemw, hemY)} L${pt(100 - hemw, hemY)} Z`, artDark(c, 0.1), u, false);
    out += sh(armPath(b, -1, 0.97, e * 0.4 + 3.5), c, u) + sh(armPath(b, 1, 0.97, e * 0.4 + 3.5), c, u);
    [-1, 1].forEach((side) => { const p0 = armAt(b, side, 0.9); out += line(`M${pt(p0[0] - 7, p0[1])} L${pt(p0[0] + 7, p0[1])}`, artDark(c, 0.14), 4); });
    if (g.zip) out += sh(`M${pt(89, b.shY - 14)} L${pt(111, b.shY - 14)} L${pt(110, b.shY - 3)} Q${pt(100, b.shY + 2)} ${pt(90, b.shY - 3)} Z`, artDark(c, 0.06), u) + line(`M${pt(100, b.shY - 14)} L${pt(100, b.chestY + 6)}`, '#c9ccd0', 1.2);
    else {
      out += line(`M${pt(90, b.shY - 7)} Q${pt(100, b.shY + 6)} ${pt(110, b.shY - 7)}`, artDark(c, 0.14), 3);
      if (top && ['shirt', 'polo'].includes(gt.kind)) out += sh(`M${pt(91, b.shY - 8)} L${pt(100, b.shY + 3)} L${pt(94, b.shY + 8)} L${pt(87, b.shY - 3)} Z`, artLight(top.hex, 0.06), u) + sh(`M${pt(109, b.shY - 8)} L${pt(100, b.shY + 3)} L${pt(106, b.shY + 8)} L${pt(113, b.shY - 3)} Z`, artLight(top.hex, 0.06), u);
    }
    if (g.cable) [-0.45, 0, 0.45].forEach((k) => { const x = 100 + k * b.ch; let d = `M${pt(x, b.chestY - 4)}`; for (let y = b.chestY - 4; y < hemY - 12; y += 12) d += ` q4 6 0 12`; out += line(d, s, 1.2, 'opacity=".7"'); d = `M${pt(x, b.chestY - 4)}`; for (let y = b.chestY - 4; y < hemY - 12; y += 12) d += ` q-4 6 0 12`; out += line(d, s, 1.2, 'opacity=".7"'); });
    return out;
  }

  // Open-front jackets
  const e = fitEase(item, 4) + 1;
  const hemY = g.hem === 'crop' ? b.waistY + (b.hipY - b.waistY) * 0.72 : g.hem === 'blazer' ? b.hipY + 22 * b.f : g.hem === 'mid' ? b.hipY + 8 : b.hipY + 14 * b.f;
  if (g.hood) out += sh(`M${pt(100 - 23, b.shY - 2)} Q${pt(100, b.shY - 26)} ${pt(100 + 23, b.shY - 2)} Q${pt(100, b.shY + 10)} ${pt(100 - 23, b.shY - 2)} Z`, artDark(c, 0.14), u);
  const waw = Math.max(b.wa + e + 2, b.ch * 0.92 + e * 0.6);
  const hemw = g.rib ? Math.max(b.hip + 1, waw - 3) : Math.max(b.hip + e * 0.5, waw + (g.hem === 'blazer' ? 2 : 0));
  out += sh(torsoPath(b, { shw: b.sh + e * 0.4, chw: b.ch + e + 2, waw, hemw, hemY, neckW: 10, neckDrop: 4 }), c, u);

  // The gap down the front shows what's underneath.
  const topHem = top ? (tucked ? b.waistY + 8 : b.hipY + 5) : b.hipY;
  const neck = b.shY - 5;
  const openAt = (y) => {
    if (g.lapels) return y <= b.waistY + 6 ? 9 * (1 - (y - neck) / (b.waistY + 6 - neck)) + 0.5 : 0.5 + (y - b.waistY - 6) * 0.35;
    const k = (y - neck) / (hemY - neck);
    return 8 + k * ((g.open ?? 0.3) * b.ch * 2 - 8);
  };
  const band = (y0, y1, fill) => (y1 > y0 ? sh(`M${pt(100 - openAt(y0), y0)} L${pt(100 + openAt(y0), y0)} L${pt(100 + openAt(y1), y1)} L${pt(100 - openAt(y1), y1)} Z`, fill, u, false) : '');
  const under = top ? top.hex : '#d8d0c4';
  out += band(neck, Math.min(topHem, hemY), under);
  if (hemY > topHem) out += band(topHem, hemY, bottom ? bottom.hex : '#d8d0c4');
  if (top && ['shirt', 'polo'].includes(gt.kind)) out += line(`M${pt(100, b.shY + 4)} L${pt(100, Math.min(topHem, hemY) - 2)}`, seam(top.hex), 0.8);
  out += line(`M${pt(100 - openAt(neck), neck)} L${pt(100 - openAt(hemY), hemY)} M${pt(100 + openAt(neck), neck)} L${pt(100 + openAt(hemY), hemY)}`, artDark(c, 0.3), 1);
  out += sh(armPath(b, -1, 0.97, e * 0.4 + 5), c, u) + sh(armPath(b, 1, 0.97, e * 0.4 + 5), c, u);

  if (g.lapels) {
    out += sh(`M${pt(90, b.shY - 8)} L${pt(100 - 9.5, neck)} L${pt(99.5, b.waistY + 6)} L${pt(100 - b.ch * 0.42, b.chestY + 2)} L${pt(100 - b.ch * 0.36, b.shY + 4)} Z`, artLight(c, 0.07), u)
      + sh(`M${pt(110, b.shY - 8)} L${pt(100 + 9.5, neck)} L${pt(100.5, b.waistY + 6)} L${pt(100 + b.ch * 0.42, b.chestY + 2)} L${pt(100 + b.ch * 0.36, b.shY + 4)} Z`, artLight(c, 0.07), u)
      + dot(102, b.waistY + 10, 1.6, s) + dot(102, b.waistY + 22, 1.6, s)
      + line(`M${pt(100 - waw + 5, b.hipY - 2)} l12 0 M${pt(100 + waw - 5, b.hipY - 2)} l-12 0`, s, 1);
  }
  if (g.collar) out += sh(`M${pt(89, b.shY - 8)} L${pt(100 - 8, neck + 14)} L${pt(100 - 15, b.shY + 8)} L${pt(100 - 17, b.shY - 3)} Z`, artLight(c, 0.05), u) + sh(`M${pt(111, b.shY - 8)} L${pt(100 + 8, neck + 14)} L${pt(100 + 15, b.shY + 8)} L${pt(100 + 17, b.shY - 3)} Z`, artLight(c, 0.05), u);
  if (g.pockets) {
    const st = g.denim ? '#c9a45a' : s;
    [-1, 1].forEach((side) => {
      const x = 100 + side * b.ch * 0.52;
      out += line(`M${pt(x - 6.5, b.chestY)} h13 v11 h-13 Z`, st, 0.9, g.denim ? 'stroke-dasharray="2 1.5"' : '') + line(`M${pt(x - 6.5, b.chestY + 4)} h13`, st, 0.9);
    });
  }
  if (g.rib) {
    out += line(`M${pt(89, b.shY - 7)} Q${pt(100, b.shY + 4)} ${pt(111, b.shY - 7)}`, artDark(c, 0.16), 4)
      + sh(`M${pt(100 - hemw, hemY - 7)} L${pt(100 - openAt(hemY - 7), hemY - 7)} L${pt(100 - openAt(hemY), hemY)} L${pt(100 - hemw, hemY)} Z`, artDark(c, 0.16), u, false)
      + sh(`M${pt(100 + hemw, hemY - 7)} L${pt(100 + openAt(hemY - 7), hemY - 7)} L${pt(100 + openAt(hemY), hemY)} L${pt(100 + hemw, hemY)} Z`, artDark(c, 0.16), u, false);
    [-1, 1].forEach((side) => { const p0 = armAt(b, side, 0.9); out += line(`M${pt(p0[0] - 8, p0[1])} L${pt(p0[0] + 8, p0[1])}`, artDark(c, 0.16), 4.5); });
  }
  if (g.zip) out += line(`M${pt(100 - openAt(neck) - 1, neck)} L${pt(100 - openAt(hemY) - 1, hemY)} M${pt(100 + openAt(neck) + 1, neck)} L${pt(100 + openAt(hemY) + 1, hemY)}`, '#c9ccd0', 0.9);
  return out;
}

function shoesOn(b, item, g, u) {
  const c = item.hex;
  const light = artLum(c) > 0.8;
  const rubber = light ? '#d9d5cc' : '#f1eee7';
  const sole = g.style === 'desert' ? '#cdb98f' : ['loafer', 'chelsea'].includes(g.style) ? artDark(c, 0.45) : rubber;
  const tall = ['chelsea', 'desert'].includes(g.style);
  const soleH = g.style === 'runner' ? 6 : ['canvas', 'trainer', 'skate'].includes(g.style) ? 4.5 : 3;
  let out = '';
  [-1, 1].forEach((side) => {
    const x = 100 + side * (b.hip * 0.4 + 1.5);
    const top = tall ? b.ankleY - 20 * b.f : b.ankleY - 5;
    const toe = b.ground - 1;
    const w = g.style === 'loafer' ? 11 : 12.5;
    out += sh(`M${pt(x - 8, top)} Q${pt(x, top - 3)} ${pt(x + 8, top)} L${pt(x + side * 2 + w, toe - soleH)} Q${pt(x + side * 2, toe - soleH + 5)} ${pt(x + side * 2 - w, toe - soleH)} Z`, c, u)
      + sh(`M${pt(x + side * 2 - w - 1, toe - soleH)} L${pt(x + side * 2 + w + 1, toe - soleH)} L${pt(x + side * 2 + w, toe)} L${pt(x + side * 2 - w, toe)} Z`, sole, u, false);
    if (g.style === 'loafer') out += line(`M${pt(x - 6, top + 5)} Q${pt(x, top + 8)} ${pt(x + 6, top + 5)}`, seam(c), 1.2);
    if (['trainer', 'canvas', 'skate', 'runner'].includes(g.style) && !g.clean) out += line(`M${pt(x - 4, top + 3)} L${pt(x + 4, top + 3)} M${pt(x - 4, top + 6)} L${pt(x + 4, top + 6)}`, seam(c), 0.9);
    if (g.style === 'chelsea') out += line(`M${pt(x - 7, top + 2)} L${pt(x - 6, b.ankleY - 2)} M${pt(x + 7, top + 2)} L${pt(x + 6, b.ankleY - 2)}`, artDark(c, 0.3), 1.4);
  });
  return out;
}

function accessoryOn(b, item, g, u) {
  const c = item.hex;
  const hy = b.headY;
  if (g.kind === 'watch') {
    const w = armAt(b, 1, 0.95);
    return sh(`M${pt(w[0] - b.arm * 0.55, w[1] - 2.5)} L${pt(w[0] + b.arm * 0.55, w[1] - 2.5)} L${pt(w[0] + b.arm * 0.55, w[1] + 2.5)} L${pt(w[0] - b.arm * 0.55, w[1] + 2.5)} Z`, g.leather ? c : '#b9bec4', u, false)
      + `<circle cx="${w[0].toFixed(1)}" cy="${w[1].toFixed(1)}" r="3.6" fill="#c7cbd0"/><circle cx="${w[0].toFixed(1)}" cy="${w[1].toFixed(1)}" r="2.5" fill="${g.leather ? '#f3efe6' : '#1f252c'}"/>`;
  }
  if (g.kind === 'cap') {
    return sh(`M${pt(83, hy - 4)} Q${pt(84, hy - 27)} ${pt(100, hy - 27)} Q${pt(116, hy - 27)} ${pt(117, hy - 4)} Z`, c, u)
      + sh(`M${pt(80, hy - 5)} Q${pt(100, hy - 11)} ${pt(120, hy - 5)} Q${pt(100, hy + 2)} ${pt(80, hy - 5)} Z`, artDark(c, 0.12), u) + dot(100, hy - 26.5, 1.6, artDark(c, 0.2));
  }
  if (g.kind === 'beanie') {
    return sh(`M${pt(83, hy - 1)} Q${pt(82, hy - 30)} ${pt(100, hy - 30)} Q${pt(118, hy - 30)} ${pt(117, hy - 1)} Z`, c, u)
      + sh(`M${pt(82.5, hy - 10)} L${pt(117.5, hy - 10)} L${pt(117.5, hy)} L${pt(82.5, hy)} Z`, artDark(c, 0.1), u, false);
  }
  if (g.kind === 'glasses') {
    return `<rect x="87" y="${(hy - 2).toFixed(1)}" width="12" height="8" rx="3.5" fill="#2b2622" stroke="${c}" stroke-width="1.4"/>`
      + `<rect x="101" y="${(hy - 2).toFixed(1)}" width="12" height="8" rx="3.5" fill="#2b2622" stroke="${c}" stroke-width="1.4"/>`
      + line(`M${pt(99, hy + 1)} L${pt(101, hy + 1)}`, c, 1.2);
  }
  if (g.kind === 'bag') {
    const w = armAt(b, -1, 1);
    const top = w[1] + 16 * b.f;
    return line(`M${pt(w[0] - 2, w[1] + 8)} L${pt(w[0] - 10, top)} M${pt(w[0] + 2, w[1] + 8)} L${pt(w[0] + 8, top)}`, artDark(c, 0.2), 2)
      + sh(`M${pt(w[0] - 24, top + 6)} Q${pt(w[0] - 24, top)} ${pt(w[0] - 18, top)} L${pt(w[0] + 18, top)} Q${pt(w[0] + 24, top)} ${pt(w[0] + 24, top + 6)} L${pt(w[0] + 24, top + 26)} L${pt(w[0] - 24, top + 26)} Z`, c, u);
  }
  return '';
}

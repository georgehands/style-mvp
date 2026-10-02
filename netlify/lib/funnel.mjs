// Anonymous funnel counts, one JSON doc per day: { "<src>~<device>": { event: count } }. No personal data.
export const STEP_KEYS = ['tried', 'build', 'body', 'frame', 'week', 'style', 'colour', 'budget', 'save'];
const steps = STEP_KEYS.join('|');
export const EVENT = new RegExp(
  `^(visit|start|finish|buy_tap|paid|waitlist|tried_[0-6]|step_(${steps}|\\d{1,2})|back_(${steps})|t_(${steps})_[0-3]`
  + '|err_(height|email|js)|email_focus|scan_(start|done|fail)|colour_(pick|skip)|load_[0-3]|preview_seen|offer_seen|scroll_(50|90))$',
);
const MAX_KEYS_PER_DAY = 300;

export const cleanSrc = (s) => (typeof s === 'string' && /^[a-z0-9_-]{1,40}$/i.test(s) ? s.toLowerCase() : 'direct');
const cleanDevice = (d) => (d === 'm' || d === 'd' ? d : 'u');

export async function recordEvent(store, body, now = new Date()) {
  const e = body?.e;
  if (typeof e !== 'string' || !EVENT.test(e)) return false;
  const key = `d/${now.toISOString().slice(0, 10)}`;
  const bucket = `${cleanSrc(body.src)}~${cleanDevice(body.d)}`;
  const day = (await store.get(key, { type: 'json' })) || {};
  if (!day[bucket] && Object.keys(day).length >= MAX_KEYS_PER_DAY) return false;
  day[bucket] ||= {};
  day[bucket][e] = (day[bucket][e] || 0) + 1;
  await store.setJSON(key, day);
  return true;
}

// Returns every day's raw buckets. The stats page does the filtering and sums.
export async function readStats(store) {
  const { blobs } = await store.list({ prefix: 'd/' });
  const keys = blobs.map((b) => b.key).sort().slice(-120);
  const days = {};
  for (const key of keys) days[key.slice(2)] = (await store.get(key, { type: 'json' })) || {};
  return { days };
}

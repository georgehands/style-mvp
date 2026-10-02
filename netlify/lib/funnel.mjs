// Anonymous funnel counts, one JSON doc per day: { src: { event: count } }. No personal data.
export const EVENT = /^(visit|start|step_(\d{1,2}|[a-z]{2,12})|finish|buy_tap|paid|waitlist|tried_\d)$/;
const MAX_SOURCES_PER_DAY = 300;

export const cleanSrc = (s) => (typeof s === 'string' && /^[a-z0-9_-]{1,40}$/i.test(s) ? s.toLowerCase() : 'direct');

export async function recordEvent(store, body, now = new Date()) {
  const e = body?.e;
  if (typeof e !== 'string' || !EVENT.test(e)) return false;
  const src = cleanSrc(body.src);
  const key = `d/${now.toISOString().slice(0, 10)}`;
  const day = (await store.get(key, { type: 'json' })) || {};
  if (!day[src] && Object.keys(day).length >= MAX_SOURCES_PER_DAY) return false;
  day[src] ||= {};
  day[src][e] = (day[src][e] || 0) + 1;
  await store.setJSON(key, day);
  return true;
}

export async function readStats(store) {
  const { blobs } = await store.list({ prefix: 'd/' });
  const keys = blobs.map((b) => b.key).sort().slice(-90);
  const days = {};
  for (const key of keys) days[key.slice(2)] = (await store.get(key, { type: 'json' })) || {};
  const totals = {};
  Object.values(days).forEach((d) => Object.entries(d).forEach(([src, ev]) => {
    totals[src] ||= {};
    Object.entries(ev).forEach(([k, n]) => { totals[src][k] = (totals[src][k] || 0) + n; });
  }));
  return { days, totals };
}

import { getStore } from '@netlify/blobs';
import { recordEvent } from '../lib/funnel.mjs';

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const text = await req.text();
  if (text.length > 500) return new Response('Too large', { status: 413 });
  let body;
  try { body = JSON.parse(text); } catch { return new Response('Bad request', { status: 400 }); }
  const ok = await recordEvent(getStore({ name: 'funnel', consistency: 'strong' }), body);
  return new Response(null, { status: ok ? 204 : 400 });
};

export const config = { path: '/api/event' };

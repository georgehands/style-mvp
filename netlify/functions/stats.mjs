import { getStore } from '@netlify/blobs';
import { readStats } from '../lib/funnel.mjs';

export default async () => {
  const stats = await readStats(getStore({ name: 'funnel', consistency: 'strong' }));
  return Response.json(stats, { headers: { 'Cache-Control': 'no-store' } });
};

export const config = { path: '/api/stats' };

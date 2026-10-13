import { put } from '@vercel/blob';
import { createUsageHandler } from '../server/usage.mjs';

export default { fetch: createUsageHandler({ put, enabled: () => process.env.VERCEL_ENV === 'production' }) };

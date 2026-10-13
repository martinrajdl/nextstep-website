import { list, del } from '@vercel/blob';
import { createCleanupHandler } from '../server/usage.mjs';

export default { fetch: createCleanupHandler({ list, del, secret: () => process.env.CRON_SECRET }) };

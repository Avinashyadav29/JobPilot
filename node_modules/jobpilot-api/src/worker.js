import 'dotenv/config';
import { Worker } from 'bullmq';
import { connection, enqueue } from './queue.js';
import { q } from './db.js';
import { syncUser, matchJob, draftJob, approveJob, skipJob } from './services/pipeline.js';
import * as tg from './services/telegram.js';

new Worker(
  'jobpilot',
  async (job) => {
    if (job.name === 'sync') return syncUser(job.data.userId);
    if (job.name === 'match') return matchJob(job.data.jobId);
    if (job.name === 'draft') return draftJob(job.data.jobId);
  },
  { connection, concurrency: 3 }
).on('failed', (job, err) => console.error(`job ${job?.name} failed:`, err.message));

// Periodic Gmail check for every connected user
const every = (+process.env.SYNC_MINUTES || 15) * 60 * 1000;
setInterval(async () => {
  for (const u of await q('select id from users where gmail_tokens is not null')) await enqueue('sync', { userId: u.id });
}, every);

// Telegram: /start shows your chat id; Approve/Skip buttons call the same logic as the website
tg.poll(async (u) => {
  if (u.message?.text?.startsWith('/start')) {
    return tg.send(u.message.chat.id, `Your chat id is ${u.message.chat.id}. Paste it into JobPilot -> Settings -> Telegram chat id.`);
  }
  const cb = u.callback_query;
  if (!cb) return;
  const [action, id] = cb.data.split(':');
  const [user] = await q('select id from users where telegram_chat_id=$1', [String(cb.message.chat.id)]);
  if (!user) return tg.answer(cb.id, 'Chat not linked');
  const res = action === 'approve' ? await approveJob(user.id, +id) : await skipJob(user.id, +id);
  await tg.answer(cb.id, res ? (action === 'approve' ? 'Approved. Drafting...' : 'Skipped') : 'Already handled');
});

console.log('Worker running');

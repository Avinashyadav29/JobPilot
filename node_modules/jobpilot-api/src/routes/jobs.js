import { Router } from 'express';
import { q } from '../db.js';
import { auth, h } from '../auth.js';
import { enqueue } from '../queue.js';
import { approveJob, skipJob } from '../services/pipeline.js';

const r = Router();
r.use(auth);

r.get('/', h(async (req, res) => {
  const status = req.query.status;
  res.json(await q(
    `select * from jobs where user_id=$1 ${status ? 'and status=$2' : ''} order by match_score desc nulls last, created_at desc limit 100`,
    status ? [req.userId, status] : [req.userId]
  ));
}));

// Add a job by hand (handy for testing without Gmail)
r.post('/manual', h(async (req, res) => {
  const { title, company, link, description } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const [row] = await q(
    'insert into jobs(user_id,title,company,link,description,source) values($1,$2,$3,$4,$5,$6) on conflict (user_id,link) do nothing returning *',
    [req.userId, title, company, link || null, description, 'manual']
  );
  if (row) await enqueue('match', { jobId: row.id });
  res.json(row || { duplicate: true });
}));

r.post('/sync', h(async (req, res) => {
  await enqueue('sync', { userId: req.userId });
  res.json({ queued: true });
}));

r.post('/:id/approve', h(async (req, res) => {
  const job = await approveJob(req.userId, +req.params.id);
  job ? res.json(job) : res.status(409).json({ error: 'Job is not awaiting review' });
}));

r.post('/:id/skip', h(async (req, res) => {
  const job = await skipJob(req.userId, +req.params.id);
  job ? res.json(job) : res.status(409).json({ error: 'Job is not awaiting review' });
}));

export default r;

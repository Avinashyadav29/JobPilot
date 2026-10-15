import { Router } from 'express';
import { q } from '../db.js';
import { auth, h } from '../auth.js';
import { sendEmail } from '../services/gmail.js';
import { setStage } from './applications.js';

const r = Router();
r.use(auth);

r.get('/', h(async (req, res) => {
  res.json(await q(
    `select d.*, j.title, j.company, j.link, j.match_score from drafts d join jobs j on j.id=d.job_id
     where d.user_id=$1 and d.status='draft' order by d.created_at desc`, [req.userId]));
}));

r.patch('/:id', h(async (req, res) => {
  const { to_email, email_subject, email_body, tailored_resume, connection_note } = req.body || {};
  const [row] = await q(
    `update drafts set to_email=coalesce($1,to_email), email_subject=coalesce($2,email_subject), email_body=coalesce($3,email_body),
     tailored_resume=coalesce($4,tailored_resume), connection_note=coalesce($5,connection_note) where id=$6 and user_id=$7 returning *`,
    [to_email, email_subject, email_body, tailored_resume, connection_note, req.params.id, req.userId]
  );
  row ? res.json(row) : res.status(404).json({ error: 'not found' });
}));

// Sends via Gmail if a recipient is set, otherwise just marks as applied (you apply via the job link).
r.post('/:id/send', h(async (req, res) => {
  const [d] = await q("select * from drafts where id=$1 and user_id=$2 and status='draft'", [req.params.id, req.userId]);
  if (!d) return res.status(404).json({ error: 'not found' });
  let threadId = null;
  if (d.to_email) {
    const [u] = await q('select * from users where id=$1', [req.userId]);
    if (!u.gmail_tokens) return res.status(400).json({ error: 'Connect Gmail in Settings first' });
    threadId = (await sendEmail(u, { to: d.to_email, subject: d.email_subject, body: d.email_body })).threadId;
  }
  await q("update drafts set status='sent' where id=$1", [d.id]);
  if (d.application_id) {
    await q('update applications set gmail_thread_id=coalesce($1,gmail_thread_id) where id=$2', [threadId, d.application_id]);
    await setStage(req.userId, d.application_id, 'applied');
  }
  res.json({ ok: true, emailed: !!d.to_email });
}));

export default r;

import { Router } from 'express';
import { q } from '../db.js';
import { auth, h, sign, verify } from '../auth.js';
import { authUrl, oauth } from '../services/gmail.js';

const r = Router();

r.get('/gmail/callback', h(async (req, res) => {
  const { id } = verify(req.query.state);
  const { tokens } = await oauth().getToken(req.query.code);
  await q('update users set gmail_tokens=$1 where id=$2', [JSON.stringify(tokens), id]);
  res.redirect(`${process.env.FRONTEND_URL}/?gmail=connected`);
}));

r.use(auth);

r.get('/gmail/auth-url', h(async (req, res) => res.json({ url: authUrl(sign({ id: req.userId })) })));

r.get('/settings', h(async (req, res) => {
  const [u] = await q('select email,match_threshold,keywords,alert_query,telegram_chat_id,(gmail_tokens is not null) as gmail_connected from users where id=$1', [req.userId]);
  res.json(u);
}));

r.patch('/settings', h(async (req, res) => {
  const { match_threshold, keywords, alert_query, telegram_chat_id } = req.body || {};
  const [u] = await q(
    `update users set match_threshold=coalesce($1,match_threshold), keywords=coalesce($2,keywords),
     alert_query=coalesce($3,alert_query), telegram_chat_id=coalesce($4,telegram_chat_id) where id=$5
     returning email,match_threshold,keywords,alert_query,telegram_chat_id`,
    [match_threshold, keywords, alert_query, telegram_chat_id, req.userId]
  );
  res.json(u);
}));

r.get('/stats', h(async (req, res) => {
  const stages = Object.fromEntries((await q('select stage, count(*)::int n from applications where user_id=$1 group by stage', [req.userId])).map((x) => [x.stage, x.n]));
  const weekly = await q("select to_char(date_trunc('week',created_at),'Mon DD') as week, count(*)::int n from applications where user_id=$1 and created_at > now()-interval '8 weeks' group by date_trunc('week',created_at) order by date_trunc('week',created_at)", [req.userId]);
  const [{ n: pending }] = await q("select count(*)::int n from jobs where user_id=$1 and status in ('review','drafted')", [req.userId]);
  const sent = ['applied', 'replied', 'interview', 'offer', 'rejected'].reduce((a, s) => a + (stages[s] || 0), 0);
  const responded = ['replied', 'interview', 'offer'].reduce((a, s) => a + (stages[s] || 0), 0);
  res.json({ stages, weekly, pending, responseRate: sent ? Math.round((responded / sent) * 100) : 0 });
}));

export default r;

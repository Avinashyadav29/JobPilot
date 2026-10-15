import { Router } from 'express';
import { q } from '../db.js';
import { auth, h } from '../auth.js';

export const STAGES = ['saved', 'applied', 'replied', 'interview', 'offer', 'rejected'];

export async function setStage(userId, id, stage) {
  const [cur] = await q('select stage from applications where id=$1 and user_id=$2', [id, userId]);
  if (!cur) return null;
  if (cur.stage === stage) return cur;
  const [row] = await q(
    "update applications set stage=$1, updated_at=now(), applied_at=case when $1='applied' and applied_at is null then now() else applied_at end where id=$2 returning *",
    [stage, id]
  );
  await q('insert into status_history(application_id,from_stage,to_stage) values($1,$2,$3)', [id, cur.stage, stage]);
  return row;
}

const r = Router();
r.use(auth);

r.get('/', h(async (req, res) => {
  res.json(await q('select * from applications where user_id=$1 order by updated_at desc', [req.userId]));
}));

r.post('/', h(async (req, res) => {
  const { company, title, link, notes } = req.body || {};
  if (!company || !title) return res.status(400).json({ error: 'company and title required' });
  const [row] = await q('insert into applications(user_id,company,title,link,notes) values($1,$2,$3,$4,$5) returning *', [req.userId, company, title, link, notes]);
  res.json(row);
}));

r.patch('/:id', h(async (req, res) => {
  const { company, title, link, notes, stage } = req.body || {};
  if (stage) {
    if (!STAGES.includes(stage)) return res.status(400).json({ error: 'bad stage' });
    if (!(await setStage(req.userId, +req.params.id, stage))) return res.status(404).json({ error: 'not found' });
  }
  const [row] = await q(
    'update applications set company=coalesce($1,company), title=coalesce($2,title), link=coalesce($3,link), notes=coalesce($4,notes), updated_at=now() where id=$5 and user_id=$6 returning *',
    [company, title, link, notes, req.params.id, req.userId]
  );
  row ? res.json(row) : res.status(404).json({ error: 'not found' });
}));

r.delete('/:id', h(async (req, res) => {
  await q('delete from applications where id=$1 and user_id=$2', [req.params.id, req.userId]);
  res.json({ ok: true });
}));

export default r;

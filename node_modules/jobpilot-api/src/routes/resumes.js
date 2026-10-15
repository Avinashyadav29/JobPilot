import { Router } from 'express';
import multer from 'multer';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { q } from '../db.js';
import { auth, h } from '../auth.js';

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
r.use(auth);

r.get('/', h(async (req, res) => {
  res.json(await q('select id,name,is_master,parent_id,created_at,left(content,300) as preview from resumes where user_id=$1 order by is_master desc, created_at desc', [req.userId]));
}));

// Accepts a PDF/TXT file upload OR pasted text in "content"
r.post('/', upload.single('file'), h(async (req, res) => {
  let content = req.body.content || '';
  if (req.file) {
    content = req.file.mimetype === 'application/pdf' ? (await pdf(req.file.buffer)).text : req.file.buffer.toString('utf8');
  }
  content = content.trim();
  if (content.length < 50) return res.status(400).json({ error: 'Resume text looks empty' });
  const hasMaster = (await q('select 1 from resumes where user_id=$1 and is_master', [req.userId])).length > 0;
  const [row] = await q('insert into resumes(user_id,name,content,is_master) values($1,$2,$3,$4) returning id,name,is_master', [
    req.userId, req.body.name || req.file?.originalname || 'Resume', content, !hasMaster,
  ]);
  res.json(row);
}));

r.post('/:id/master', h(async (req, res) => {
  await q('update resumes set is_master=(id=$1) where user_id=$2', [req.params.id, req.userId]);
  res.json({ ok: true });
}));

r.delete('/:id', h(async (req, res) => {
  await q('delete from resumes where id=$1 and user_id=$2', [req.params.id, req.userId]);
  res.json({ ok: true });
}));

export default r;

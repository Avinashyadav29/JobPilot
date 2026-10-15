import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { q } from '../db.js';
import { sign, h } from '../auth.js';

const r = Router();

r.post('/signup', h(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password || password.length < 8) return res.status(400).json({ error: 'Email and a password of 8+ characters are required' });
  const e = email.toLowerCase().trim();
  if ((await q('select 1 from users where email=$1', [e])).length) return res.status(409).json({ error: 'Email already registered' });
  const [u] = await q('insert into users(email,password_hash) values($1,$2) returning id,email', [e, await bcrypt.hash(password, 10)]);
  res.json({ token: sign(u), user: u });
}));

r.post('/login', h(async (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const [u] = await q('select * from users where email=$1', [email.toLowerCase().trim()]);
  if (!u || !(await bcrypt.compare(password, u.password_hash))) return res.status(401).json({ error: 'Wrong email or password' });
  res.json({ token: sign(u), user: { id: u.id, email: u.email } });
}));

export default r;

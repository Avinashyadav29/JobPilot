import jwt from 'jsonwebtoken';
import { usingEmbeddedDatabase } from './db.js';

const secret = process.env.JWT_SECRET || (
  usingEmbeddedDatabase ? 'jobpilot-local-development-secret' : undefined
);

export const sign = (u) => jwt.sign({ id: u.id }, secret, { expiresIn: '30d' });
export const verify = (t) => jwt.verify(t, secret);

export function auth(req, res, next) {
  const h = req.headers.authorization || '';
  try {
    req.userId = verify(h.startsWith('Bearer ') ? h.slice(7) : '').id;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// lets async route handlers throw without crashing Express 4
export const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

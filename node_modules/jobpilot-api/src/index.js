import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import appRoutes from './routes/applications.js';
import jobRoutes from './routes/jobs.js';
import draftRoutes from './routes/drafts.js';
import resumeRoutes from './routes/resumes.js';
import miscRoutes from './routes/settings.js';
import { initializeDatabase, usingEmbeddedDatabase } from './db.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/applications', appRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api', miscRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const port = process.env.PORT || 4000;
await initializeDatabase();
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  if (usingEmbeddedDatabase) console.log('Using local embedded database at backend/data');
});

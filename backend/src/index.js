import { createApp } from './utils/httpCompat.js';
import { env } from './config/env.js';
import apiRouter from './routes/api.js';
import { db } from './services/supabaseService.js';
import { geminiService } from './services/geminiService.js';

const app = createApp();

// Mount API routes
app.use('/api', apiRouter);

// Root info endpoint
app.get('/', async (req, res) => {
  const dbStatus = await db.getStatus();
  const aiStatus = geminiService.getStatus();
  res.json({
    application: 'ResolveAI — Autonomous Business Operations Platform',
    tagline: 'Your Business. Your AI Workforce. Always in Sync.',
    version: '1.0.0',
    database: dbStatus,
    ai: aiStatus,
    apiBase: '/api',
  });
});

const server = app.listen(env.PORT, async () => {
  const dbStatus = await db.getStatus();
  const aiStatus = geminiService.getStatus();
  console.log('==============================================================');
  console.log(`RESOLVEAI BACKEND SERVER RUNNING ON http://localhost:${env.PORT}`);
  console.log(`Database Mode : ${dbStatus.mode}`);
  console.log(`AI Engine Mode: ${aiStatus.mode}`);
  console.log('==============================================================');
});

export { app, server };

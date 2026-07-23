import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { loadDb } from './db';
import authRoutes from './routes/auth';
import guildRoutes from './routes/guilds';
import botRoutes from './routes/bot';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Trust Railway / Render / Heroku reverse proxy so that
// req.protocol === 'https' and secure cookies work correctly.
app.set('trust proxy', 1);

// Load persistent data
loadDb();

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'onyx-dashboard-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',  // survive the Discord → your-domain redirect
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/guilds', guildRoutes);
app.use('/api/bot', botRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Onyx Dashboard API running on http://localhost:${PORT}`);
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

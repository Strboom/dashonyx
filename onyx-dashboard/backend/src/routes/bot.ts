import { Router, Request, Response } from 'express';
import { requireBotKey } from '../middleware/auth';
import {
  setBotStatus,
  setGuilds,
  getGuildSettings,
  getDb,
  saveDb,
} from '../db';

const router = Router();

// POST /api/bot/heartbeat  — bot pushes status every 30s
router.post('/heartbeat', requireBotKey, (req: Request, res: Response) => {
  const { online, uptime_seconds, guild_count, user_count, latency_ms } = req.body;
  setBotStatus({
    online: online ?? true,
    uptime_seconds: uptime_seconds ?? 0,
    guild_count: guild_count ?? 0,
    user_count: user_count ?? 0,
    latency_ms: latency_ms ?? 0,
    last_heartbeat: new Date().toISOString(),
  });
  res.json({ ok: true });
});

// POST /api/bot/guilds  — bot pushes full guild list every 30s
router.post('/guilds', requireBotKey, (req: Request, res: Response) => {
  const { guilds } = req.body;
  if (Array.isArray(guilds)) {
    setGuilds(guilds);
  }
  res.json({ ok: true });
});

// POST /api/bot/guild-event  — join/leave events
router.post('/guild-event', requireBotKey, (req: Request, res: Response) => {
  const { type, guild_id, guild_name, member_count, icon_url } = req.body;
  const db = getDb();
  if (type === 'join') {
    db.guilds[guild_id] = {
      guild_id,
      guild_name,
      member_count: member_count ?? 0,
      icon_url: icon_url ?? null,
      is_premium: false,
    };
  } else if (type === 'leave') {
    delete db.guilds[guild_id];
  }
  saveDb();
  res.json({ ok: true });
});

// POST /api/bot/dms  — DM log entries (acknowledged but not persisted)
router.post('/dms', requireBotKey, (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// POST /api/bot/logs  — bot log entries (acknowledged but not persisted)
router.post('/logs', requireBotKey, (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// GET /api/bot/settings/:guildId  — bot reads settings
router.get('/settings/:guildId', requireBotKey, (req: Request, res: Response) => {
  const guildId = req.params.guildId;
  const settings = getGuildSettings(guildId);
  res.json(settings);
});

// POST /api/bot/settings/:guildId  — bot writes settings
router.post('/settings/:guildId', requireBotKey, (req: Request, res: Response) => {
  const guildId = req.params.guildId;
  const db = getDb();
  db.settings[guildId] = req.body;
  saveDb();
  res.json({ ok: true });
});

export default router;

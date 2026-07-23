import { Router, Request, Response } from 'express';
import axios from 'axios';
import { requireAuth } from '../middleware/auth';
import { getGuilds, getGuildSettings, patchGuildSettings, getDb } from '../db';

const router = Router();

const DISCORD_API = 'https://discord.com/api/v10';

// GET /api/guilds  — user's guilds that have Onyx
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = req.session.access_token!;

    // Fetch guilds the user is in
    const userGuildsRes = await axios.get(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userGuilds: Array<{
      id: string;
      name: string;
      icon: string | null;
      owner: boolean;
      permissions: string;
    }> = userGuildsRes.data;

    // Filter to guilds where Onyx is present
    const botGuilds = getGuilds();
    const result = userGuilds
      .filter((g) => botGuilds[g.id])
      .map((g) => {
        const bot = botGuilds[g.id];
        return {
          id: g.id,
          name: g.name,
          icon: g.icon,
          owner: g.owner,
          permissions: g.permissions,
          is_premium: bot?.is_premium ?? false,
          member_count: bot?.member_count ?? 0,
          icon_url: bot?.icon_url ?? null,
        };
      });

    res.json(result);
  } catch (e: any) {
    console.error('[Guilds] Error fetching guilds:', e?.response?.data || e);
    res.status(500).json({ error: 'Failed to fetch guilds' });
  }
});

// GET /api/guilds/:guildId/settings
router.get('/:guildId/settings', requireAuth, (req: Request, res: Response) => {
  const { guildId } = req.params;
  const settings = getGuildSettings(guildId);
  const db = getDb();
  const guild = db.guilds[guildId];
  res.json({ settings, is_premium: guild?.is_premium ?? false });
});

// PATCH /api/guilds/:guildId/settings
router.patch('/:guildId/settings', requireAuth, (req: Request, res: Response) => {
  const { guildId } = req.params;
  const patch = req.body;

  // Validate user has manage permission for this guild (trust session for now)
  const updated = patchGuildSettings(guildId, patch);
  res.json({ ok: true, settings: updated });
});

// GET /api/guilds/:guildId/channels  — fetch live channels from Discord
router.get('/:guildId/channels', requireAuth, async (req: Request, res: Response) => {
  try {
    // Use bot token if available, else fall back to user token
    const botToken = process.env.BOT_TOKEN;
    const token = req.session.access_token!;

    const headers = botToken
      ? { Authorization: `Bot ${botToken}` }
      : { Authorization: `Bearer ${token}` };

    const channelsRes = await axios.get(
      `${DISCORD_API}/guilds/${req.params.guildId}/channels`,
      { headers }
    );

    const channels = channelsRes.data
      .filter((c: any) => c.type === 0) // text channels only
      .map((c: any) => ({ id: c.id, name: c.name, parent_id: c.parent_id }));

    res.json(channels);
  } catch (e: any) {
    console.error('[Channels] Error:', e?.response?.data || e);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// GET /api/guilds/:guildId/roles  — fetch live roles from Discord
router.get('/:guildId/roles', requireAuth, async (req: Request, res: Response) => {
  try {
    const botToken = process.env.BOT_TOKEN;
    const token = req.session.access_token!;

    const headers = botToken
      ? { Authorization: `Bot ${botToken}` }
      : { Authorization: `Bearer ${token}` };

    const rolesRes = await axios.get(
      `${DISCORD_API}/guilds/${req.params.guildId}/roles`,
      { headers }
    );

    const roles = rolesRes.data
      .filter((r: any) => !r.managed && r.name !== '@everyone')
      .map((r: any) => ({ id: r.id, name: r.name, color: r.color }));

    res.json(roles);
  } catch (e: any) {
    console.error('[Roles] Error:', e?.response?.data || e);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// GET /api/guilds/status  — bot status
router.get('/status/bot', (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.bot_status);
});

export default router;

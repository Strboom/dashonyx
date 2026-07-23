import { Router, Request, Response } from 'express';
import axios from 'axios';
import { requireAuth } from '../middleware/auth';
import { getGuilds, getGuildSettings, patchGuildSettings, getDb } from '../db';
import {
  fetchGuildState,
  postSelfrolePanel,
  updateSelfrolePanel,
  deleteSelfrolePanel,
  postTicketPanel,
  deleteTicketPanel,
  setPersonality,
  setAiChannels,
  setTicketSettings,
} from '../botApi';

const router = Router();
const DISCORD_API = 'https://discord.com/api/v10';

// Bitmask for the ADMINISTRATOR permission in Discord
const ADMINISTRATOR = BigInt(0x8);

// ── GET /api/guilds ──────────────────────────────────────────────────────────
// Returns only servers where the user has ADMINISTRATOR and Onyx is present.
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = req.session.access_token!;
    const userGuildsRes = await axios.get(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userGuilds: Array<{
      id: string; name: string; icon: string | null;
      owner: boolean; permissions: string;
    }> = userGuildsRes.data;

    const botGuilds = getGuilds();
    const result = userGuilds
      .filter((g) => {
        const isAdmin = (BigInt(g.permissions) & ADMINISTRATOR) === ADMINISTRATOR;
        return isAdmin && botGuilds[g.id];
      })
      .map((g) => {
        const bot = botGuilds[g.id];
        return {
          id: g.id, name: g.name, icon: g.icon, owner: g.owner,
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

// ── GET /api/guilds/:guildId/settings ────────────────────────────────────────
// Loads local settings then merges live state from the bot API.
router.get('/:guildId/settings', requireAuth, async (req: Request, res: Response) => {
  const { guildId } = req.params;
  const settings = getGuildSettings(guildId);
  const db = getDb();
  const guild = db.guilds[guildId];

  // Merge live bot state so panels/personality/AI channels are always current
  try {
    const live = await fetchGuildState(guildId);
    if (live) {
      // Self-role panels — bot is the source of truth for these
      if (live.selfrole_panels && typeof live.selfrole_panels === 'object') {
        const panels: Record<string, any> = {};
        for (const [pid, pdata] of Object.entries(live.selfrole_panels as Record<string, any>)) {
          panels[pid] = {
            title: pdata.title ?? '',
            roles: pdata.roles ?? [],
            message_id: pdata.message_id ?? null,
            channel_id: pdata.channel_id ?? null,
          };
        }
        settings.selfroles.panels = panels;
      }

      // Ticket settings — bot is the source of truth
      if (live.ticket_settings) {
        const tk = live.ticket_settings;
        settings.tickets = {
          panels: tk.panels ?? [],
          category_id: tk.category_id ?? null,
          support_roles: (tk.support_roles ?? []).map(String),
          welcome_message: tk.welcome_message || settings.tickets.welcome_message,
        };
      }

      // Personality from live bot memory
      if (live.personality) {
        settings.premium.personality = live.personality;
      }

      // AI channel settings from live bot memory
      if (live.ai) {
        settings.ai = {
          enabled_channels: (live.ai.enabled_channels ?? []).map(String),
          blocked_channels: (live.ai.blocked_channels ?? []).map(String),
          engage: live.ai.engage ?? false,
        };
      }
    }
  } catch {
    // If bot API is unreachable, serve local settings as fallback
  }

  res.json({ settings, is_premium: guild?.is_premium ?? false });
});

// ── PATCH /api/guilds/:guildId/settings ──────────────────────────────────────
// Saves locally, then syncs all changed sections to the bot in real-time.
router.patch('/:guildId/settings', requireAuth, async (req: Request, res: Response) => {
  const { guildId } = req.params;
  const patch = req.body;

  // Snapshot old settings for diffing
  const oldSettings = getGuildSettings(guildId);
  const updated = patchGuildSettings(guildId, patch);

  // ── Personality ────────────────────────────────────────────────────────────
  if (patch.premium?.personality !== undefined) {
    setPersonality(guildId, patch.premium.personality ?? '').catch(() => {});
  }

  // ── AI channels ────────────────────────────────────────────────────────────
  if (patch.ai) {
    setAiChannels(
      guildId,
      patch.ai.enabled_channels ?? [],
      patch.ai.blocked_channels ?? [],
      patch.ai.engage ?? false,
    ).catch(() => {});
  }

  // ── Ticket general settings (category, support roles, welcome message) ─────
  if (patch.tickets) {
    const tk = patch.tickets;
    setTicketSettings(guildId, {
      category_id: tk.category_id ?? null,
      support_roles: (tk.support_roles ?? []).map(String),
      welcome_message: tk.welcome_message,
    }).catch(() => {});

    // Post any new ticket panels that now have a channel_id set
    if (Array.isArray(tk.panels)) {
      for (const panel of tk.panels) {
        const oldPanel = (oldSettings.tickets.panels ?? []).find((p: any) => p.id === panel.id);
        const channelChanged = panel.channel_id && panel.channel_id !== oldPanel?.channel_id;
        const isNew = !panel.message_id;
        if (panel.channel_id && (isNew || channelChanged)) {
          postTicketPanel(guildId, panel.channel_id, panel)
            .then((result) => {
              if (result?.message_id) {
                // Store message_id back into local settings
                const cur = getGuildSettings(guildId);
                const tpanel = cur.tickets.panels.find((p: any) => p.id === panel.id);
                if (tpanel) {
                  tpanel.message_id = result.message_id;
                  tpanel.channel_id = panel.channel_id;
                  patchGuildSettings(guildId, { tickets: cur.tickets });
                }
              }
            })
            .catch(() => {});
        }
      }

      // Delete removed ticket panels from Discord
      for (const oldPanel of (oldSettings.tickets.panels ?? [])) {
        if (!tk.panels.find((p: any) => p.id === oldPanel.id)) {
          deleteTicketPanel(guildId, oldPanel.id).catch(() => {});
        }
      }
    }
  }

  // ── Self-role panels ───────────────────────────────────────────────────────
  if (patch.selfroles?.panels) {
    const newPanels = patch.selfroles.panels as Record<string, any>;
    const oldPanels = oldSettings.selfroles.panels as Record<string, any>;

    for (const [panelId, panel] of Object.entries(newPanels)) {
      const oldPanel = oldPanels[panelId];

      if (panel.channel_id && panel.roles?.length > 0) {
        const rolesChanged = JSON.stringify(panel.roles) !== JSON.stringify(oldPanel?.roles);
        const channelChanged = panel.channel_id !== oldPanel?.channel_id;
        const isNew = !oldPanel;

        if (isNew || channelChanged || !panel.message_id) {
          // Post (or re-post) the panel to Discord
          postSelfrolePanel(guildId, panelId, panel.channel_id, panel.title, panel.roles)
            .then((result) => {
              if (result?.message_id) {
                const cur = getGuildSettings(guildId);
                if (cur.selfroles.panels[panelId]) {
                  cur.selfroles.panels[panelId].message_id = result.message_id;
                  cur.selfroles.panels[panelId].channel_id = panel.channel_id;
                  patchGuildSettings(guildId, { selfroles: cur.selfroles });
                }
              }
            })
            .catch(() => {});
        } else if (rolesChanged && panel.message_id) {
          // Just update the existing Discord message in-place
          updateSelfrolePanel(guildId, panelId, panel.title, panel.roles).catch(() => {});
        }
      }
    }

    // Delete panels that were removed on the dashboard
    for (const panelId of Object.keys(oldPanels)) {
      if (!newPanels[panelId]) {
        deleteSelfrolePanel(guildId, panelId).catch(() => {});
      }
    }
  }

  res.json({ ok: true, settings: updated });
});

// ── POST /api/guilds/:guildId/selfrole/:panelId/post ──────────────────────────
// Explicit "Post to Discord" action — called when user clicks a Post button.
router.post('/:guildId/selfrole/:panelId/post', requireAuth, async (req: Request, res: Response) => {
  const { guildId, panelId } = req.params;
  const { channel_id } = req.body;
  if (!channel_id) return res.status(400).json({ error: 'channel_id required' });

  const settings = getGuildSettings(guildId);
  const panel = settings.selfroles.panels[panelId];
  if (!panel) return res.status(404).json({ error: 'Panel not found' });

  try {
    const result = await postSelfrolePanel(guildId, panelId, channel_id, panel.title, panel.roles);
    if (result?.message_id) {
      settings.selfroles.panels[panelId].message_id = result.message_id;
      settings.selfroles.panels[panelId].channel_id = channel_id;
      patchGuildSettings(guildId, { selfroles: settings.selfroles });
    }
    res.json({ ok: true, message_id: result?.message_id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/guilds/:guildId/ticket/:panelId/post ────────────────────────────
router.post('/:guildId/ticket/:panelId/post', requireAuth, async (req: Request, res: Response) => {
  const { guildId, panelId } = req.params;
  const { channel_id } = req.body;
  if (!channel_id) return res.status(400).json({ error: 'channel_id required' });

  const settings = getGuildSettings(guildId);
  const panel = settings.tickets.panels.find((p: any) => p.id === panelId);
  if (!panel) return res.status(404).json({ error: 'Panel not found' });

  try {
    const result = await postTicketPanel(guildId, channel_id, panel);
    if (result?.message_id) {
      panel.message_id = result.message_id;
      panel.channel_id = channel_id;
      patchGuildSettings(guildId, { tickets: settings.tickets });
    }
    res.json({ ok: true, message_id: result?.message_id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/guilds/:guildId/channels ─────────────────────────────────────────
router.get('/:guildId/channels', requireAuth, async (req: Request, res: Response) => {
  try {
    const botToken = process.env.BOT_TOKEN;
    const token = req.session.access_token!;
    const headers = botToken
      ? { Authorization: `Bot ${botToken}` }
      : { Authorization: `Bearer ${token}` };
    const channelsRes = await axios.get(`${DISCORD_API}/guilds/${req.params.guildId}/channels`, { headers });
    const channels = channelsRes.data
      .filter((c: any) => c.type === 0)
      .map((c: any) => ({ id: c.id, name: c.name, parent_id: c.parent_id }));
    res.json(channels);
  } catch (e: any) {
    console.error('[Channels] Error:', e?.response?.data || e);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// ── GET /api/guilds/:guildId/roles ────────────────────────────────────────────
router.get('/:guildId/roles', requireAuth, async (req: Request, res: Response) => {
  try {
    const botToken = process.env.BOT_TOKEN;
    const token = req.session.access_token!;
    const headers = botToken
      ? { Authorization: `Bot ${botToken}` }
      : { Authorization: `Bearer ${token}` };
    const rolesRes = await axios.get(`${DISCORD_API}/guilds/${req.params.guildId}/roles`, { headers });
    const roles = rolesRes.data
      .filter((r: any) => !r.managed && r.name !== '@everyone')
      .map((r: any) => ({ id: r.id, name: r.name, color: r.color }));
    res.json(roles);
  } catch (e: any) {
    console.error('[Roles] Error:', e?.response?.data || e);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// ── GET /api/guilds/status/bot ────────────────────────────────────────────────
router.get('/status/bot', requireAuth, (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.bot_status);
});

export default router;

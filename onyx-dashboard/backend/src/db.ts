import fs from 'fs';
import path from 'path';
import { DashboardData, GuildSettings } from './types';

const DATA_FILE = process.env.DASHBOARD_DATA_FILE || './dashboard_data.json';

const defaultGuildSettings = (): GuildSettings => ({
  welcome: {
    enabled: false,
    channelId: null,
    channelMessage: 'Welcome {mention} to **{server}**! 🎉 You are member #{count}.',
    dmEnabled: false,
    dmMessage: '',
  },
  selfroles: { panels: {} },
  tickets: {
    panels: [],
    category_id: null,
    support_roles: [],
    welcome_message: 'Hello {mention}! A staff member will be with you shortly.',
  },
  ai: {
    enabled_channels: [],
    blocked_channels: [],
    engage: false,
  },
  premium: {
    personality: '',
    pfp_request: null,
    pfp_pending: false,
  },
});

let _db: DashboardData = {
  guilds: {},
  settings: {},
  bot_status: {
    online: false,
    uptime_seconds: 0,
    guild_count: 0,
    user_count: 0,
    latency_ms: 0,
    last_heartbeat: null,
  },
};

export function loadDb(): void {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      _db = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[DB] Could not load data file, starting fresh:', e);
  }
}

export function saveDb(): void {
  try {
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(_db, null, 2), 'utf-8');
    fs.renameSync(tmp, DATA_FILE);
  } catch (e) {
    console.error('[DB] Save failed:', e);
  }
}

export function getDb(): DashboardData {
  return _db;
}

export function getBotStatus() {
  return _db.bot_status;
}

export function setBotStatus(status: Partial<DashboardData['bot_status']>) {
  _db.bot_status = { ..._db.bot_status, ...status };
  saveDb();
}

export function getGuilds(): Record<string, import('./types').BotGuild> {
  return _db.guilds;
}

export function setGuilds(guilds: import('./types').BotGuild[]) {
  const map: Record<string, import('./types').BotGuild> = {};
  for (const g of guilds) map[g.guild_id] = g;
  _db.guilds = map;
  saveDb();
}

export function getGuildSettings(guildId: string): GuildSettings {
  if (!_db.settings[guildId]) {
    _db.settings[guildId] = defaultGuildSettings();
  }
  return _db.settings[guildId];
}

export function setGuildSettings(guildId: string, settings: GuildSettings): void {
  _db.settings[guildId] = settings;
  saveDb();
}

export function patchGuildSettings(guildId: string, patch: Partial<GuildSettings>): GuildSettings {
  const current = getGuildSettings(guildId);
  const merged: GuildSettings = {
    ...current,
    ...patch,
    welcome: { ...current.welcome, ...(patch.welcome || {}) },
    selfroles: patch.selfroles ?? current.selfroles,
    tickets: { ...current.tickets, ...(patch.tickets || {}) },
    ai: { ...current.ai, ...(patch.ai || {}) },
    premium: { ...current.premium, ...(patch.premium || {}) },
  };
  _db.settings[guildId] = merged;
  saveDb();
  return merged;
}

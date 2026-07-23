/**
 * botApi.ts — calls the bot's HTTP API server (running on your VPS, port 11336).
 *
 * Set BOT_API_URL in Railway env vars to something like:
 *   http://YOUR_VPS_IP:11336
 *
 * The bot authenticates every request with the same BOT_WEBHOOK_KEY you already set.
 */

import axios from 'axios';

const BOT_API_URL = (process.env.BOT_API_URL || '').replace(/\/$/, '');
const BOT_API_KEY = process.env.BOT_WEBHOOK_KEY || '';

function headers() {
  return { 'X-Bot-Api-Key': BOT_API_KEY };
}

function botAvailable(): boolean {
  return BOT_API_URL.length > 0 && BOT_API_KEY.length > 0;
}

/** Fetch live guild state from the bot: panels, tickets, personality, AI channels */
export async function fetchGuildState(guildId: string): Promise<any | null> {
  if (!botAvailable()) return null;
  try {
    const res = await axios.get(`${BOT_API_URL}/state/${guildId}`, {
      headers: headers(),
      timeout: 6000,
    });
    return res.data;
  } catch (e: any) {
    console.warn('[BotAPI] fetchGuildState failed:', e?.response?.status ?? e?.message);
    return null;
  }
}

/** Tell the bot to post (or re-post) a self-role panel in a Discord channel */
export async function postSelfrolePanel(
  guildId: string,
  panelId: string,
  channelId: string,
  title: string,
  roles: Array<{ role_id: string; label: string; emoji: string | null }>,
): Promise<{ ok: boolean; message_id?: string } | null> {
  if (!botAvailable()) return null;
  try {
    const res = await axios.post(`${BOT_API_URL}/selfrole/post`, {
      guild_id: guildId,
      panel_id: panelId,
      channel_id: channelId,
      title,
      roles,
    }, { headers: headers(), timeout: 10000 });
    return res.data;
  } catch (e: any) {
    const msg = e?.response?.data?.error || e?.message || 'Failed to post panel';
    throw new Error(msg);
  }
}

/** Tell the bot to update (not re-post) an existing panel's roles/title */
export async function updateSelfrolePanel(
  guildId: string,
  panelId: string,
  title?: string,
  roles?: Array<{ role_id: string; label: string; emoji: string | null }>,
): Promise<void> {
  if (!botAvailable()) return;
  try {
    await axios.post(`${BOT_API_URL}/selfrole/update`, {
      guild_id: guildId,
      panel_id: panelId,
      title,
      roles,
    }, { headers: headers(), timeout: 8000 });
  } catch (e: any) {
    console.warn('[BotAPI] updateSelfrolePanel failed:', e?.response?.data ?? e?.message);
  }
}

/** Tell the bot to delete a self-role panel and remove its Discord message */
export async function deleteSelfrolePanel(guildId: string, panelId: string): Promise<void> {
  if (!botAvailable()) return;
  try {
    await axios.post(`${BOT_API_URL}/selfrole/delete`, {
      guild_id: guildId,
      panel_id: panelId,
    }, { headers: headers(), timeout: 6000 });
  } catch (e: any) {
    console.warn('[BotAPI] deleteSelfrolePanel failed:', e?.response?.data ?? e?.message);
  }
}

/** Tell the bot to post a ticket panel embed with button in a Discord channel */
export async function postTicketPanel(
  guildId: string,
  channelId: string,
  panel: any,
): Promise<{ ok: boolean; message_id?: string } | null> {
  if (!botAvailable()) return null;
  try {
    const res = await axios.post(`${BOT_API_URL}/ticket/post`, {
      guild_id: guildId,
      channel_id: channelId,
      panel,
    }, { headers: headers(), timeout: 10000 });
    return res.data;
  } catch (e: any) {
    const msg = e?.response?.data?.error || e?.message || 'Failed to post ticket panel';
    throw new Error(msg);
  }
}

/** Tell the bot to delete a ticket panel and its Discord message */
export async function deleteTicketPanel(guildId: string, panelId: string): Promise<void> {
  if (!botAvailable()) return;
  try {
    await axios.post(`${BOT_API_URL}/ticket/delete`, {
      guild_id: guildId,
      panel_id: panelId,
    }, { headers: headers(), timeout: 6000 });
  } catch (e: any) {
    console.warn('[BotAPI] deleteTicketPanel failed:', e?.response?.data ?? e?.message);
  }
}

/** Update personality on the bot for a premium server */
export async function setPersonality(guildId: string, personality: string): Promise<void> {
  if (!botAvailable()) return;
  try {
    await axios.patch(`${BOT_API_URL}/personality`, {
      guild_id: guildId,
      personality,
    }, { headers: headers(), timeout: 5000 });
  } catch (e: any) {
    console.warn('[BotAPI] setPersonality failed:', e?.response?.data ?? e?.message);
  }
}

/** Sync AI channel settings to the bot */
export async function setAiChannels(
  guildId: string,
  enabledChannels: string[],
  blockedChannels: string[],
  engage: boolean,
): Promise<void> {
  if (!botAvailable()) return;
  try {
    await axios.patch(`${BOT_API_URL}/ai-channels`, {
      guild_id: guildId,
      enabled_channels: enabledChannels,
      blocked_channels: blockedChannels,
      engage,
    }, { headers: headers(), timeout: 5000 });
  } catch (e: any) {
    console.warn('[BotAPI] setAiChannels failed:', e?.response?.data ?? e?.message);
  }
}

/** Sync ticket general settings (category, support roles, welcome message) */
export async function setTicketSettings(
  guildId: string,
  settings: { category_id?: string | null; support_roles?: string[]; welcome_message?: string },
): Promise<void> {
  if (!botAvailable()) return;
  try {
    await axios.patch(`${BOT_API_URL}/ticket-settings`, {
      guild_id: guildId,
      ...settings,
    }, { headers: headers(), timeout: 5000 });
  } catch (e: any) {
    console.warn('[BotAPI] setTicketSettings failed:', e?.response?.data ?? e?.message);
  }
}

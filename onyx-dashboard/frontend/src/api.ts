const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  me: () => request<{ id: string; username: string; avatar: string | null; global_name?: string }>('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Guilds
  guilds: () =>
    request<Array<{
      id: string;
      name: string;
      icon: string | null;
      icon_url: string | null;
      is_premium: boolean;
      member_count: number;
    }>>('/guilds'),

  guildSettings: (guildId: string) =>
    request<{ settings: GuildSettings; is_premium: boolean }>(`/guilds/${guildId}/settings`),

  saveSettings: (guildId: string, patch: Partial<GuildSettings>) =>
    request<{ ok: boolean; settings: GuildSettings }>(`/guilds/${guildId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  channels: (guildId: string) =>
    request<Array<{ id: string; name: string; parent_id: string | null }>>(`/guilds/${guildId}/channels`),

  roles: (guildId: string) =>
    request<Array<{ id: string; name: string; color: number }>>(`/guilds/${guildId}/roles`),

  botStatus: () =>
    request<{
      online: boolean;
      uptime_seconds: number;
      guild_count: number;
      user_count: number;
      latency_ms: number;
      last_heartbeat: string | null;
    }>('/guilds/status/bot'),
};

export interface GuildSettings {
  welcome: {
    enabled: boolean;
    channelId: string | null;
    channelMessage: string;
    dmEnabled: boolean;
    dmMessage: string;
  };
  selfroles: {
    panels: Record<string, {
      title: string;
      roles: Array<{ role_id: string; label: string; emoji: string | null }>;
      message_id: string | null;
      channel_id: string | null;
    }>;
  };
  tickets: {
    panels: Array<{
      id: string;
      name: string;
      description: string;
      button_label: string;
      button_emoji: string | null;
      channel_id: string | null;
      message_id: string | null;
    }>;
    category_id: string | null;
    support_roles: string[];
    welcome_message: string;
  };
  ai: {
    enabled_channels: string[];
    blocked_channels: string[];
    engage: boolean;
  };
  premium: {
    personality: string;
    pfp_request: string | null;
    pfp_pending: boolean;
  };
}

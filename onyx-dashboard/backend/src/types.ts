export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
}

export interface BotGuild {
  guild_id: string;
  guild_name: string;
  member_count: number;
  icon_url: string | null;
  is_premium: boolean;
  personality?: string;
  bot_pfp?: string;
}

export interface WelcomeSettings {
  enabled: boolean;
  channelId: string | null;
  channelMessage: string;
  dmEnabled: boolean;
  dmMessage: string;
}

export interface SelfRoleButton {
  role_id: string;
  label: string;
  emoji: string | null;
}

export interface SelfRolePanel {
  title: string;
  roles: SelfRoleButton[];
  message_id: string | null;
  channel_id: string | null;
}

export interface TicketPanel {
  id: string;
  name: string;
  description: string;
  button_label: string;
  button_emoji: string | null;
  channel_id: string | null;
  message_id: string | null;
}

export interface TicketSettings {
  panels: TicketPanel[];
  category_id: string | null;
  support_roles: string[];
  welcome_message: string;
}

export interface AISettings {
  enabled_channels: string[];
  blocked_channels: string[];
  engage: boolean;
}

export interface PremiumSettings {
  personality: string;
  pfp_request: string | null;
  pfp_pending: boolean;
}

export interface GuildSettings {
  welcome: WelcomeSettings;
  selfroles: { panels: Record<string, SelfRolePanel> };
  tickets: TicketSettings;
  ai: AISettings;
  premium: PremiumSettings;
}

export interface BotStatus {
  online: boolean;
  uptime_seconds: number;
  guild_count: number;
  user_count: number;
  latency_ms: number;
  last_heartbeat: string | null;
}

export interface DashboardData {
  guilds: Record<string, BotGuild>;
  settings: Record<string, GuildSettings>;
  bot_status: BotStatus;
}

declare module 'express-session' {
  interface SessionData {
    user?: DiscordUser;
    access_token?: string;
    refresh_token?: string;
  }
}

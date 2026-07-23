import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Star, Users, Menu, X, MessageSquare, ToggleLeft,
  Ticket, Cpu, Crown, ExternalLink, Hash,
} from 'lucide-react';
import { api, GuildSettings } from '../api';
import UnsavedBanner from '../components/UnsavedBanner';
import WelcomeModule from '../components/modules/WelcomeModule';
import SelfRolesModule from '../components/modules/SelfRolesModule';
import TicketsModule from '../components/modules/TicketsModule';
import AIModule from '../components/modules/AIModule';
import PremiumModule from '../components/modules/PremiumModule';

type Module = 'welcome' | 'selfroles' | 'tickets' | 'ai' | 'premium';

interface Guild {
  id: string; name: string; icon: string | null; icon_url: string | null;
  is_premium: boolean; member_count: number;
}

const MODULES: Array<{ id: Module; label: string; icon: React.ReactNode; premiumOnly?: boolean }> = [
  { id: 'welcome', label: 'Welcome', icon: <MessageSquare size={17} /> },
  { id: 'selfroles', label: 'Self Roles', icon: <ToggleLeft size={17} /> },
  { id: 'tickets', label: 'Tickets', icon: <Ticket size={17} /> },
  { id: 'ai', label: 'AI Management', icon: <Cpu size={17} /> },
  { id: 'premium', label: 'Premium', icon: <Crown size={17} />, premiumOnly: false },
];

function guildIcon(g: Guild) {
  if (g.icon_url) return g.icon_url;
  if (g.icon) return `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`;
  return null;
}

export default function Server({ user }: { user: any }) {
  const { guildId } = useParams<{ guildId: string }>();
  const [guild, setGuild] = useState<Guild | null>(null);
  const [settings, setSettings] = useState<GuildSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<GuildSettings | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeModule, setActiveModule] = useState<Module>('welcome');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const hasUnsaved = settings && savedSettings &&
    JSON.stringify(settings) !== JSON.stringify(savedSettings);

  useEffect(() => {
    if (!guildId) return;
    Promise.all([api.guilds(), api.guildSettings(guildId)])
      .then(([guilds, { settings: s, is_premium }]) => {
        const g = guilds.find(x => x.id === guildId);
        if (g) setGuild(g as Guild);
        setSettings(s);
        setSavedSettings(JSON.parse(JSON.stringify(s)));
        setIsPremium(is_premium);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [guildId]);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!settings || !guildId) return;
    setSaving(true);
    try {
      const { settings: updated } = await api.saveSettings(guildId, settings);
      setSettings(updated);
      setSavedSettings(JSON.parse(JSON.stringify(updated)));
      showToast('Changes saved successfully!', 'ok');
    } catch (e: any) {
      showToast(e.message || 'Failed to save', 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (savedSettings) {
      setSettings(JSON.parse(JSON.stringify(savedSettings)));
    }
  };

  const selectModule = (m: Module) => {
    setActiveModule(m);
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-indigo-300 text-sm">Loading server settings…</p>
        </div>
      </div>
    );
  }

  if (!settings || !guild) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-sm">
          <p className="text-slate-400 mb-4">Server not found or Onyx isn't in this server.</p>
          <Link to="/dashboard" className="btn-indigo text-sm inline-block">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const icon = guildIcon(guild);
  const currentModule = MODULES.find(m => m.id === activeModule)!;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <nav
        className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 py-3"
        style={{
          background: 'rgba(5,7,20,0.9)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(99,102,241,0.15)',
        }}
      >
        <Link to="/dashboard" className="text-slate-400 hover:text-indigo-400 transition-colors p-1">
          <ArrowLeft size={18} />
        </Link>

        {icon ? (
          <img src={icon} alt={guild.name} className="w-8 h-8 rounded-xl object-cover shrink-0"
            style={{ border: '2px solid rgba(99,102,241,0.4)' }} />
        ) : (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #312e81, #4f46e5)' }}>
            {guild.name.charAt(0)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm truncate">{guild.name}</span>
            {isPremium && (
              <span className="premium-badge shrink-0"><Star size={9} fill="currentColor" /> Pro</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Users size={10} />{guild.member_count.toLocaleString()} members
          </div>
        </div>

        <a href="https://discord.gg/GGa4QCq4km" target="_blank" rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg"
          style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
          <ExternalLink size={12} /> Support
        </a>

        {/* Hamburger (mobile) */}
        <button
          className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors"
          style={{ border: '1px solid rgba(99,102,241,0.2)' }}
          onClick={() => setSidebarOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      <div className="flex flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 gap-6">
        {/* Sidebar — desktop always visible, mobile drawer */}
        <aside
          className={`
            ${sidebarOpen ? 'fixed inset-0 z-20 flex' : 'hidden'}
            sm:relative sm:flex sm:inset-auto sm:z-auto
            flex-col
          `}
          style={{ flexBasis: '220px', minWidth: '220px' }}
        >
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 sm:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div
            className={`
              ${sidebarOpen ? 'relative z-10 w-72 h-full' : ''}
              sm:w-auto sm:h-auto
              flex flex-col gap-1 p-4 sm:p-0
            `}
            style={sidebarOpen ? {
              background: '#060817',
              borderRight: '1px solid rgba(99,102,241,0.2)',
            } : {}}
          >
            {/* Mobile title */}
            {sidebarOpen && (
              <div className="flex items-center justify-between mb-4 sm:hidden">
                <span className="font-semibold text-white text-sm">Modules</span>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>
            )}

            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-2 px-1">
              Modules
            </p>

            {MODULES.map(mod => (
              <button
                key={mod.id}
                onClick={() => selectModule(mod.id)}
                className={`module-item ${activeModule === mod.id ? 'active' : ''}`}
              >
                {mod.icon}
                <span className="flex-1 text-left">{mod.label}</span>
                {mod.id === 'premium' && !isPremium && (
                  <Crown size={12} className="text-amber-400/60" />
                )}
              </button>
            ))}

            <div className="mt-auto pt-4 border-t border-white/5 sm:hidden">
              <a
                href="https://discord.gg/GGa4QCq4km"
                target="_blank"
                rel="noopener noreferrer"
                className="module-item"
              >
                <ExternalLink size={17} />
                Support Server
              </a>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Module Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
              {currentModule.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{currentModule.label}</h2>
              <p className="text-xs text-slate-500">
                {activeModule === 'welcome' && 'Manage welcome messages and DMs for new members'}
                {activeModule === 'selfroles' && 'Let members self-assign roles with button panels'}
                {activeModule === 'tickets' && 'Set up support ticket panels for your server'}
                {activeModule === 'ai' && 'Control where and how Onyx AI responds'}
                {activeModule === 'premium' && 'Exclusive features for Onyx Premium servers'}
              </p>
            </div>
          </div>

          {/* Active Module */}
          {activeModule === 'welcome' && (
            <WelcomeModule
              guildId={guildId!}
              settings={settings.welcome}
              onChange={w => setSettings(s => s ? { ...s, welcome: w } : s)}
            />
          )}
          {activeModule === 'selfroles' && (
            <SelfRolesModule
              guildId={guildId!}
              settings={settings.selfroles}
              onChange={sr => setSettings(s => s ? { ...s, selfroles: sr } : s)}
            />
          )}
          {activeModule === 'tickets' && (
            <TicketsModule
              guildId={guildId!}
              settings={settings.tickets}
              onChange={t => setSettings(s => s ? { ...s, tickets: t } : s)}
            />
          )}
          {activeModule === 'ai' && (
            <AIModule
              guildId={guildId!}
              settings={settings.ai}
              onChange={ai => setSettings(s => s ? { ...s, ai } : s)}
            />
          )}
          {activeModule === 'premium' && (
            <PremiumModule
              settings={settings.premium}
              isPremium={isPremium}
              onChange={p => setSettings(s => s ? { ...s, premium: p } : s)}
            />
          )}
        </main>
      </div>

      {/* Unsaved Banner */}
      {hasUnsaved && (
        <UnsavedBanner onSave={handleSave} onReset={handleReset} saving={saving} />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium animate-slide-up flex items-center gap-2"
          style={{
            background: toast.type === 'ok' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'ok' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: toast.type === 'ok' ? '#34d399' : '#f87171',
            backdropFilter: 'blur(12px)',
          }}
        >
          {toast.type === 'ok' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </div>
  );
}

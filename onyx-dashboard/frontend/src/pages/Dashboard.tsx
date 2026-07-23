import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { LogOut, Users, Star, ExternalLink, Hash } from 'lucide-react';

interface User { id: string; username: string; avatar: string | null; global_name?: string; }
interface Guild { id: string; name: string; icon: string | null; icon_url: string | null; is_premium: boolean; member_count: number; }

function avatarUrl(user: User) {
  if (!user.avatar) return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
}

function guildIcon(g: Guild) {
  if (g.icon_url) return g.icon_url;
  if (g.icon) return `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`;
  return null;
}

export default function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.guilds()
      .then(setGuilds)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await api.logout();
    onLogout();
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <nav
        className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3"
        style={{
          background: 'rgba(5,7,20,0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(99,102,241,0.15)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">✦</span>
          <span className="font-bold text-lg text-galaxy">Onyx</span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://discord.gg/GGa4QCq4km"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg"
            style={{ border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <ExternalLink size={12} /> Support
          </a>
          <div className="flex items-center gap-2">
            <img
              src={avatarUrl(user)}
              alt={user.username}
              className="w-8 h-8 rounded-full"
              style={{ border: '2px solid rgba(99,102,241,0.5)' }}
            />
            <span className="hidden sm:block text-sm text-slate-300 max-w-24 truncate">
              {user.global_name || user.username}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6 animate-slide-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Your Servers
          </h1>
          <p className="text-slate-400 text-sm">
            {loading ? 'Loading…' : `${guilds.length} server${guilds.length !== 1 ? 's' : ''} with Onyx`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="glass-card h-32 animate-pulse"
                style={{ animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
        ) : guilds.length === 0 ? (
          <div className="glass-card p-12 text-center animate-fade-in">
            <div className="text-4xl mb-3">✦</div>
            <h3 className="text-lg font-semibold text-white mb-2">No servers found</h3>
            <p className="text-slate-400 text-sm mb-4">
              Onyx isn't in any servers you're in yet.
            </p>
            <a
              href="https://discord.gg/GGa4QCq4km"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-indigo inline-flex items-center gap-2 text-sm"
            >
              Get Help <ExternalLink size={13} />
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {guilds.map((g, i) => {
              const icon = guildIcon(g);
              return (
                <Link
                  key={g.id}
                  to={`/server/${g.id}`}
                  className="glass-card glass-card-hover p-5 flex items-center gap-4 no-underline animate-slide-up"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="shrink-0">
                    {icon ? (
                      <img
                        src={icon}
                        alt={g.name}
                        className="w-14 h-14 rounded-2xl object-cover"
                        style={{ border: '2px solid rgba(99,102,241,0.3)' }}
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white"
                        style={{
                          background: 'linear-gradient(135deg, #312e81, #4f46e5)',
                          border: '2px solid rgba(99,102,241,0.3)',
                        }}
                      >
                        {g.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white truncate text-sm">{g.name}</span>
                      {g.is_premium && (
                        <span className="premium-badge shrink-0">
                          <Star size={9} fill="currentColor" /> Pro
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Users size={11} />
                      {g.member_count.toLocaleString()} members
                    </div>
                  </div>
                  <Hash size={16} className="text-indigo-400/50 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}

        {/* Support */}
        <div className="mt-12 text-center animate-fade-in">
          <a
            href="https://discord.gg/GGa4QCq4km"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-400 transition-colors"
          >
            <ExternalLink size={13} />
            Need help? Join the Onyx Support Server
          </a>
        </div>
      </div>
    </div>
  );
}

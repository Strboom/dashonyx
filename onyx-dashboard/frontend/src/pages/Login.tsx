import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Star } from 'lucide-react';

export default function Login() {
  const [params] = useSearchParams();
  const error = params.get('error');
  const [hovered, setHovered] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo + Name */}
      <div className="flex flex-col items-center gap-4 mb-12 animate-fade-in">
        <div
          className="relative"
          style={{
            animation: 'float 6s ease-in-out infinite',
          }}
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
            style={{
              background: 'linear-gradient(135deg, #312e81, #4f46e5)',
              boxShadow: '0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2)',
            }}
          >
            ✦
          </div>
          {/* Orbiting stars */}
          <Star
            size={10}
            className="text-indigo-300 absolute"
            style={{ top: '-4px', right: '-4px', animation: 'twinkle 2s ease-in-out infinite' }}
            fill="currentColor"
          />
          <Star
            size={8}
            className="text-purple-300 absolute"
            style={{ bottom: '-2px', left: '-6px', animation: 'twinkle 2.5s ease-in-out infinite 0.5s' }}
            fill="currentColor"
          />
        </div>

        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-2">
            <span className="text-galaxy">Onyx</span>
          </h1>
          <p className="text-slate-400 text-sm tracking-widest uppercase font-medium">
            ✦ Dashboard ✦
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div
        className="glass-card p-8 w-full max-w-sm animate-slide-up"
        style={{ animationDelay: '0.1s' }}
      >
        <h2 className="text-xl font-semibold text-white text-center mb-2">
          Welcome back
        </h2>
        <p className="text-slate-400 text-sm text-center mb-6">
          Sign in with Discord to manage your servers
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-10 text-sm text-red-300 bg-red-900/20 border border-red-500/30">
            Login failed. Please try again.
          </div>
        )}

        <a
          href="/api/auth/discord"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="flex items-center justify-center gap-3 w-full py-3 px-6 rounded-xl font-semibold text-white text-sm transition-all duration-200"
          style={{
            background: hovered
              ? 'linear-gradient(135deg, #5865F2, #7289DA)'
              : 'linear-gradient(135deg, #4752C4, #5865F2)',
            boxShadow: hovered
              ? '0 4px 25px rgba(88,101,242,0.6)'
              : '0 4px 15px rgba(88,101,242,0.4)',
            transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          }}
        >
          {/* Discord icon */}
          <svg width="20" height="20" viewBox="0 0 71 55" fill="none">
            <path
              d="M60.1 4.9A58.6 58.6 0 0 0 45.5.7a40.4 40.4 0 0 0-1.8 3.7 54.2 54.2 0 0 0-16.3 0 39 39 0 0 0-1.9-3.7A58.5 58.5 0 0 0 10.9 4.9C1.6 18.7-1 32.1.3 45.3a59 59 0 0 0 18 9.1 44.5 44.5 0 0 0 3.8-6.2 38.3 38.3 0 0 1-6-2.9l1.5-1.1a42.2 42.2 0 0 0 36.1 0c.5.4 1 .8 1.5 1.1a38.2 38.2 0 0 1-6 2.9 44.7 44.7 0 0 0 3.8 6.2 58.8 58.8 0 0 0 18-9.1C72.4 29.7 68.8 16.4 60.1 4.9ZM23.7 37.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2Zm23.5 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2Z"
              fill="white"
            />
          </svg>
          Login with Discord
        </a>

        <div className="mt-4 flex items-center gap-2 justify-center">
          <div className="h-px flex-1 bg-white/5" />
          <Sparkles size={12} className="text-indigo-400" />
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <p className="text-xs text-slate-500 text-center mt-4">
          You will only see servers where Onyx is present
        </p>
      </div>

      {/* Support Server */}
      <div className="mt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <a
          href="https://discord.gg/GGa4QCq4km"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <svg width="14" height="11" viewBox="0 0 71 55" fill="none">
            <path
              d="M60.1 4.9A58.6 58.6 0 0 0 45.5.7a40.4 40.4 0 0 0-1.8 3.7 54.2 54.2 0 0 0-16.3 0 39 39 0 0 0-1.9-3.7A58.5 58.5 0 0 0 10.9 4.9C1.6 18.7-1 32.1.3 45.3a59 59 0 0 0 18 9.1 44.5 44.5 0 0 0 3.8-6.2 38.3 38.3 0 0 1-6-2.9l1.5-1.1a42.2 42.2 0 0 0 36.1 0c.5.4 1 .8 1.5 1.1a38.2 38.2 0 0 1-6 2.9 44.7 44.7 0 0 0 3.8 6.2 58.8 58.8 0 0 0 18-9.1C72.4 29.7 68.8 16.4 60.1 4.9ZM23.7 37.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2Zm23.5 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2Z"
              fill="currentColor"
            />
          </svg>
          Join the Onyx Support Server
        </a>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Star, Brain, Camera, Lock, ExternalLink } from 'lucide-react';
import { GuildSettings } from '../../api';

interface Props {
  settings: GuildSettings['premium'];
  isPremium: boolean;
  onChange: (p: GuildSettings['premium']) => void;
}

export default function PremiumModule({ settings, isPremium, onChange }: Props) {
  const [pfpInput, setPfpInput] = useState(settings.pfp_request || '');

  if (!isPremium) {
    return (
      <div className="animate-fade-in">
        <div className="glass-card p-8 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(245,158,11,0.15))',
              border: '1px solid rgba(234,179,8,0.3)',
            }}
          >
            <Lock size={28} className="text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Premium Required</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
            These features are exclusive to Onyx Premium servers.
            Join the support server to learn how to upgrade.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://discord.gg/GGa4QCq4km"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-indigo inline-flex items-center gap-2 text-sm"
            >
              Join Support Server <ExternalLink size={13} />
            </a>
          </div>
          <div className="mt-8 space-y-3 text-left max-w-sm mx-auto">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-3">Premium Features</p>
            {[
              { icon: Brain, label: 'Custom AI Personality', desc: "Set Onyx's personality for your server" },
              { icon: Camera, label: "Bot Profile Picture", desc: 'Request a custom avatar for your server' },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-3 rounded-xl opacity-50"
                style={{ background: 'rgba(15,16,40,0.6)', border: '1px solid rgba(99,102,241,0.15)' }}
              >
                <Icon size={16} className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <span className="premium-badge">
          <Star size={10} fill="currentColor" /> Premium Active
        </span>
      </div>

      {/* AI Personality */}
      <section className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(99,102,241,0.2))' }}
          >
            <Brain size={18} className="text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">AI Personality</h3>
            <p className="text-xs text-slate-400 mt-0.5">Customize how Onyx behaves in your server</p>
          </div>
        </div>
        <textarea
          className="input-galaxy resize-none"
          rows={5}
          placeholder="Example: You are Onyx, a sarcastic but helpful AI assistant for a gaming community. Keep responses short and use gaming references when possible."
          value={settings.personality}
          onChange={e => onChange({ ...settings, personality: e.target.value })}
        />
        <p className="text-xs text-slate-500 mt-2">
          Describe how you want Onyx to respond in your server. This overrides the default personality.
        </p>
      </section>

      {/* Bot PFP */}
      <section className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))' }}
          >
            <Camera size={18} className="text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Server Bot Profile Picture</h3>
            <p className="text-xs text-slate-400 mt-0.5">Request a custom avatar — reviewed by bot admin</p>
          </div>
        </div>

        {settings.pfp_pending && (
          <div
            className="mb-3 px-3 py-2 rounded-lg text-xs text-amber-300 flex items-center gap-2"
            style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            A PFP change request is pending admin approval
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Image URL (direct link to .png / .jpg / .gif / .webp)
          </label>
          <input
            type="url"
            className="input-galaxy"
            placeholder="https://example.com/avatar.png"
            value={pfpInput}
            onChange={e => {
              setPfpInput(e.target.value);
              onChange({ ...settings, pfp_request: e.target.value || null, pfp_pending: false });
            }}
          />
        </div>
        {pfpInput && (
          <div className="mt-3 flex items-center gap-3">
            <img
              src={pfpInput}
              alt="Preview"
              className="w-12 h-12 rounded-xl object-cover"
              style={{ border: '2px solid rgba(99,102,241,0.4)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <p className="text-xs text-slate-500">
              Preview of requested avatar. A DM will be sent to the bot admin for approval.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Trash2, Cpu, Ban, Zap, ZapOff, Info } from 'lucide-react';
import { GuildSettings, api } from '../../api';

interface Props {
  guildId: string;
  settings: GuildSettings['ai'];
  onChange: (ai: GuildSettings['ai']) => void;
}

export default function AIModule({ guildId, settings, onChange }: Props) {
  const [channels, setChannels] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingCh, setLoadingCh] = useState(false);
  const [pickEnabled, setPickEnabled] = useState('');
  const [pickBlocked, setPickBlocked] = useState('');

  useEffect(() => {
    setLoadingCh(true);
    api.channels(guildId)
      .then(setChannels)
      .catch(() => [])
      .finally(() => setLoadingCh(false));
  }, [guildId]);

  const nameOf = (id: string) => channels.find(c => c.id === id)?.name ?? id;

  const addEnabled = () => {
    if (!pickEnabled || settings.enabled_channels.includes(pickEnabled)) return;
    onChange({ ...settings, enabled_channels: [...settings.enabled_channels, pickEnabled] });
    setPickEnabled('');
  };

  const removeEnabled = (id: string) =>
    onChange({ ...settings, enabled_channels: settings.enabled_channels.filter(c => c !== id) });

  const addBlocked = () => {
    if (!pickBlocked || settings.blocked_channels.includes(pickBlocked)) return;
    onChange({ ...settings, blocked_channels: [...settings.blocked_channels, pickBlocked] });
    setPickBlocked('');
  };

  const removeBlocked = (id: string) =>
    onChange({ ...settings, blocked_channels: settings.blocked_channels.filter(c => c !== id) });

  const alreadyEnabled = new Set(settings.enabled_channels);
  const alreadyBlocked = new Set(settings.blocked_channels);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Engage / Disengage */}
      <section className="glass-card p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              {settings.engage ? (
                <Zap size={18} className="text-emerald-400" />
              ) : (
                <ZapOff size={18} className="text-slate-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Random Engagement</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {settings.engage
                  ? 'Onyx randomly chimes into conversations'
                  : 'Onyx only responds when @mentioned or called by name'}
              </p>
            </div>
          </div>
          <label className="toggle-switch shrink-0">
            <input
              type="checkbox"
              checked={settings.engage}
              onChange={e => onChange({ ...settings, engage: e.target.checked })}
            />
            <span className="toggle-slider" />
          </label>
        </div>
        <div
          className="mt-3 flex items-start gap-2 text-xs text-slate-500 p-3 rounded-lg"
          style={{ background: 'rgba(15,16,40,0.5)' }}
        >
          <Info size={12} className="text-indigo-400 mt-0.5 shrink-0" />
          Equivalent to running <code className="text-indigo-400 mx-1">{settings.engage ? '+engage' : '+disengage'}</code> in your server.
        </div>
      </section>

      {/* Enabled Channels */}
      <section className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Cpu size={18} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">AI-Enabled Channels</h3>
            <p className="text-xs text-slate-400 mt-0.5">Onyx will always respond in these channels</p>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <select
            className="input-galaxy flex-1"
            value={pickEnabled}
            onChange={e => setPickEnabled(e.target.value)}
            disabled={loadingCh}
          >
            <option value="">
              {loadingCh ? 'Loading channels…' : '— Select channel to enable —'}
            </option>
            {channels
              .filter(c => !alreadyEnabled.has(c.id) && !alreadyBlocked.has(c.id))
              .map(c => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
          </select>
          <button onClick={addEnabled} disabled={!pickEnabled} className="btn-indigo px-3 py-2">
            <Plus size={16} />
          </button>
        </div>

        {settings.enabled_channels.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No channels added yet. Onyx responds when @mentioned.</p>
        ) : (
          <div className="space-y-2">
            {settings.enabled_channels.map(id => (
              <div
                key={id}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                <span className="text-sm text-indigo-300 flex items-center gap-1.5">
                  <span className="text-slate-500">#</span>{nameOf(id)}
                </span>
                <button onClick={() => removeEnabled(id)} className="text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Blocked Channels */}
      <section className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Ban size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">AI-Blocked Channels</h3>
            <p className="text-xs text-slate-400 mt-0.5">Onyx will never respond in these channels</p>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <select
            className="input-galaxy flex-1"
            value={pickBlocked}
            onChange={e => setPickBlocked(e.target.value)}
            disabled={loadingCh}
          >
            <option value="">
              {loadingCh ? 'Loading channels…' : '— Select channel to block —'}
            </option>
            {channels
              .filter(c => !alreadyBlocked.has(c.id) && !alreadyEnabled.has(c.id))
              .map(c => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
          </select>
          <button onClick={addBlocked} disabled={!pickBlocked} className="btn-danger px-3 py-2">
            <Plus size={16} />
          </button>
        </div>

        {settings.blocked_channels.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No channels blocked.</p>
        ) : (
          <div className="space-y-2">
            {settings.blocked_channels.map(id => (
              <div
                key={id}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <span className="text-sm text-red-300 flex items-center gap-1.5">
                  <span className="text-slate-500">#</span>{nameOf(id)}
                </span>
                <button onClick={() => removeBlocked(id)} className="text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

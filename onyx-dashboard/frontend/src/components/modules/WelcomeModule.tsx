import { useState, useEffect } from 'react';
import { Hash, MessageSquare, Bell } from 'lucide-react';
import { GuildSettings, api } from '../../api';

interface Props {
  guildId: string;
  settings: GuildSettings['welcome'];
  onChange: (w: GuildSettings['welcome']) => void;
}

export default function WelcomeModule({ guildId, settings, onChange }: Props) {
  const [channels, setChannels] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  useEffect(() => {
    setLoadingChannels(true);
    api.channels(guildId)
      .then(setChannels)
      .catch(() => setChannels([]))
      .finally(() => setLoadingChannels(false));
  }, [guildId]);

  const set = <K extends keyof GuildSettings['welcome']>(key: K, val: GuildSettings['welcome'][K]) =>
    onChange({ ...settings, [key]: val });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Channel Welcome */}
      <section className="glass-card p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Hash size={18} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Channel Welcome Message</h3>
              <p className="text-xs text-slate-400 mt-0.5">Send a message when someone joins the server</p>
            </div>
          </div>
          <label className="toggle-switch shrink-0">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={e => set('enabled', e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {settings.enabled && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Welcome Channel
              </label>
              {loadingChannels ? (
                <div className="input-galaxy opacity-50">Loading channels…</div>
              ) : (
                <select
                  className="input-galaxy"
                  value={settings.channelId || ''}
                  onChange={e => set('channelId', e.target.value || null)}
                >
                  <option value="">— Select a channel —</option>
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>#{c.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Welcome Message
              </label>
              <textarea
                className="input-galaxy resize-none"
                rows={3}
                placeholder="Welcome {mention} to **{server}**! 🎉 You're member #{count}."
                value={settings.channelMessage}
                onChange={e => set('channelMessage', e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Variables: <code className="text-indigo-400">{'{mention}'}</code> <code className="text-indigo-400">{'{server}'}</code> <code className="text-indigo-400">{'{count}'}</code>
              </p>
            </div>
          </div>
        )}
      </section>

      {/* DM Welcome */}
      <section className="glass-card p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <MessageSquare size={18} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Welcome DM</h3>
              <p className="text-xs text-slate-400 mt-0.5">Send a private DM to new members</p>
            </div>
          </div>
          <label className="toggle-switch shrink-0">
            <input
              type="checkbox"
              checked={settings.dmEnabled}
              onChange={e => set('dmEnabled', e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {settings.dmEnabled && (
          <div className="pt-1">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              DM Message
            </label>
            <textarea
              className="input-galaxy resize-none"
              rows={4}
              placeholder="Welcome to the server! Feel free to ask if you need any help 👋"
              value={settings.dmMessage}
              onChange={e => set('dmMessage', e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">
              This message is sent privately to each new member
            </p>
          </div>
        )}
      </section>

      {/* Preview */}
      {(settings.enabled || settings.dmEnabled) && (
        <section className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-indigo-400" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Preview</span>
          </div>
          {settings.enabled && settings.channelMessage && (
            <div
              className="text-sm text-slate-300 p-3 rounded-lg mb-2"
              style={{ background: 'rgba(30,27,75,0.5)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              {settings.channelMessage
                .replace('{mention}', '@NewUser')
                .replace('{server}', 'Your Server')
                .replace('{count}', '42')}
            </div>
          )}
          {settings.dmEnabled && settings.dmMessage && (
            <div
              className="text-sm text-slate-300 p-3 rounded-lg"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              <span className="text-xs text-purple-400 block mb-1">DM Preview:</span>
              {settings.dmMessage}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

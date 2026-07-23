import { useState, useEffect } from 'react';
import { Plus, Trash2, Ticket, Shield, FolderOpen } from 'lucide-react';
import { GuildSettings, api } from '../../api';

type TicketPanel = GuildSettings['tickets']['panels'][number];

interface Props {
  guildId: string;
  settings: GuildSettings['tickets'];
  onChange: (t: GuildSettings['tickets']) => void;
}

export default function TicketsModule({ guildId, settings, onChange }: Props) {
  const [channels, setChannels] = useState<Array<{ id: string; name: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pickRole, setPickRole] = useState('');
  const [pickCategory, setPickCategory] = useState('');
  const [newPanel, setNewPanel] = useState({
    name: '', description: '', button_label: 'Open a Ticket', button_emoji: '🎫', channel: '',
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([api.channels(guildId), api.roles(guildId)])
      .then(([c, r]) => { setChannels(c); setRoles(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [guildId]);

  const channelName = (id: string) => channels.find(c => c.id === id)?.name ?? id;
  const roleName = (id: string) => roles.find(r => r.id === id)?.name ?? id;

  function createPanel() {
    if (!newPanel.name.trim()) return;
    const panel: TicketPanel = {
      id: String(Date.now()),
      name: newPanel.name.trim(),
      description: newPanel.description || 'Click the button below to open a support ticket.',
      button_label: newPanel.button_label || 'Open a Ticket',
      button_emoji: newPanel.button_emoji || null,
      channel_id: newPanel.channel || null,
      message_id: null,
    };
    onChange({ ...settings, panels: [...settings.panels, panel] });
    setNewPanel({ name: '', description: '', button_label: 'Open a Ticket', button_emoji: '🎫', channel: '' });
    setExpandedId(panel.id);
  }

  function deletePanel(id: string) {
    onChange({ ...settings, panels: settings.panels.filter(p => p.id !== id) });
    if (expandedId === id) setExpandedId(null);
  }

  function updatePanel(id: string, patch: Partial<TicketPanel>) {
    onChange({
      ...settings,
      panels: settings.panels.map(p => p.id === id ? { ...p, ...patch } : p),
    });
  }

  function addSupportRole() {
    if (!pickRole || settings.support_roles.includes(pickRole)) return;
    onChange({ ...settings, support_roles: [...settings.support_roles, pickRole] });
    setPickRole('');
  }

  function removeSupportRole(id: string) {
    onChange({ ...settings, support_roles: settings.support_roles.filter(r => r !== id) });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* General Settings */}
      <section className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center">
            <FolderOpen size={18} className="text-sky-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">General Ticket Settings</h3>
        </div>

        {/* Welcome Message */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Ticket Welcome Message</label>
          <textarea
            className="input-galaxy resize-none"
            rows={2}
            placeholder="Hello {mention}! A staff member will be with you shortly."
            value={settings.welcome_message}
            onChange={e => onChange({ ...settings, welcome_message: e.target.value })}
          />
          <p className="text-xs text-slate-500 mt-1">Variables: <code className="text-indigo-400">{'{mention}'}</code> <code className="text-indigo-400">{'{name}'}</code></p>
        </div>

        {/* Support Roles */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Shield size={12} className="text-emerald-400" /> Support Staff Roles
          </label>
          <div className="flex gap-2 mb-2">
            <select
              className="input-galaxy flex-1"
              value={pickRole}
              onChange={e => setPickRole(e.target.value)}
              disabled={loading}
            >
              <option value="">— Add support role —</option>
              {roles
                .filter(r => !settings.support_roles.includes(r.id))
                .map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button onClick={addSupportRole} disabled={!pickRole} className="btn-indigo px-3 py-2">
              <Plus size={16} />
            </button>
          </div>
          {settings.support_roles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {settings.support_roles.map(id => (
                <span key={id} className="tag flex items-center gap-1.5">
                  @{roleName(id)}
                  <button onClick={() => removeSupportRole(id)} className="hover:text-red-400 transition-colors">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Create Panel */}
      <section className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Ticket size={18} className="text-indigo-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">Create Ticket Panel</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Panel Name *</label>
            <input
              type="text"
              className="input-galaxy"
              placeholder="Support"
              value={newPanel.name}
              onChange={e => setNewPanel(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Post to Channel</label>
            <select
              className="input-galaxy"
              value={newPanel.channel}
              onChange={e => setNewPanel(p => ({ ...p, channel: e.target.value }))}
              disabled={loading}
            >
              <option value="">— Select channel —</option>
              {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Button Label</label>
            <input type="text" className="input-galaxy" placeholder="Open a Ticket"
              value={newPanel.button_label} onChange={e => setNewPanel(p => ({ ...p, button_label: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Button Emoji</label>
            <input type="text" className="input-galaxy" placeholder="🎫"
              value={newPanel.button_emoji} onChange={e => setNewPanel(p => ({ ...p, button_emoji: e.target.value }))} />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-slate-400 mb-1">Panel Description</label>
          <textarea className="input-galaxy resize-none" rows={2}
            placeholder="Click the button below to open a support ticket."
            value={newPanel.description} onChange={e => setNewPanel(p => ({ ...p, description: e.target.value }))} />
        </div>
        <button onClick={createPanel} disabled={!newPanel.name.trim()} className="btn-indigo flex items-center gap-1.5 text-sm">
          <Plus size={15} /> Create Panel
        </button>
      </section>

      {/* Existing Panels */}
      {settings.panels.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Ticket size={32} className="text-indigo-400/40 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No ticket panels yet. Create one above.</p>
        </div>
      ) : (
        settings.panels.map(panel => (
          <section key={panel.id} className="glass-card overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer"
              style={{ background: expandedId === panel.id ? 'rgba(99,102,241,0.08)' : 'transparent' }}
              onClick={() => setExpandedId(expandedId === panel.id ? null : panel.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{panel.button_emoji || '🎫'}</span>
                <div>
                  <span className="font-semibold text-white text-sm">{panel.name}</span>
                  {panel.channel_id && (
                    <span className="text-xs text-slate-500 ml-2">#{channelName(panel.channel_id)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); deletePanel(panel.id); }}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
                <span className="text-slate-500 text-xs">{expandedId === panel.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expandedId === panel.id && (
              <div className="px-5 pb-5 border-t border-white/5 space-y-3 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Panel Name</label>
                    <input type="text" className="input-galaxy" value={panel.name}
                      onChange={e => updatePanel(panel.id, { name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Channel</label>
                    <select className="input-galaxy" value={panel.channel_id || ''}
                      onChange={e => updatePanel(panel.id, { channel_id: e.target.value || null })}
                      disabled={loading}
                    >
                      <option value="">— Select channel —</option>
                      {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Description</label>
                  <textarea className="input-galaxy resize-none" rows={2} value={panel.description}
                    onChange={e => updatePanel(panel.id, { description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Button Label</label>
                    <input type="text" className="input-galaxy" value={panel.button_label}
                      onChange={e => updatePanel(panel.id, { button_label: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Button Emoji</label>
                    <input type="text" className="input-galaxy" value={panel.button_emoji || ''}
                      onChange={e => updatePanel(panel.id, { button_emoji: e.target.value || null })} />
                  </div>
                </div>
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}

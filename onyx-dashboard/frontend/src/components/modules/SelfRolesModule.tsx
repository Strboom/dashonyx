import { useState, useEffect } from 'react';
import { Plus, Trash2, Layers, ToggleLeft, Hash } from 'lucide-react';
import { GuildSettings, api } from '../../api';

type SRPanel = GuildSettings['selfroles']['panels'][string];

interface Props {
  guildId: string;
  settings: GuildSettings['selfroles'];
  onChange: (s: GuildSettings['selfroles']) => void;
}

export default function SelfRolesModule({ guildId, settings, onChange }: Props) {
  const [roles, setRoles] = useState<Array<{ id: string; name: string; color: number }>>([]);
  const [channels, setChannels] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [newPanelTitle, setNewPanelTitle] = useState('');
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [newBtn, setNewBtn] = useState<Record<string, { role: string; label: string; emoji: string }>>({});

  useEffect(() => {
    setLoading(true);
    Promise.all([api.roles(guildId), api.channels(guildId)])
      .then(([r, c]) => { setRoles(r); setChannels(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [guildId]);

  const panels = settings.panels;
  const nextId = () => String(Date.now());

  function createPanel() {
    if (!newPanelTitle.trim()) return;
    const id = nextId();
    onChange({
      panels: {
        ...panels,
        [id]: { title: newPanelTitle.trim(), roles: [], message_id: null, channel_id: null },
      },
    });
    setNewPanelTitle('');
    setExpandedPanel(id);
  }

  function deletePanel(id: string) {
    const next = { ...panels };
    delete next[id];
    onChange({ panels: next });
    if (expandedPanel === id) setExpandedPanel(null);
  }

  function updatePanel(id: string, patch: Partial<SRPanel>) {
    onChange({ panels: { ...panels, [id]: { ...panels[id], ...patch } } });
  }

  function addButton(panelId: string) {
    const btn = newBtn[panelId] || { role: '', label: '', emoji: '' };
    if (!btn.role || !btn.label) return;
    const panel = panels[panelId];
    if (panel.roles.some(r => r.role_id === btn.role)) return;
    updatePanel(panelId, {
      roles: [
        ...panel.roles,
        { role_id: btn.role, label: btn.label, emoji: btn.emoji || null },
      ],
    });
    setNewBtn(prev => ({ ...prev, [panelId]: { role: '', label: '', emoji: '' } }));
  }

  function removeButton(panelId: string, roleId: string) {
    updatePanel(panelId, {
      roles: panels[panelId].roles.filter(r => r.role_id !== roleId),
    });
  }

  function roleColor(roleId: string) {
    const r = roles.find(r => r.id === roleId);
    if (!r || r.color === 0) return '#6366f1';
    return `#${r.color.toString(16).padStart(6, '0')}`;
  }

  function roleName(roleId: string) {
    return roles.find(r => r.id === roleId)?.name ?? roleId;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Create Panel */}
      <section className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Layers size={18} className="text-indigo-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">Create New Panel</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="input-galaxy flex-1"
            placeholder="Panel title, e.g. Notification Roles"
            value={newPanelTitle}
            onChange={e => setNewPanelTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createPanel()}
            maxLength={80}
          />
          <button onClick={createPanel} disabled={!newPanelTitle.trim()} className="btn-indigo px-4 flex items-center gap-1.5">
            <Plus size={15} /> Add
          </button>
        </div>
      </section>

      {/* Panels */}
      {Object.keys(panels).length === 0 ? (
        <div className="glass-card p-8 text-center">
          <ToggleLeft size={32} className="text-indigo-400/40 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No self-role panels yet. Create one above.</p>
        </div>
      ) : (
        Object.entries(panels).map(([id, panel]) => (
          <section key={id} className="glass-card overflow-hidden">
            {/* Panel Header */}
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer"
              style={{ background: expandedPanel === id ? 'rgba(99,102,241,0.08)' : 'transparent' }}
              onClick={() => setExpandedPanel(expandedPanel === id ? null : id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="font-semibold text-white text-sm">{panel.title}</span>
                <span className="tag text-xs">{panel.roles.length} role{panel.roles.length !== 1 ? 's' : ''}</span>
                {panel.message_id && (
                  <span className="text-xs text-emerald-400">✓ Posted</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); deletePanel(id); }}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
                <span className="text-slate-500 text-xs">{expandedPanel === id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expandedPanel === id && (
              <div className="px-5 pb-5 space-y-4 border-t border-white/5">
                {/* Panel Channel */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Post to Channel</label>
                  <select
                    className="input-galaxy"
                    value={panel.channel_id || ''}
                    onChange={e => updatePanel(id, { channel_id: e.target.value || null })}
                    disabled={loading}
                  >
                    <option value="">— Select channel —</option>
                    {channels.map(c => (
                      <option key={c.id} value={c.id}>#{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Existing Buttons */}
                {panel.roles.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-2">Buttons</p>
                    <div className="space-y-2">
                      {panel.roles.map(r => (
                        <div
                          key={r.role_id}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg"
                          style={{ background: 'rgba(15,16,40,0.6)', border: '1px solid rgba(99,102,241,0.15)' }}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: roleColor(r.role_id) }}
                          />
                          <span className="text-sm text-white flex-1">{r.emoji} {r.label}</span>
                          <span className="text-xs text-slate-500">@{roleName(r.role_id)}</span>
                          <button
                            onClick={() => removeButton(id, r.role_id)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Button */}
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2">Add Button</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      className="input-galaxy"
                      value={newBtn[id]?.role || ''}
                      onChange={e => setNewBtn(prev => ({ ...prev, [id]: { ...prev[id], role: e.target.value } }))}
                      disabled={loading}
                    >
                      <option value="">— Role —</option>
                      {roles
                        .filter(r => !panel.roles.some(pr => pr.role_id === r.id))
                        .map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                    <input
                      type="text"
                      className="input-galaxy"
                      placeholder="Button label"
                      value={newBtn[id]?.label || ''}
                      onChange={e => setNewBtn(prev => ({ ...prev, [id]: { ...prev[id], label: e.target.value } }))}
                      maxLength={40}
                    />
                    <input
                      type="text"
                      className="input-galaxy"
                      placeholder="Emoji (optional)"
                      value={newBtn[id]?.emoji || ''}
                      onChange={e => setNewBtn(prev => ({ ...prev, [id]: { ...prev[id], emoji: e.target.value } }))}
                      maxLength={10}
                    />
                  </div>
                  <button
                    onClick={() => addButton(id)}
                    disabled={!newBtn[id]?.role || !newBtn[id]?.label}
                    className="btn-ghost text-xs mt-2 flex items-center gap-1.5 py-2"
                  >
                    <Plus size={13} /> Add Button to Panel
                  </button>
                </div>
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}

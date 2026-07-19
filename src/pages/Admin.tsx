import { useState, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, LogOut, Loader2, Search, Pencil, Trash2, Eye, EyeOff, Archive, Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/languageContext';
import { useRole } from '@/features/auth/hooks/useRole';
import { signOut } from '@/features/auth/services/authService';
import { useAdminEvents, useEventMutations } from '@/features/bulletin/hooks/useAdminEvents';
import { uploadPoster } from '@/features/bulletin/services/eventAdminService';
import { TEMPLE_CONSTANTS } from '@/lib/constants';
import type { Event, BulletinStatus } from '@/types';

const STATUS_FILTERS: (BulletinStatus | 'all')[] = ['all', 'draft', 'published', 'archived'];

const statusDot: Record<string, string> = {
  draft: 'bg-white/30',
  published: 'bg-emerald-500',
  archived: 'bg-white/15',
};

function ActionBtn({ onClick, icon, label, title, disabled, danger }: {
  onClick: () => void; icon: ReactNode; label?: string; title?: string;
  disabled?: boolean; danger?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title ?? label}
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 [&_svg]:h-3 [&_svg]:w-3 ${
        danger
          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
          : 'border-temple-gold/30 text-temple-goldLight/80 hover:bg-temple-gold/10'
      }`}
    >
      {icon}{label && <span>{label}</span>}
    </button>
  );
}

type Tab = 'dashboard' | 'listings';

function TabBtn({ active, onClick, icon, children }: {
  active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all [&_svg]:h-3.5 [&_svg]:w-3.5 ${
        active ? 'bg-temple-gold text-black' : 'text-temple-goldLight/50 hover:text-temple-goldLight'
      }`}
    >
      {icon}{children}
    </button>
  );
}

export default function Admin() {
  const { t } = useLanguage();
  const { data: events, isLoading, isError } = useAdminEvents();
  const { setStatus, remove } = useEventMutations();
  const { role, canPublish, isSuperadmin } = useRole();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [filter, setFilter] = useState<BulletinStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Event | null>(null);
  const [adding, setAdding] = useState(false);

  const all = events ?? [];

  const list = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return all.filter(
      (v) => (filter === 'all' || v.status === filter) &&
        (!needle || `${v.title}`.toLowerCase().includes(needle)),
    );
  }, [all, filter, query]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Signed out');
    } catch {
      toast.error('Could not sign out');
    }
  };

  // EventForm inline
  const EventForm = ({ event, onDone }: { event: Event | null; onDone: () => void }) => {
    const { create, update } = useEventMutations();
    const [form, setForm] = useState({
      title: event?.title ?? '',
      description: event?.description ?? '',
      event_date: event?.event_date ? event.event_date.slice(0, 10) : '',
      location: event?.location ?? TEMPLE_CONSTANTS.TEMPLE.DEFAULT_LOCATION,
      status: event?.status ?? 'draft' as BulletinStatus,
      cost_per_pax: event?.cost_per_pax ?? 0,
      featured_poster: event?.featured_poster ?? '',
      abhishegam_time: event?.abhishegam_time ?? '',
      pooja_start_time: event?.pooja_start_time ?? '',
      temple_inclusions: event?.temple_inclusions ?? '',
      special_notes: event?.special_notes ?? '',
      show_in_carousel: event?.show_in_carousel ?? false,
      is_favorited: event?.is_favorited ?? false,
    });

    const [posterFile, setPosterFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handlePosterUpload = async (file: File) => {
      setUploading(true);
      try {
        const url = await uploadPoster(file);
        setForm((prev) => ({ ...prev, featured_poster: url }));
        toast.success('Poster uploaded');
        setPosterFile(null);
      } catch {
        toast.error('Upload failed');
      } finally {
        setUploading(false);
      }
    };

    const handleSave = async () => {
      const payload = {
        title: form.title,
        description: form.description || null,
        event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
        location: form.location || null,
        status: form.status,
        cost_per_pax: form.cost_per_pax,
        featured_poster: form.featured_poster || null,
        abhishegam_time: form.abhishegam_time || null,
        pooja_start_time: form.pooja_start_time ? `${form.pooja_start_time}:00` : null,
        temple_inclusions: form.temple_inclusions || null,
        special_notes: form.special_notes || null,
        show_in_carousel: form.show_in_carousel,
        is_favorited: form.is_favorited,
      };
      if (event) {
        await update.mutateAsync({ id: event.id, values: payload });
      } else {
        await create.mutateAsync(payload);
      }
      onDone();
    };

    const inp = 'block w-full rounded-lg border bg-temple-bg px-3 py-2 text-sm text-white outline-none transition-colors border-temple-gold/40 focus:border-temple-gold';
    const inpRow = 'grid grid-cols-2 gap-3';
    const labelCls = 'block text-xs font-medium text-temple-goldLight/70 mb-1';

    return (
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className={labelCls}>Event Title *</label>
          <input id="title" name="title" className={inp} placeholder="e.g. Maha Shivarathri Pooja" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className={labelCls}>Description</label>
          <textarea id="description" name="description" className={inp} placeholder="Event description..." rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        {/* Date + Location */}
        <div className={inpRow}>
          <div>
            <label htmlFor="event_date" className={labelCls}>Event Date</label>
            <input id="event_date" name="event_date" className={inp + ' cursor-pointer'} type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
          </div>
          <div>
            <label htmlFor="location" className={labelCls}>Location</label>
            <input id="location" name="location" className={inp} placeholder="e.g. 3.104526, 101.730841" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
        </div>

        {/* Cost per Pax + Status */}
        <div className={inpRow}>
          <div>
            <label htmlFor="cost_per_pax" className={labelCls}>Cost per Pax (RM)</label>
            <input id="cost_per_pax" name="cost_per_pax" className={inp} type="number" step="0.01" min="0" placeholder="0.00" value={form.cost_per_pax} onChange={(e) => setForm({ ...form, cost_per_pax: Number(e.target.value) })} />
          </div>
          <div>
            <label htmlFor="status" className={labelCls}>Status</label>
            <select id="status" name="status" className={inp} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BulletinStatus })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Abhishegam Time + Pooja Start Time */}
        <div className={inpRow}>
          <div>
            <label htmlFor="abhishegam_time" className={labelCls}>Abhishegam Time</label>
            <input id="abhishegam_time" name="abhishegam_time" className={inp + ' cursor-pointer'} type="time" value={form.abhishegam_time} onChange={(e) => setForm({ ...form, abhishegam_time: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pooja_start_time" className={labelCls}>Pooja Start Time</label>
            <input id="pooja_start_time" name="pooja_start_time" className={inp + ' cursor-pointer'} type="time" value={form.pooja_start_time} onChange={(e) => setForm({ ...form, pooja_start_time: e.target.value })} />
          </div>
        </div>

        {/* Featured poster with file upload */}
        <div>
          <label htmlFor="featured_poster" className={labelCls}>Featured Poster</label>
          <div className="flex gap-2">
            <input id="featured_poster" name="featured_poster" className={inp + ' flex-1'} placeholder="Poster image URL or upload below" value={form.featured_poster} onChange={(e) => setForm({ ...form, featured_poster: e.target.value })} />
            <label className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-temple-gold/40 px-3 py-2 text-xs text-temple-goldLight/70 hover:bg-temple-gold/10 cursor-pointer transition-colors">
              <Upload className="h-3.5 w-3.5" />
              <span>{uploading ? '...' : 'Upload'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setPosterFile(file);
                  handlePosterUpload(file);
                }
              }} />
            </label>
          </div>
        </div>

        {/* Temple Inclusions + Special Notes */}
        <div className={inpRow}>
          <div>
            <label htmlFor="temple_inclusions" className={labelCls}>Temple Inclusions</label>
            <textarea id="temple_inclusions" name="temple_inclusions" className={inp} placeholder="e.g. flowers, prasadam, vibhuti" rows={2} value={form.temple_inclusions} onChange={(e) => setForm({ ...form, temple_inclusions: e.target.value })} />
          </div>
          <div>
            <label htmlFor="special_notes" className={labelCls}>Special Notes</label>
            <textarea id="special_notes" name="special_notes" className={inp} placeholder="Any additional notes..." rows={2} value={form.special_notes} onChange={(e) => setForm({ ...form, special_notes: e.target.value })} />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-6 text-xs text-temple-goldLight/70">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input id="show_in_carousel" name="show_in_carousel" type="checkbox" checked={form.show_in_carousel} onChange={(e) => setForm({ ...form, show_in_carousel: e.target.checked })} />
            Show in carousel
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input id="is_favorited" name="is_favorited" type="checkbox" checked={form.is_favorited} onChange={(e) => setForm({ ...form, is_favorited: e.target.checked })} />
            Featured
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleSave} disabled={create.isPending || update.isPending}
            className="px-4 py-2 rounded bg-temple-gold text-black text-sm font-semibold hover:bg-temple-goldLight transition-colors disabled:opacity-50">
            Save Event
          </button>
          <button type="button" onClick={onDone}
            className="px-4 py-2 rounded border border-temple-gold/40 text-temple-goldLight/70 text-sm hover:text-temple-goldLight transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-temple-bg">
      <div className="mx-auto max-w-5xl px-4 py-6 pb-32">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-temple-goldLight">Admin Hub</h2>
            <p className="mt-1 text-sm text-temple-goldLight/50">
              Event control room{role ? ` · ${role}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/contributions"
              className="inline-flex items-center gap-1 rounded-lg border border-temple-gold/30 px-3 py-1.5 text-xs font-medium text-temple-goldLight/80 hover:bg-temple-gold/10 transition-colors">
              Contributions
            </Link>
            <button onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-temple-gold px-3 py-1.5 text-xs font-semibold text-black hover:bg-temple-goldLight transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Event
            </button>
            <button onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-lg border border-red-800/40 px-3 py-1.5 text-xs text-red-400/60 hover:text-red-400 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-5 inline-flex rounded-full border border-temple-gold/30 bg-temple-card/50 p-0.5">
          <TabBtn active={tab === 'dashboard'} onClick={() => setTab('dashboard')} icon={<Loader2 className="h-3.5 w-3.5" />}>Dashboard</TabBtn>
          <TabBtn active={tab === 'listings'} onClick={() => setTab('listings')} icon={<Search className="h-3.5 w-3.5" />}>Events ({all.length})</TabBtn>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-temple-gold" />
          </div>
        ) : isError ? (
          <p className="py-16 text-center text-sm text-red-400">Failed to load events.</p>
        ) : tab === 'dashboard' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total" value={all.length} />
              <StatCard label="Published" value={all.filter((e) => e.status === 'published').length} color="text-emerald-400" />
              <StatCard label="Draft" value={all.filter((e) => e.status === 'draft').length} color="text-white/60" />
              <StatCard label="Archived" value={all.filter((e) => e.status === 'archived').length} color="text-white/30" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter+Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events..."
                className="w-full rounded-lg border border-temple-gold/30 bg-black/30 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition-colors focus:border-temple-gold"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {STATUS_FILTERS.map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-all ${
                    filter === f
                      ? 'border-temple-gold/50 bg-temple-gold/10 text-temple-gold'
                      : 'border-temple-gold/30 text-temple-goldLight/50 hover:text-temple-goldLight'
                  }`}
                >
                  {f}{f !== 'all' && ` (${all.filter((v) => v.status === f).length})`}
                </button>
              ))}
            </div>

            {/* Event cards */}
            {list.length === 0 ? (
              <p className="py-16 text-center text-sm text-temple-goldLight/40">No events match.</p>
            ) : (
              <div className="space-y-3">
                {list.map((v) => {
                  const isPublic = v.status === 'published';
                  return (
                    <div key={v.id} className="flex gap-3 rounded-xl border border-temple-gold/20 bg-temple-card/80 p-3">
                      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-temple-bg">
                        {v.featured_poster ? (
                          <img src={v.featured_poster} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-2xl">🛕</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${statusDot[v.status] ?? 'bg-white/30'}`} />
                          <span className="text-[10px] uppercase tracking-wider text-temple-goldLight/50">{v.status}</span>
                        </div>
                        <p className="truncate text-sm font-bold text-temple-goldLight">{v.title}</p>
                        <p className="text-xs text-temple-goldLight/50">
                          {v.event_date ? new Date(v.event_date).toLocaleDateString() : '—'}
                          {v.cost_per_pax ? ` · RM ${v.cost_per_pax.toFixed(2)}` : ''}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <ActionBtn onClick={() => setEditing(v)} icon={<Pencil />} label="Edit" />

                          {canPublish && (isPublic ? (
                            <ActionBtn onClick={() => setStatus.mutate({ id: v.id, status: 'draft' })}
                              disabled={setStatus.isPending} icon={<EyeOff />} label="Unpublish" />
                          ) : v.status !== 'archived' ? (
                            <ActionBtn onClick={() => setStatus.mutate({ id: v.id, status: 'published' })}
                              disabled={setStatus.isPending} icon={<Eye />} label="Publish" />
                          ) : null)}

                          {canPublish && v.status !== 'archived' && (
                            <ActionBtn onClick={() => setStatus.mutate({ id: v.id, status: 'archived' })}
                              disabled={setStatus.isPending} icon={<Archive />} title="Archive" />
                          )}

                          {canPublish && v.status === 'archived' && (
                            <ActionBtn onClick={() => setStatus.mutate({ id: v.id, status: 'draft' })}
                              disabled={setStatus.isPending} icon={<Eye />} label="Restore" />
                          )}

                          {isSuperadmin && (
                            <ActionBtn onClick={() => {
                              if (window.confirm(`Delete "${v.title}"? This cannot be undone.`))
                                remove.mutate(v.id);
                            }} disabled={remove.isPending} icon={<Trash2 />} title="Delete" danger />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for add/edit */}
      {(adding || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-temple-card border border-temple-gold/30 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-temple-goldLight mb-4">
              {editing ? 'Edit Event' : 'Add New Event'}
            </h3>
            <EventForm event={editing} onDone={() => { setAdding(false); setEditing(null); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-temple-gold/20 bg-temple-card/50 p-4 text-center">
      <p className={`text-2xl font-bold ${color ?? 'text-temple-goldLight'}`}>{value}</p>
      <p className="text-xs text-temple-goldLight/50 mt-1">{label}</p>
    </div>
  );
}

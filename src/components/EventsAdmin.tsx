import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/languageContext';
import { useEventsAdmin } from '@/hooks/useEventsAdmin';
import type { Event, EventUpsert } from '@/types';

interface FormState {
  event_name: string;
  featured_poster: string;
  show_in_carousel: boolean;
  cost_per_pax: string;
  abhishegam_time: string;
  special_notes: string;
  status: 'Draft' | 'Active' | 'Archived';
}

const EMPTY_FORM: FormState = {
  event_name: '',
  featured_poster: '',
  show_in_carousel: false,
  cost_per_pax: '0',
  abhishegam_time: '',
  special_notes: '',
  status: 'Active',
};

function toFormState(event: Event): FormState {
  return {
    event_name: event.event_name,
    featured_poster: event.featured_poster ?? '',
    show_in_carousel: event.show_in_carousel,
    cost_per_pax: String(event.cost_per_pax ?? 0),
    abhishegam_time: event.abhishegam_time ?? '',
    special_notes: event.special_notes ?? '',
    status: event.status,
  };
}

const STATUS_BADGE: Record<Event['status'], string> = {
  Active: 'bg-green-600/20 text-green-400',
  Draft: 'bg-temple-yellow/20 text-temple-yellow',
  Archived: 'bg-gray-600/20 text-gray-400',
};

export default function EventsAdmin() {
  const { t } = useLanguage();
  const { events, loading, saveEvent, deleteEvent } = useEventsAdmin();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openNewForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(event: Event) {
    setEditingId(event.event_id);
    setForm(toFormState(event));
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.event_name.trim()) {
      toast.error(t('events_admin_required'));
      return;
    }

    const payload: EventUpsert = {
      event_name: form.event_name.trim(),
      featured_poster: form.featured_poster.trim() === '' ? null : form.featured_poster.trim(),
      show_in_carousel: form.show_in_carousel,
      cost_per_pax: parseFloat(form.cost_per_pax) || 0,
      abhishegam_time: form.abhishegam_time.trim() === '' ? null : form.abhishegam_time.trim(),
      special_notes: form.special_notes.trim() === '' ? null : form.special_notes.trim(),
      status: form.status,
    };

    setSaving(true);
    try {
      await saveEvent(editingId, payload);
      toast.success(t('events_admin_saved'));
      closeForm();
    } catch {
      toast.error(t('events_admin_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(event: Event) {
    if (!window.confirm(t('events_admin_delete_confirm'))) return;
    setDeletingId(event.event_id);
    try {
      await deleteEvent(event.event_id);
      toast.success(t('events_admin_deleted'));
    } catch {
      toast.error(t('events_admin_error'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-temple-goldLight">
          {t('events_admin_title')}
        </h2>
        <button
          onClick={openNewForm}
          className="min-h-[44px] px-4 rounded-lg bg-temple-gold/20 text-temple-gold border border-temple-gold/40 hover:bg-temple-gold/30 transition-colors text-sm font-medium"
        >
          {t('events_admin_new')}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-center text-temple-goldLight/40 text-sm animate-shimmer py-8">
          {t('carousel_loading')}
        </p>
      )}

      {/* Empty */}
      {!loading && events.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <span className="text-4xl block">🛕</span>
          <p className="text-temple-goldLight/40 text-sm">{t('events_admin_none')}</p>
        </div>
      )}

      {/* List */}
      {!loading && events.length > 0 && (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.event_id}
              className="bg-temple-card border border-temple-gold/20 rounded-lg p-3 flex gap-3 items-start"
            >
              {event.featured_poster ? (
                <img
                  src={event.featured_poster}
                  alt={event.event_name}
                  className="h-16 w-16 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="h-16 w-16 flex items-center justify-center rounded bg-temple-bg border border-temple-gold/20 text-2xl flex-shrink-0">
                  🛕
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm truncate">
                    {event.event_name}
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_BADGE[event.status]}`}
                  >
                    {event.status}
                  </span>
                  {event.show_in_carousel && (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold border border-temple-gold/40 text-temple-gold">
                      🎠 {t('events_admin_carousel')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-temple-goldLight/60">
                  RM {event.cost_per_pax}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openEditForm(event)}
                    className="min-h-[44px] px-3 rounded border border-temple-gold/30 text-temple-goldLight/80 hover:bg-temple-gold/10 transition-colors text-xs"
                  >
                    {t('events_admin_edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(event)}
                    disabled={deletingId === event.event_id}
                    className="min-h-[44px] px-3 rounded border border-red-800/40 text-red-400/80 hover:bg-red-950/30 transition-colors text-xs disabled:opacity-50"
                  >
                    {deletingId === event.event_id ? '...' : t('events_admin_delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-temple-card border border-temple-gold/30 rounded-lg p-5 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-temple-goldLight">
              {editingId ? t('events_admin_edit') : t('events_admin_new')}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-temple-goldLight/60 mb-1">
                  {t('events_admin_name')}
                </label>
                <input
                  type="text"
                  value={form.event_name}
                  onChange={(e) => setForm((f) => ({ ...f, event_name: e.target.value }))}
                  className="w-full min-h-[44px] px-3 rounded-lg bg-temple-bg border border-temple-gold/30 text-white text-sm focus:outline-none focus:border-temple-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-temple-goldLight/60 mb-1">
                  {t('events_admin_cost')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost_per_pax}
                  onChange={(e) => setForm((f) => ({ ...f, cost_per_pax: e.target.value }))}
                  className="w-full min-h-[44px] px-3 rounded-lg bg-temple-bg border border-temple-gold/30 text-white text-sm focus:outline-none focus:border-temple-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-temple-goldLight/60 mb-1">
                  {t('events_admin_time')}
                </label>
                <input
                  type="text"
                  placeholder="18:30"
                  value={form.abhishegam_time}
                  onChange={(e) => setForm((f) => ({ ...f, abhishegam_time: e.target.value }))}
                  className="w-full min-h-[44px] px-3 rounded-lg bg-temple-bg border border-temple-gold/30 text-white text-sm focus:outline-none focus:border-temple-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-temple-goldLight/60 mb-1">
                  {t('events_admin_poster')}
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.featured_poster}
                  onChange={(e) => setForm((f) => ({ ...f, featured_poster: e.target.value }))}
                  className="w-full min-h-[44px] px-3 rounded-lg bg-temple-bg border border-temple-gold/30 text-white text-sm focus:outline-none focus:border-temple-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-temple-goldLight/60 mb-1">
                  {t('events_admin_notes')}
                </label>
                <textarea
                  value={form.special_notes}
                  onChange={(e) => setForm((f) => ({ ...f, special_notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-temple-bg border border-temple-gold/30 text-white text-sm focus:outline-none focus:border-temple-gold resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-temple-goldLight/60 mb-1">
                  {t('events_admin_status')}
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as FormState['status'] }))
                  }
                  className="w-full min-h-[44px] px-3 rounded-lg bg-temple-bg border border-temple-gold/30 text-white text-sm focus:outline-none focus:border-temple-gold"
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_in_carousel}
                  onChange={(e) => setForm((f) => ({ ...f, show_in_carousel: e.target.checked }))}
                  className="h-4 w-4 accent-temple-gold"
                />
                <span className="text-xs text-temple-goldLight/80">
                  {t('events_admin_carousel')}
                </span>
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={closeForm}
                disabled={saving}
                className="min-h-[44px] px-4 rounded-lg border border-temple-gold/40 text-temple-goldLight/70 hover:bg-temple-gold/10 transition-colors text-sm disabled:opacity-50"
              >
                {t('events_admin_cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="min-h-[44px] px-4 rounded-lg bg-gradient-to-r from-temple-gold to-temple-yellow text-temple-bg font-semibold hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
              >
                {saving ? '...' : t('events_admin_save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

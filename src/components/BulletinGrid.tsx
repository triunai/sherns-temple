import { useState, useCallback } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { useEvents } from '@/hooks/useEvents';
import ContributeTab from './ContributeTab';
import type { Event } from '@/types';
import { isEnabled } from '@/config/features';

export default function BulletinGrid() {
  const { t } = useLanguage();
  const { events, loading } = useEvents();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const autoExpand = isEnabled('AUTO_EXPAND_FIRST_EVENT');

  const toggleExpand = useCallback(
    (eventId: string) => {
      setExpandedId((prev) => (prev === eventId ? null : eventId));
    },
    []
  );

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <p className="text-center text-temple-goldLight/40 animate-shimmer">
          {t('carousel_loading')}
        </p>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="bg-temple-card/30 border border-temple-gold/20 rounded-lg p-8 inline-block">
          <span className="text-4xl block mb-3">🛕</span>
          <p className="text-temple-goldLight/60">{t('event_no_events')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event, idx) => (
          <div
            key={event.event_id}
            id={`event-${event.event_id}`}
            className="scroll-mt-24"
          >
            <EventCard
              event={event}
              isExpanded={expandedId === event.event_id || (autoExpand && idx === 0 && expandedId === null)}
              onToggle={() => toggleExpand(event.event_id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function EventCard({
  event,
  isExpanded,
  onToggle,
}: {
  event: Event;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div
      className={`bg-temple-card border rounded-lg overflow-hidden transition-all duration-300 ${
        isExpanded ? 'border-temple-gold shadow-[inset_0_0_20px_rgba(229,169,59,0.08)]' : 'border-temple-gold/20 hover:border-temple-gold/40'
      }`}
    >
      <div className="relative">
        {event.featured_poster ? (
          <img
            src={event.featured_poster}
            alt={event.event_name}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-temple-card to-temple-bg flex items-center justify-center">
            <span className="text-5xl">🛕</span>
          </div>
        )}

        {event.cost_per_pax > 0 && (
          <div className="absolute top-3 right-3 bg-temple-yellow text-black font-bold text-xs px-2 py-1 rounded">
            RM {event.cost_per_pax.toFixed(2)}
          </div>
        )}

        {event.is_favorited && (
          <div className="absolute top-3 left-3 bg-temple-crimson/80 text-white text-xs px-2 py-1 rounded">
            Featured
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <h3 className="text-base font-bold text-temple-goldLight leading-snug">
          {event.event_name}
        </h3>

        {event.abhishegam_time && (
          <p className="text-xs text-temple-goldLight/70 flex items-center gap-1">
            <span className="text-temple-gold">⏰</span> {event.abhishegam_time}
          </p>
        )}

        {event.special_notes && (
          <p className="text-xs text-temple-goldLight/50 italic">
            {event.special_notes}
          </p>
        )}

        <button
          onClick={onToggle}
          className={`w-full py-2.5 rounded font-semibold text-sm transition-all ${
            isExpanded
              ? 'bg-temple-card border border-temple-gold/50 text-temple-goldLight'
              : 'bg-gradient-to-r from-temple-crimson to-red-800 text-white border border-temple-gold/50 hover:from-red-800 hover:to-temple-crimson'
          }`}
        >
          {isExpanded ? t('step3_title') : t('contribute_now')}
        </button>

        {isExpanded && (
          <div className="animate-slide-up">
            <ContributeTab event={event} />
          </div>
        )}
      </div>
    </div>
  );
}

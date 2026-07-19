import { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { useCarouselEvents } from '@/hooks/useEvents';
import { isEnabled } from '@/config/features';

export default function HeroCarousel() {
  const { t } = useLanguage();
  const { events, loading } = useCarouselEvents();
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const count = events.length;
  const enabled = isEnabled('ENABLE_CAROUSEL');

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (!enabled || count <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, count]);

  function handleClick(eventId: string) {
    const el = document.getElementById(`event-${eventId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goTo(current + 1);
      else goTo(current - 1);
    }
  }

  if (!enabled || loading) {
    return (
      <div className="w-full h-48 sm:h-64 bg-temple-card/30 border-b border-temple-gold/20 flex items-center justify-center">
        <p className="text-temple-goldLight/40 text-sm animate-shimmer">
          {loading ? t('carousel_loading') : ''}
        </p>
      </div>
    );
  }

  if (count === 0) return null;

  return (
    <div className="relative w-full overflow-hidden border-b-2 border-temple-gold/30">
      <div
        ref={containerRef}
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {events.map((event) => (
          <div
            key={event.event_id}
            className="w-full flex-shrink-0 cursor-pointer"
            onClick={() => handleClick(event.event_id)}
          >
            <div className="relative w-full h-[280px] max-h-[45vh] sm:h-64 sm:max-h-none md:h-80 bg-temple-card">
              {event.featured_poster ? (
                <img
                  src={event.featured_poster}
                  alt={event.event_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-temple-card to-temple-bg p-4">
                  <span className="text-4xl mb-3">🛕</span>
                  <h2 className="text-xl sm:text-2xl font-bold text-temple-goldLight text-center">
                    {event.event_name}
                  </h2>
                  {event.abhishegam_time && (
                    <p className="text-sm text-temple-gold/80 mt-2">{event.abhishegam_time}</p>
                  )}
                </div>
              )}
              <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent pt-16 px-4 pb-5 sm:px-6 sm:pb-6">
                <h3 className="text-white font-bold text-xl leading-snug sm:text-2xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-2">
                  {event.event_name}
                </h3>
                {event.abhishegam_time && (
                  <p className="mt-1 text-temple-goldLight/90 text-sm drop-shadow">
                    🕉️ {event.abhishegam_time}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  {event.cost_per_pax > 0 && (
                    <span className="inline-flex items-center rounded-full bg-temple-gold/15 border border-temple-gold/40 px-3 py-1 text-temple-yellow font-semibold text-xs sm:text-sm tracking-wide backdrop-blur-sm">
                      RM {event.cost_per_pax.toFixed(2)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-temple-gold px-4 py-1.5 text-black font-bold text-xs sm:text-sm shadow-lg shadow-temple-gold/20">
                    {t('register_now') === 'register_now' ? 'Register' : t('register_now')} →
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {events.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === current
                  ? 'bg-temple-gold w-5'
                  : 'bg-temple-gold/40 hover:bg-temple-gold/70'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

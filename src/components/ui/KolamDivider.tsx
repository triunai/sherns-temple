/**
 * KolamDivider — a thin, purely-SVG kolam/rangoli-style section divider.
 *
 * A gold hairline spans the full width with a small centered lotus/diamond
 * motif flanked by dots. Everything is drawn with `currentColor`, so callers
 * tint the divider by setting a text color (defaults to a muted temple gold).
 *
 * Decorative only: static (no animation, reduced-motion friendly), ~24px tall,
 * and a tiny DOM footprint.
 */
export default function KolamDivider({ className }: { className?: string }) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`w-full flex items-center justify-center gap-2 text-temple-gold/40 ${className ?? ""}`.trim()}
    >
      {/* Left hairline — stretches to fill, stays 1px tall via preserveAspectRatio="none". */}
      <svg
        className="h-px flex-1"
        viewBox="0 0 100 1"
        preserveAspectRatio="none"
        fill="none"
        focusable="false"
      >
        <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Centered kolam ornament — fixed size, crisp, scales via preserveAspectRatio. */}
      <svg
        className="h-6 shrink-0"
        viewBox="0 0 48 24"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
        focusable="false"
      >
        {/* Flanking dots along the line */}
        <circle cx="6" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="11" cy="12" r="0.7" fill="currentColor" stroke="none" />
        <circle cx="37" cy="12" r="0.7" fill="currentColor" stroke="none" />
        <circle cx="42" cy="12" r="1" fill="currentColor" stroke="none" />

        {/* Lotus petals framing the diamond */}
        <path d="M15 12 Q19 7 24 5 Q22 10 24 12 Q22 14 24 19 Q19 17 15 12 Z" />
        <path d="M33 12 Q29 7 24 5 Q26 10 24 12 Q26 14 24 19 Q29 17 33 12 Z" />

        {/* Central filled diamond */}
        <path d="M24 8 L28 12 L24 16 L20 12 Z" fill="currentColor" stroke="none" />
      </svg>

      {/* Right hairline */}
      <svg
        className="h-px flex-1"
        viewBox="0 0 100 1"
        preserveAspectRatio="none"
        fill="none"
        focusable="false"
      >
        <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}

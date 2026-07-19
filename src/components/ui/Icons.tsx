// Consistent inline-SVG icon set. Replaces ad-hoc emoji across the app.
// Every icon: viewBox "0 0 24 24", strokes use currentColor, className passed through,
// aria-hidden so screen readers skip the decorative glyphs.

type IconProps = { className?: string };

// Shared base attributes for stroked (outline) icons.
const strokeProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

// Shared base attributes for filled (glyph) icons.
const fillProps = {
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
};

// Stylized gopuram / temple silhouette. Filled reads cleaner at small sizes. Replaces temple emoji.
export function TempleIcon({ className }: IconProps) {
  return (
    <svg {...fillProps} className={className}>
      {/* Tiered gopuram tower */}
      <path d="M12 1.5l2 2.2h-4l2-2.2z" />
      <path d="M8.5 6.2l3.5-2.1 3.5 2.1v1.3h-7V6.2z" />
      <path d="M7 10.2l5-3 5 3v1.4H7v-1.4z" />
      {/* Base hall with a doorway opening */}
      <path d="M5.5 13h13v9.5h-4.2v-5a2.3 2.3 0 0 0-4.6 0v5H5.5V13z" />
      {/* Ground line */}
      <path d="M3.5 22.5h17" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Om symbol. A filled path approximation. Replaces om emoji.
export function OmIcon({ className }: IconProps) {
  return (
    <svg {...fillProps} className={className}>
      {/* Bindu dot and crescent above */}
      <circle cx="16.5" cy="4.4" r="1.1" />
      <path
        d="M11.2 6.6c1.9-1.5 4.6-1.4 5.7.4.5.8.5 1.7.1 2.4l-1.4-.7c.2-.4.2-.8 0-1.1-.5-.8-1.9-.8-3 0l-1.4-1z"
      />
      {/* Upper curl of the Om glyph */}
      <path
        d="M10.4 9.1c1.6 0 2.9 1.1 2.9 2.6 0 1.2-.8 2-1.8 2.3.7.2 1.2.6 1.6 1.2l-1.4.9c-.5-.8-1.3-1.1-2.3-1.1v-1.7c1 0 1.6-.5 1.6-1.3 0-.7-.6-1.2-1.4-1.2-.6 0-1.1.2-1.5.6l-1.1-1.2c.7-.7 1.6-1.1 2.9-1.1z"
      />
      {/* Lower body loop */}
      <path
        d="M7.6 12.9c2.6 0 4.7 2 4.7 4.5s-2.1 4.5-4.7 4.5c-2.3 0-4.2-1.6-4.6-3.8l1.7-.3c.3 1.3 1.5 2.3 2.9 2.3 1.6 0 2.9-1.2 2.9-2.7s-1.3-2.7-2.9-2.7c-.9 0-1.7.4-2.2 1l-1.3-1.1c.9-1 2.2-1.7 3.5-1.7z"
      />
    </svg>
  );
}

// Clock: circle with hour + minute hands. Replaces alarm-clock emoji.
export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...strokeProps} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

// Hourglass. Replaces hourglass emoji; also the "Pending" status glyph.
export function HourglassIcon({ className }: IconProps) {
  return (
    <svg {...strokeProps} className={className}>
      <path d="M6 3h12" />
      <path d="M6 21h12" />
      <path d="M7 3v3.2a5 5 0 0 0 2.2 4.1L12 12l2.8-1.7A5 5 0 0 0 17 6.2V3" />
      <path d="M7 21v-3.2a5 5 0 0 1 2.2-4.1L12 12l2.8 1.7a5 5 0 0 1 2.2 4.1V21" />
    </svg>
  );
}

// Checkmark. Replaces check emoji; also the "Approved" status glyph.
export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...strokeProps} className={className}>
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

// Cross / X. Replaces ballot-x emoji; also the "Rejected" status glyph.
export function CrossIcon({ className }: IconProps) {
  return (
    <svg {...strokeProps} className={className}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

// Magnifier.
export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...strokeProps} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M16 16l5 5" />
    </svg>
  );
}

// Circular refresh arrows.
export function RefreshIcon({ className }: IconProps) {
  return (
    <svg {...strokeProps} className={className}>
      <path d="M20 11a8 8 0 0 0-14.3-4.5M4 4v3.5h3.5" />
      <path d="M4 13a8 8 0 0 0 14.3 4.5M20 20v-3.5h-3.5" />
    </svg>
  );
}

// Downward chevron.
export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...strokeProps} className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// Download-to-device: arrow dropping into a tray. For PWA install prompts.
export function InstallIcon({ className }: IconProps) {
  return (
    <svg {...strokeProps} className={className}>
      <path d="M12 3v11" />
      <path d="M8 10l4 4 4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

// Maps an approval status to its glyph so callers stay emoji-free.
export function ApprovalStatusIcon({
  status,
  className,
}: {
  status: "Pending" | "Approved" | "Rejected";
  className?: string;
}) {
  if (status === "Approved") return <CheckIcon className={className} />;
  if (status === "Rejected") return <CrossIcon className={className} />;
  return <HourglassIcon className={className} />;
}

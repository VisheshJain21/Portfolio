/**
 * VJMark — the interlocked V·J monogram (original vector, drawn for this
 * site; inspired by a stock reference the user liked but NOT that asset —
 * the reference was unlicensed/watermarked). The V's fall crosses the
 * circular bowl that closes the J's hook. Stroke-based, currentColor,
 * scales to its container. Used by the preloader portal + favicon.
 */

export default function VJMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* V — sharp fall, short recovery */}
      <path
        d="M16 16 L42 80 L60 34"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* J — stem descending into a circular bowl that underlaps the V */}
      <path
        d="M84 16 V58 A24 24 0 0 1 36 58"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

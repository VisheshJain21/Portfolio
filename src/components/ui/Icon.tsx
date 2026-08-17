/**
 * Icon — the project's small inline-SVG set (there was none before this).
 * Line style, currentColor, sized in `em` so every icon matches the text
 * beside it. Keep new icons in this one file so the set stays consistent.
 */

type IconName =
  | "mail"
  | "github"
  | "linkedin"
  | "instagram"
  | "phone"
  | "resume"
  | "arrow"
  | "eye"
  | "heart";

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export default function Icon({
  name,
  className,
  filled,
}: {
  name: IconName;
  className?: string;
  /** heart only: outline at rest, solid when true (the "liked" state). */
  filled?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", flex: "0 0 auto" }}
    >
      {name === "mail" && (
        <g {...STROKE}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3.5 7 8.5 6 8.5-6" />
        </g>
      )}
      {name === "phone" && (
        <g {...STROKE}>
          <path d="M6.5 3.5 9 4l1 4-2 1.5a12 12 0 0 0 6.5 6.5L16 14l4 1 .5 2.5a2 2 0 0 1-2 2.3A15.5 15.5 0 0 1 4.2 6a2 2 0 0 1 2.3-2.5Z" />
        </g>
      )}
      {name === "github" && (
        <path
          fill="currentColor"
          d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.1.63-1.35-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
        />
      )}
      {name === "linkedin" && (
        <g fill="currentColor">
          <path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5ZM3 9.5h4V21H3zM10 9.5h3.8v1.6h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.75V21h-4v-4.9c0-1.17-.02-2.67-1.7-2.67-1.7 0-1.96 1.27-1.96 2.58V21h-4z" />
        </g>
      )}
      {name === "instagram" && (
        <g {...STROKE}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" stroke="none" />
        </g>
      )}
      {name === "resume" && (
        <g {...STROKE}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5M12 12v5m0 0-2-2m2 2 2-2" />
        </g>
      )}
      {name === "arrow" && (
        <g {...STROKE}>
          <path d="M7 17 17 7M9 7h8v8" />
        </g>
      )}
      {name === "eye" && (
        <g {...STROKE}>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </g>
      )}
      {name === "heart" && (
        <path
          d="M12 20.5s-7.5-4.6-9.9-9.3C.6 7.9 2.1 4.5 5.4 3.8c2-.4 3.9.6 4.9 2.3.2.3.6.3.8 0 1-1.7 2.9-2.7 4.9-2.3 3.3.7 4.8 4.1 3.3 7.4-2.4 4.7-9.9 9.3-9.9 9.3Z"
          fill={filled ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={filled ? 0 : 1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

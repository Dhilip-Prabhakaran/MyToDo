export default function Logo({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="MyToDo logo"
    >
      <defs>
        <linearGradient id="grad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="grad-top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>

      {/* Main rounded square background */}
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#grad-bg)" />

      {/* Top accent bar */}
      <rect x="8" y="8" width="48" height="10" rx="4" fill="url(#grad-top)" />

      {/* Task boxes (stacked) */}
      <g transform="translate(12, 24)">
        {/* Box 1 - full width, with checkmark */}
        <rect width="40" height="9" rx="2" fill="#fbbf24" opacity="0.9" />
        <path
          d="M8 4 L10.5 6.5 L14 3"
          stroke="#16a34a"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Box 2 - partial */}
        <rect y="11" width="28" height="8" rx="2" fill="#fb923c" opacity="0.8" />

        {/* Box 3 - smaller partial */}
        <rect y="21" width="18" height="7" rx="2" fill="#f97316" opacity="0.7" />
      </g>

      {/* Corner accent dot */}
      <circle cx="54" cy="14" r="3" fill="#06b6d4" />
    </svg>
  );
}

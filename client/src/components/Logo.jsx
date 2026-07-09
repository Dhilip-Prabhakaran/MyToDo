export default function Logo({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="MyToDo logo"
    >
      <defs>
        <linearGradient id="mtd-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0891b2" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#mtd-grad)" />
      <path
        d="M13 25.5 L21 33 L35 17"
        stroke="#1a1a1a"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="37.5" cy="10.5" r="3.5" fill="#e0453d" />
    </svg>
  );
}

export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="14" fill="#84C341" />
      <path
        d="M13 31.5c0-8.5 5.5-15 15.8-15.8.9 9.6-4.4 16.4-12.6 16.4"
        stroke="#0B2A19"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 33.5c2.6-6 7-10.2 13.2-12.6"
        stroke="#0B2A19"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M31 15.5h4.5M33.25 13.25v4.5"
        stroke="#0B2A19"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <Logo className="h-10 w-10" />
      <div className="leading-none">
        <p className="font-display text-[19px] font-bold tracking-[-0.03em] text-white">
          AgriPulse
        </p>
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-canopy-300">
          Precision farming
        </p>
      </div>
    </div>
  );
}

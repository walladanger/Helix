export function HelixMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
      <path
        d="M6 15.5c2.2-4.8 4.4-4.8 6.6 0s4.4 4.8 6.4 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6 10.5c2.2-4.2 4.4-4.2 6.6 0s4.4 4.2 6.4 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

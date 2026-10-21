export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="none" stroke="#ffb320" strokeWidth="2.5" />
        <path d="M16 6 L21 16 L16 26 L11 16 Z" fill="#ffb320" />
        <path d="M16 6 L21 16 L16 16 Z" fill="#2a2a7c" opacity=".35" />
      </svg>
      CareerCompass
    </span>
  );
}
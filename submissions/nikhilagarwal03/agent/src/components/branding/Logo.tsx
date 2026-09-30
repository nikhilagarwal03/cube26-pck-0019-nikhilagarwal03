type LogoProps = {
  className?: string;
  size?: number;
};

export function Logo({ className, size = 32 }: LogoProps) {
  return (
    <svg
      aria-label="Pack Manager"
      className={className}
      height={size}
      role="img"
      viewBox="0 0 48 48"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 3 42 13v22L24 45 6 35V13L24 3Z"
        fill="#09090b"
        stroke="#10b981"
        strokeWidth="2"
      />
      <path d="m6 13 18 10 18-10M24 23v22" fill="none" stroke="#10b981" strokeWidth="2" />
      <path d="m16 18 8 4.5 8-4.5" fill="none" stroke="#f59e0b" strokeWidth="2" />
      <circle cx="24" cy="29" fill="#ef4444" r="3" />
    </svg>
  );
}
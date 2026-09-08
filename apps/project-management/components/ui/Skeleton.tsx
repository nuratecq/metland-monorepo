export function Sk({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-[var(--color-surface-container-high)] ${className}`} />
  );
}

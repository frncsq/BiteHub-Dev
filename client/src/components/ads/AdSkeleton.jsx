/** Loading placeholder for ad slots (supports dark mode). */
export default function AdSkeleton({ className = '', variant = 'banner' }) {
  const height =
    variant === 'sidebar' ? 'h-48' : variant === 'card' ? 'h-36' : 'h-32 md:h-40';

  return (
    <div
      className={`animate-pulse rounded-2xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 ${height} ${className}`}
      aria-hidden
    />
  );
}

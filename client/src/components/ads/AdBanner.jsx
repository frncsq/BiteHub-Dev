import { useAds } from '../../hooks/useAds';
import { resolveAdImageUrl } from '../../services/adsService';
import AdSenseSlot from './AdSenseSlot';
import AdSkeleton from './AdSkeleton';

/**
 * Full-width responsive banner for homepage top, footer, etc.
 */
export default function AdBanner({
  placement = 'homepage_top',
  className = '',
  showAdSenseFallback = true,
}) {
  const { ads, loading, handleAdClick } = useAds(placement);

  if (loading) return <AdSkeleton className={className} variant="banner" />;

  const ad = ads[0];
  if (!ad) {
    return showAdSenseFallback ? <AdSenseSlot placement={placement} className={className} /> : null;
  }

  if (ad.ad_type === 'adsense') {
    return <AdSenseSlot placement={placement} slotId={ad.metadata?.adsenseSlot} className={className} />;
  }

  const img = resolveAdImageUrl(ad.image);

  return (
    <button
      type="button"
      onClick={() => handleAdClick(ad)}
      className={`group relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-900 ${className}`}
      aria-label={ad.title}
    >
      {img ? (
        <img
          src={img}
          alt={ad.title}
          loading="lazy"
          className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] md:h-44"
        />
      ) : (
        <div className="flex h-32 items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500 px-6 md:h-44">
          <span className="text-lg font-bold text-white">{ad.title}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
        Sponsored
      </span>
    </button>
  );
}

import { useAds } from '../../hooks/useAds';
import { resolveAdImageUrl } from '../../services/adsService';
import AdSenseSlot from './AdSenseSlot';
import AdSkeleton from './AdSkeleton';

/** Vertical ad slot for sidebars on home and menu pages. */
export default function SidebarAd({ placement = 'homepage_sidebar', className = '' }) {
  const { ads, loading, handleAdClick } = useAds(placement);

  if (loading) return <AdSkeleton className={className} variant="sidebar" />;

  if (!ads.length) {
    return <AdSenseSlot placement={placement} className={className} />;
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {ads.map((ad) => {
        if (ad.ad_type === 'adsense') {
          return <AdSenseSlot key={ad.id} placement={placement} slotId={ad.metadata?.adsenseSlot} />;
        }
        const img = resolveAdImageUrl(ad.image);
        return (
          <button
            key={ad.id}
            type="button"
            onClick={() => handleAdClick(ad)}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
          >
            {img && (
              <img src={img} alt={ad.title} loading="lazy" className="h-36 w-full object-cover" />
            )}
            <div className="p-3">
              <p className="text-xs font-bold uppercase text-orange-600">Sponsored</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{ad.title}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

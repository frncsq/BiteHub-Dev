import { Sparkles, Store, UtensilsCrossed } from 'lucide-react';
import { useAds } from '../../hooks/useAds';
import { resolveAdImageUrl } from '../../services/adsService';
import AdSkeleton from './AdSkeleton';

const typeIcon = {
  sponsored_meal: UtensilsCrossed,
  sponsored_restaurant: Store,
  partner: Sparkles,
};

/**
 * Promotional card for featured meals, restaurants, or partners.
 */
export default function SponsoredCard({
  placement = 'sponsored_card',
  className = '',
  limit = 3,
}) {
  const { ads, loading, handleAdClick } = useAds(placement);

  if (loading) {
    return (
      <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {Array.from({ length: limit }).map((_, i) => (
          <AdSkeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  const items = ads.slice(0, limit);
  if (!items.length) return null;

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {items.map((ad) => {
        const Icon = typeIcon[ad.ad_type] || Sparkles;
        const img = resolveAdImageUrl(ad.image);
        const subtitle = ad.metadata?.subtitle || ad.link;

        return (
          <button
            key={ad.id}
            type="button"
            onClick={() => handleAdClick(ad)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="relative h-32 overflow-hidden bg-slate-100 dark:bg-slate-800">
              {img ? (
                <img
                  src={img}
                  alt={ad.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Icon className="text-white/80" size={40} />
                </div>
              )}
              <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                Sponsored
              </span>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-bold text-slate-900 dark:text-white">{ad.title}</h3>
              {subtitle && (
                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

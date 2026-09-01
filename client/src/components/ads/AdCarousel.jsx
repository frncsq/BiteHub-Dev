import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAds } from '../../hooks/useAds';
import { resolveAdImageUrl } from '../../services/adsService';
import AdSkeleton from './AdSkeleton';

/** Rotating banner carousel with auto-advance and manual controls. */
export default function AdCarousel({
  placement = 'homepage_top',
  intervalMs = 6000,
  className = '',
}) {
  const { ads, loading, handleAdClick } = useAds(placement);
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    if (!ads.length) return;
    setIndex((i) => (i + 1) % ads.length);
  }, [ads.length]);

  const prev = () => {
    if (!ads.length) return;
    setIndex((i) => (i - 1 + ads.length) % ads.length);
  };

  useEffect(() => {
    if (ads.length <= 1) return undefined;
    const t = setInterval(next, intervalMs);
    return () => clearInterval(t);
  }, [ads.length, intervalMs, next]);

  if (loading) return <AdSkeleton className={className} variant="banner" />;
  if (!ads.length) return null;

  const ad = ads[index];
  const img = resolveAdImageUrl(ad.image);

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <button
        type="button"
        onClick={() => handleAdClick(ad)}
        className="block w-full text-left"
        aria-label={ad.title}
      >
        {img ? (
          <img
            src={img}
            alt={ad.title}
            loading="lazy"
            className="h-36 w-full object-cover transition-opacity duration-500 md:h-48"
          />
        ) : (
          <div className="flex h-36 items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 md:h-48">
            <span className="text-xl font-bold text-white">{ad.title}</span>
          </div>
        )}
      </button>

      {ads.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
            aria-label="Previous ad"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
            aria-label="Next ad"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {ads.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

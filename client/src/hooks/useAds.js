import { useState, useEffect, useCallback, useRef } from 'react';
import { adsService } from '../services/adsService';

/**
 * Fetch active ads for a placement. Tracks impressions once per mount per ad.
 * @param {string} placement - e.g. homepage_top
 * @param {object} options - { trackImpressions: true, enabled: true }
 */
export function useAds(placement, options = {}) {
  const { trackImpressions = true, enabled = true } = options;
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const impressedRef = useRef(new Set());

  const fetchAds = useCallback(async () => {
    if (!enabled || !placement) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await adsService.getByPlacement(placement);
      const list = res.data?.ads || [];
      setAds(list);

      if (trackImpressions) {
        list.forEach((ad) => {
          if (!impressedRef.current.has(ad.id)) {
            impressedRef.current.add(ad.id);
            adsService.trackImpression(ad.id).catch(() => {});
          }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [placement, trackImpressions, enabled]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleAdClick = useCallback(async (ad) => {
    try {
      const res = await adsService.trackClick(ad.id);
      const url = res.data?.redirectUrl || ad.link;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      if (ad.link) window.open(ad.link, '_blank', 'noopener,noreferrer');
    }
  }, []);

  return { ads, loading, error, refetch: fetchAds, handleAdClick };
}

export default useAds;

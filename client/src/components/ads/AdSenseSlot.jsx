import { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Google AdSense placeholder — paste your ad client + slot when ready.
 *
 * Example env (add to client/.env):
 *   VITE_ADSENSE_CLIENT=ca-pub-xxxxxxxx
 *   VITE_ADSENSE_SLOT_HOMEPAGE=1234567890
 */
export default function AdSenseSlot({
  placement = 'homepage_top',
  slotId,
  className = '',
  style = { display: 'block', minHeight: 90 },
}) {
  const containerRef = useRef(null);
  const { isDarkMode } = useTheme();
  const client = import.meta.env.VITE_ADSENSE_CLIENT;
  const envSlot =
    slotId ||
    import.meta.env[`VITE_ADSENSE_SLOT_${placement.toUpperCase().replace(/-/g, '_')}`];

  useEffect(() => {
    if (!client || !envSlot || !containerRef.current) return;
    if (client.includes('XXXXXXXX')) return; // placeholder client — skip until configured

    const pushAd = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        /* ignore */
      }
    };

    if (window.adsbygoogle) {
      pushAd();
      return undefined;
    }

    const timer = setInterval(() => {
      if (window.adsbygoogle) {
        pushAd();
        clearInterval(timer);
      }
    }, 200);
    return () => clearInterval(timer);
  }, [client, envSlot, isDarkMode]);

  const isPlaceholder =
    !client ||
    !envSlot ||
    client.includes('XXXXXXXX') ||
    String(envSlot).startsWith('000000000');

  if (isPlaceholder) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400 ${className}`}
        data-placement={placement}
      >
        <div>
          <p className="font-semibold text-slate-700 dark:text-slate-200">AdSense — {placement}</p>
          <p className="mt-1 text-xs">
            Set real values in <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">client/.env</code> for{' '}
            <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">VITE_ADSENSE_CLIENT</code> and{' '}
            <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">
              VITE_ADSENSE_SLOT_{placement.toUpperCase().replace(/-/g, '_')}
            </code>
            , then restart <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">npm run dev</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ins
      ref={containerRef}
      className={`adsbygoogle ${className}`}
      style={style}
      data-ad-client={client}
      data-ad-slot={envSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
      data-ad-theme={isDarkMode ? 'dark' : 'light'}
    />
  );
}

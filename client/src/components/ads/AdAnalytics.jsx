import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { MousePointerClick, Eye, Percent, Megaphone } from 'lucide-react';
import { useAdAnalytics } from '../../hooks/useAdAnalytics';
import AdSkeleton from './AdSkeleton';

/** Admin analytics panel: totals, CTR, top ads, recent clicks. */
export default function AdAnalytics() {
  const { analytics, loading, error } = useAdAnalytics();

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <AdSkeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!analytics) return null;

  const stats = [
    { label: 'Total Ads', value: analytics.totalAds, icon: Megaphone, color: 'blue' },
    { label: 'Active', value: analytics.activeAds, icon: Megaphone, color: 'emerald' },
    { label: 'Total Clicks', value: analytics.totalClicks, icon: MousePointerClick, color: 'orange' },
    { label: 'Impressions', value: analytics.totalImpressions, icon: Eye, color: 'violet' },
  ];

  const chartData = (analytics.topAds || []).map((a) => ({
    name: a.title?.length > 18 ? `${a.title.slice(0, 18)}…` : a.title,
    clicks: a.clicks,
    impressions: a.impressions,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon size={18} className={`text-${color}-500`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Percent size={18} className="text-blue-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">
              Click-through rate: {analytics.clickThroughRate}%
            </h3>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            Inactive ads: {analytics.inactiveAds}
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="clicks" fill="#f97316" name="Clicks" radius={[4, 4, 0, 0]} />
                <Bar dataKey="impressions" fill="#94a3b8" name="Impressions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 font-bold text-slate-800 dark:text-white">Most clicked ads</h3>
          <ul className="space-y-3">
            {(analytics.topAds || []).slice(0, 5).map((ad, i) => (
              <li
                key={ad.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800"
              >
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {i + 1}. {ad.title}
                </span>
                <span className="text-xs font-bold text-orange-600">{ad.clicks} clicks</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

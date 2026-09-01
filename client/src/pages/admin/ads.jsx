import { useState, useEffect, useCallback } from 'react';
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Power,
  Image as ImageIcon,
  BarChart3,
  List,
} from 'lucide-react';
import {
  adsService,
  buildAdFormData,
  resolveAdImageUrl,
  AD_PLACEMENTS,
  AD_TYPES,
} from '../../services/adsService';
import AdAnalytics from '../../components/ads/AdAnalytics';

const emptyForm = {
  title: '',
  link: '',
  position: 'homepage_top',
  ad_type: 'banner',
  status: 'active',
  start_date: '',
  end_date: '',
  sort_order: 0,
  metadata: {},
};

function AdminAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('list');
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adsService.list();
      setAds(res.data?.ads || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const resetForm = () => {
    setForm(emptyForm);
    setImageFile(null);
    setPreview(null);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setTab('form');
  };

  const openEdit = (ad) => {
    setEditingId(ad.id);
    setForm({
      title: ad.title,
      link: ad.link || '',
      position: ad.position,
      ad_type: ad.ad_type || 'banner',
      status: ad.status,
      start_date: ad.start_date ? ad.start_date.slice(0, 16) : '',
      end_date: ad.end_date ? ad.end_date.slice(0, 16) : '',
      sort_order: ad.sort_order || 0,
      metadata: ad.metadata || {},
    });
    setPreview(resolveAdImageUrl(ad.image));
    setTab('form');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...form,
        sort_order: Number(form.sort_order) || 0,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };
      const fd = buildAdFormData(payload, imageFile);
      if (editingId) {
        await adsService.update(editingId, fd);
        setMessage('Ad updated successfully');
      } else {
        await adsService.create(fd);
        setMessage('Ad created successfully');
      }
      resetForm();
      setTab('list');
      fetchAds();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this advertisement?')) return;
    try {
      await adsService.remove(id);
      fetchAds();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (ad) => {
    const next = ad.status === 'active' ? 'inactive' : 'active';
    try {
      await adsService.setStatus(ad.id, next);
      setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, status: next } : a)));
    } catch (err) {
      console.error(err);
    }
  };

  const statusBadge = (status) =>
    status === 'active'
      ? 'bg-emerald-100 text-emerald-700 ring-emerald-500/30'
      : 'bg-slate-100 text-slate-600 ring-slate-400/30';

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <Megaphone className="text-blue-500" size={28} />
            Advertisement Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Banners, sponsored content, and AdSense placements
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchAds}
            className="rounded-xl bg-slate-100 p-2.5 text-slate-600 transition hover:bg-slate-200"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-blue-500' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setTab('list')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
              tab === 'list' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <List size={16} /> Manage
          </button>
          <button
            type="button"
            onClick={() => setTab('analytics')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
              tab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <BarChart3 size={16} /> Analytics
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={16} /> Add Ad
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      {tab === 'analytics' && <AdAnalytics />}

      {tab === 'form' && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:grid-cols-2"
        >
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">
              {editingId ? 'Edit advertisement' : 'New advertisement'}
            </h2>
            <label className="block text-sm font-medium text-slate-600">
              Title *
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="block text-sm font-medium text-slate-600">
              Advertiser link
              <input
                type="url"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="https://"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-600">
                Placement *
                <select
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                >
                  {AD_PLACEMENTS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-600">
                Type
                <select
                  value={form.ad_type}
                  onChange={(e) => setForm({ ...form, ad_type: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                >
                  {AD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-600">
                Start date
                <input
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-slate-600">
                End date
                <input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-600">
              Sort order
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              />
            </label>
            {form.ad_type === 'adsense' && (
              <label className="block text-sm font-medium text-slate-600">
                AdSense slot ID
                <input
                  value={form.metadata?.adsenseSlot || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      metadata: { ...form.metadata, adsenseSlot: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                />
              </label>
            )}
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-600">
              Banner image (jpg, png, webp)
              <div className="mt-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-48 rounded-xl object-contain" />
                ) : (
                  <ImageIcon className="text-slate-300" size={48} />
                )}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleImageChange}
                  className="mt-4 text-xs"
                />
              </div>
            </label>
            <label className="block text-sm font-medium text-slate-600">
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Saving…' : editingId ? 'Update ad' : 'Create ad'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setTab('list');
                }}
                className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {tab === 'list' && (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <List size={18} className="text-slate-400" />
            <span className="font-semibold text-slate-700">All advertisements ({ads.length})</span>
          </div>
          {loading ? (
            <p className="p-8 text-center text-slate-500">Loading…</p>
          ) : ads.length === 0 ? (
            <p className="p-8 text-center text-slate-500">No ads yet. Click Add Ad to create one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Preview</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Placement</th>
                    <th className="px-4 py-3">Stats</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ads.map((ad) => (
                    <tr key={ad.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        {ad.image ? (
                          <img
                            src={resolveAdImageUrl(ad.image)}
                            alt=""
                            className="h-12 w-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-20 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <ImageIcon size={16} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{ad.title}</td>
                      <td className="px-4 py-3 text-slate-500">{ad.position}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {ad.clicks} clicks · {ad.impressions} views
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${statusBadge(ad.status)}`}
                        >
                          {ad.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => toggleStatus(ad)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            title="Toggle active"
                          >
                            <Power size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(ad)}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(ad.id)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminAds;

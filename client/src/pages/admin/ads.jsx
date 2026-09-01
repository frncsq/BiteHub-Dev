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
      ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]'
      : 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[#171717]">
            <Megaphone className="text-[#EA580C]" size={26} />
            Advertisement Management
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Banners, sponsored content, and AdSense placements
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchAds}
            className="rounded-xl bg-white border border-[#E5E7EB] p-2 text-[#6B7280] transition hover:bg-[#FAFAFA]"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-[#EA580C]' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setTab('list')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
              tab === 'list' ? 'bg-[#111111] text-white' : 'bg-white text-[#374151] border border-[#E5E7EB]'
            }`}
          >
            <List size={15} /> Manage
          </button>
          <button
            type="button"
            onClick={() => setTab('analytics')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
              tab === 'analytics' ? 'bg-[#3B82F6] text-white' : 'bg-white text-[#374151] border border-[#E5E7EB]'
            }`}
          >
            <BarChart3 size={15} /> Analytics
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-[#EA580C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#D4500A]"
          >
            <Plus size={15} /> Add Ad
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-[#EA580C]/20 bg-[#EA580C]/5 px-4 py-3 text-sm text-[#C2410C]">
          {message}
        </div>
      )}

      {tab === 'analytics' && <AdAnalytics />}

      {tab === 'form' && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-5 rounded-xl border border-[#E5E7EB] bg-white p-5 lg:grid-cols-2"
        >
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#171717]">
              {editingId ? 'Edit advertisement' : 'New advertisement'}
            </h2>
            <label className="block text-sm font-medium text-[#374151]">
              Title *
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
              />
            </label>
            <label className="block text-sm font-medium text-[#374151]">
              Advertiser link
              <input
                type="url"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="https://"
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#374151]">
                Placement *
                <select
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                >
                  {AD_PLACEMENTS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-[#374151]">
                Type
                <select
                  value={form.ad_type}
                  onChange={(e) => setForm({ ...form, ad_type: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                >
                  {AD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#374151]">
                Start date
                <input
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                />
              </label>
              <label className="block text-sm font-medium text-[#374151]">
                End date
                <input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-[#374151]">
              Sort order
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
              />
            </label>
            {form.ad_type === 'adsense' && (
              <label className="block text-sm font-medium text-[#374151]">
                AdSense slot ID
                <input
                  value={form.metadata?.adsenseSlot || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      metadata: { ...form.metadata, adsenseSlot: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                />
              </label>
            )}
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-[#374151]">
              Banner image (jpg, png, webp)
              <div className="mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E7EB] bg-[#FAFAFA] p-6">
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-48 rounded-xl object-contain" />
                ) : (
                  <ImageIcon className="text-[#D1D5DB]" size={44} />
                )}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleImageChange}
                  className="mt-4 text-xs"
                />
              </div>
            </label>
            <label className="block text-sm font-medium text-[#374151]">
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-[#EA580C] py-3 text-sm font-bold text-white hover:bg-[#D4500A] disabled:opacity-60"
              >
                {saving ? 'Saving…' : editingId ? 'Update ad' : 'Create ad'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setTab('list');
                }}
                className="rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] px-6 py-3 text-sm font-medium text-[#374151]"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {tab === 'list' && (
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] px-5 py-4">
            <List size={16} className="text-[#9CA3AF]" />
            <span className="font-semibold text-[#374151]">All advertisements ({ads.length})</span>
          </div>
          {loading ? (
            <p className="p-8 text-center text-[#9CA3AF]">Loading…</p>
          ) : ads.length === 0 ? (
            <p className="p-8 text-center text-[#9CA3AF]">No ads yet. Click Add Ad to create one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-[#FAFAFA] text-xs text-[#6B7280] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Preview</th>
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Placement</th>
                    <th className="px-5 py-3">Stats</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {ads.map((ad) => (
                    <tr key={ad.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-5 py-3">
                        {ad.image ? (
                          <img
                            src={resolveAdImageUrl(ad.image)}
                            alt=""
                            className="h-12 w-20 rounded-lg object-cover border border-[#F3F4F6]"
                          />
                        ) : (
                          <div className="flex h-12 w-20 items-center justify-center rounded-lg bg-[#FAFAFA] border border-[#F3F4F6] text-[#9CA3AF]">
                            <ImageIcon size={15} />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 font-medium text-[#171717]">{ad.title}</td>
                      <td className="px-5 py-3 text-[#6B7280]">{ad.position}</td>
                      <td className="px-5 py-3 text-xs text-[#6B7280]">
                        {ad.clicks} clicks · {ad.impressions} views
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-0.5 text-xs font-semibold border ${statusBadge(ad.status)}`}
                        >
                          {ad.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => toggleStatus(ad)}
                            className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F3F4F6]"
                            title="Toggle active"
                          >
                            <Power size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(ad)}
                            className="rounded-lg p-2 text-[#3B82F6] hover:bg-blue-50"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(ad.id)}
                            className="rounded-lg p-2 text-[#DC2626] hover:bg-[#FEE2E2]"
                          >
                            <Trash2 size={15} />
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

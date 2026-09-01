import { useState, useEffect, useCallback } from 'react';
import { createApiClient } from '../../services/apiClient';
import {
  PackageOpen, Save, RefreshCw, RotateCcw, AlertTriangle,
  CheckCircle, Package, TrendingDown, Infinity, Edit3, X,
  BarChart3, Clock, Zap
} from 'lucide-react';

// ─── Stock Status Badge ──────────────────────────────────────────────────────
function StockBadge({ currentStock, dailyStock }) {
  if (dailyStock === null || dailyStock < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
        <Infinity size={11} /> Unlimited
      </span>
    );
  }
  const pct = dailyStock > 0 ? Math.round((currentStock / dailyStock) * 100) : 0;
  if (currentStock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-[#DC2626] border border-red-200">
        <X size={11} /> Out of Stock
      </span>
    );
  }
  if (pct <= 25) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-[#DC2626] border border-red-200">
        <AlertTriangle size={11} /> Critical ({pct}%)
      </span>
    );
  }
  if (pct <= 50) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-[#D97706] border border-orange-200">
        <TrendingDown size={11} /> Low ({pct}%)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#16A34A] border border-emerald-100">
      <CheckCircle size={11} /> In Stock ({pct}%)
    </span>
  );
}

// ─── Stock Progress Bar ───────────────────────────────────────────────────────
function StockBar({ currentStock, dailyStock }) {
  if (dailyStock === null || dailyStock < 0 || dailyStock === 0) return null;
  const pct = Math.min(100, Math.round((Math.max(0, currentStock) / dailyStock) * 100));
  const color = pct <= 25 ? 'bg-[#DC2626]'
    : pct <= 50 ? 'bg-[#D97706]'
    : 'bg-[#16A34A]';

  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-[#6B7280] mb-1">
        <span>{currentStock} remaining</span>
        <span>of {dailyStock}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Inline Edit Modal ────────────────────────────────────────────────────────
function EditStockModal({ item, onClose, onSave }) {
  const [dailyStock, setDailyStock] = useState(
    item.daily_stock !== null && item.daily_stock >= 0 ? String(item.daily_stock) : ''
  );
  const [currentStock, setCurrentStock] = useState(
    item.current_stock !== null && item.current_stock >= 0 ? String(item.current_stock) : ''
  );
  const [syncCurrent, setSyncCurrent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const isUnlimited = dailyStock === '' || dailyStock === null;

  const handleSave = async () => {
    setError('');
    const ds = isUnlimited ? null : parseInt(dailyStock);
    let cs = isUnlimited ? null : (syncCurrent ? ds : parseInt(currentStock));

    if (!isUnlimited) {
      if (isNaN(ds) || ds < 0) {
        return setError('Daily stock must be a non-negative number or left blank for unlimited.');
      }
      if (!syncCurrent && currentStock !== '') {
        if (isNaN(cs) || cs < 0) {
          return setError('Current stock must be a non-negative number.');
        }
        if (cs > ds) {
          return setError(`Current stock (${cs}) cannot exceed daily stock (${ds}).`);
        }
      }
    }

    setIsSaving(true);
    try {
      await onSave(item.id, { daily_stock: ds, sync_current: syncCurrent, current_stock_override: syncCurrent ? null : cs });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xl w-full max-w-md animate-slide-up">
        <div className="flex justify-between items-center p-5 border-b border-[#E5E7EB] bg-[#FAFAFA]">
          <div>
            <h2 className="text-lg font-bold text-[#171717]">Edit Stock — {item.item_name}</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">{item.category} · ID #{item.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[#6B7280] hover:bg-gray-100 hover:text-[#171717] transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Daily Stock */}
          <div>
            <label className="block text-sm font-semibold text-[#171717] mb-1.5">
              Daily Stock Quota
              <span className="text-xs font-normal text-[#6B7280] ml-2">— Fresh supply every day</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                placeholder="Leave blank for unlimited"
                value={dailyStock}
                onChange={e => {
                  setDailyStock(e.target.value);
                  if (syncCurrent) setCurrentStock(e.target.value);
                }}
                className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-[#EA580C] outline-none transition text-sm"
              />
              <button
                type="button"
                onClick={() => setDailyStock('')}
                className="px-3 py-2.5 text-xs font-semibold text-[#3B82F6] bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-200 flex items-center gap-1"
              >
                <Infinity size={14} /> Unlimited
              </button>
            </div>
            <p className="text-xs text-[#6B7280] mt-1">Example: 30 means 30 portions are made each day.</p>
          </div>

          {/* Sync toggle */}
          {!isUnlimited && (
            <label className="flex items-start gap-3 p-3.5 bg-orange-50 rounded-xl border border-orange-100 cursor-pointer">
              <input
                type="checkbox"
                checked={syncCurrent}
                onChange={e => {
                  setSyncCurrent(e.target.checked);
                  if (e.target.checked) setCurrentStock(dailyStock);
                }}
                className="mt-0.5 w-4 h-4 text-[#EA580C] rounded border-gray-300 focus:ring-[#EA580C]"
              />
              <div>
                <p className="text-sm font-semibold text-[#171717]">Also reset current stock now</p>
                <p className="text-xs text-[#6B7280] mt-0.5">Sets the remaining stock back to the daily quota immediately.</p>
              </div>
            </label>
          )}

          {/* Current Stock Override (only when not syncing) */}
          {!isUnlimited && !syncCurrent && (
            <div>
              <label className="block text-sm font-semibold text-[#171717] mb-1.5">
                Current Stock (Today's Remaining)
                <span className="text-xs font-normal text-[#6B7280] ml-2">— Active as of now</span>
              </label>
              <input
                type="number"
                min="0"
                max={dailyStock || undefined}
                value={currentStock}
                onChange={e => setCurrentStock(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-[#3B82F6] outline-none transition text-sm"
              />
              <p className="text-xs text-[#6B7280] mt-1">How many units are still available for orders today.</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-[#DC2626] rounded-xl text-sm border border-red-100">
              <AlertTriangle size={16} className="flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-[#FAFAFA] hover:bg-gray-200 text-[#171717] font-semibold rounded-xl transition-all duration-200 text-sm border border-[#E5E7EB]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#EA580C] hover:bg-[#DC2626] text-white font-semibold rounded-xl transition-all duration-200 text-sm disabled:opacity-60"
          >
            {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Inventory Component ─────────────────────────────────────────────────
function OwnerInventory() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isResettingAll, setIsResettingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const apiClient = createApiClient();
      const res = await apiClient.get('/owner/inventory');
      if (res.data.success) {
        setItems(res.data.items);
      }
    } catch (err) {
      console.error("Inventory fetch error:", err);
      setError(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    const interval = setInterval(fetchInventory, 30000);
    return () => clearInterval(interval);
  }, [fetchInventory]);

  const handleSaveStock = async (itemId, { daily_stock, sync_current, current_stock_override }) => {
    const apiClient = createApiClient();
    await apiClient.put(
      `/owner/inventory/${itemId}`,
      { daily_stock, sync_current }
    );

    if (!sync_current && current_stock_override !== null && current_stock_override !== undefined) {
      await apiClient.patch(
        `/owner/inventory/${itemId}/current`,
        { current_stock: current_stock_override }
      );
    }

    await fetchInventory();
    showSuccess(`Stock settings saved for item #${itemId}`);
  };

  const handleToggleAvailability = async (item) => {
    try {
      const apiClient = createApiClient();
      await apiClient.put(
        `/owner/inventory/${item.id}`,
        { is_available: !item.is_available }
      );
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
      showSuccess(`"${item.item_name}" is now ${!item.is_available ? 'available' : 'hidden'}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update availability');
    }
  };

  const handleResetItem = async (item) => {
    try {
      const apiClient = createApiClient();
      const res = await apiClient.post(
        '/owner/inventory/reset',
        { item_id: item.id }
      );
      if (res.data.success) {
        await fetchInventory();
        showSuccess(`Stock for "${item.item_name}" reset to ${item.daily_stock}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset stock');
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('Reset current stock to daily quota for ALL items? This cannot be undone.')) return;
    setIsResettingAll(true);
    try {
      const apiClient = createApiClient();
      const res = await apiClient.post(
        '/owner/inventory/reset',
        {}
      );
      if (res.data.success) {
        await fetchInventory();
        showSuccess(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset all stock');
    } finally {
      setIsResettingAll(false);
    }
  };

  // ── Filtering ──
  const categories = ['All', ...new Set(items.map(i => i.category).filter(Boolean))];
  const filtered = items.filter(item => {
    const matchesSearch = item.item_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    let matchesStatus = true;
    if (statusFilter === 'Out of Stock') matchesStatus = item.current_stock !== null && item.current_stock >= 0 && item.current_stock === 0;
    else if (statusFilter === 'Low Stock') matchesStatus = item.current_stock !== null && item.daily_stock > 0 && (item.current_stock / item.daily_stock) <= 0.25 && item.current_stock > 0;
    else if (statusFilter === 'In Stock') matchesStatus = item.current_stock === null || item.current_stock < 0 || item.current_stock > 0;
    else if (statusFilter === 'Unlimited') matchesStatus = item.daily_stock === null || item.daily_stock < 0;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // ── Summary stats ──
  const totalItems = items.length;
  const outOfStock = items.filter(i => i.current_stock !== null && i.current_stock >= 0 && i.current_stock === 0).length;
  const lowStock = items.filter(i => i.current_stock !== null && i.daily_stock > 0 && (i.current_stock / i.daily_stock) <= 0.25 && i.current_stock > 0).length;
  const trackedItems = items.filter(i => i.daily_stock !== null && i.daily_stock >= 0).length;

  if (isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EA580C]" />
        <p className="text-sm text-[#6B7280]">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#171717] flex items-center gap-2">
            <Package size={28} className="text-[#EA580C]" />
            Inventory Management
          </h1>
          <p className="text-[#6B7280] mt-1 text-sm">
            Track daily stock, manage quotas, and the system automatically resets stock every midnight.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={fetchInventory}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5E7EB] text-gray-700 font-semibold rounded-xl hover:bg-[#FAFAFA] transition-all duration-200 text-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={handleResetAll}
            disabled={isResettingAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#3B82F6] hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-all duration-200 text-sm"
          >
            {isResettingAll ? <RefreshCw size={16} className="animate-spin" /> : <RotateCcw size={16} />}
            Reset All Stock
          </button>
        </div>
      </div>

      {/* ── Status Messages ── */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-[#DC2626] rounded-xl border border-red-100">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 text-[#16A34A] rounded-xl border border-emerald-100">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: totalItems, icon: Package, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
          { label: 'Stock Tracked', value: trackedItems, icon: BarChart3, color: 'bg-orange-50 text-[#EA580C]', border: 'border-orange-100', sub: 'with daily quota' },
          { label: 'Low Stock', value: lowStock, icon: TrendingDown, color: 'bg-amber-50 text-[#D97706]', border: 'border-amber-100', sub: '≤25% remaining' },
          { label: 'Out of Stock', value: outOfStock, icon: X, color: 'bg-red-50 text-[#DC2626]', border: 'border-red-100', sub: 'needs immediate restock' },
        ].map(({ label, value, icon: Icon, color, border, sub }) => (
          <div key={label} className={`bg-white rounded-xl p-4 border ${border}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">{label}</p>
              <div className={`p-1.5 rounded-lg ${color}`}>
                <Icon size={14} />
              </div>
            </div>
            <p className="text-2xl font-black text-[#171717]">{value}</p>
            {sub && <p className="text-xs text-[#6B7280] mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Scheduler Notice ── */}
      <div className="flex items-center gap-3 p-3.5 bg-blue-50 rounded-xl border border-blue-100">
        <div className="p-2 bg-blue-100 rounded-xl text-[#3B82F6] flex-shrink-0">
          <Clock size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-900">Automatic Daily Reset Active</p>
          <p className="text-xs text-blue-600">The system automatically resets all current stock back to daily quotas every midnight. No manual action required.</p>
        </div>
        <div className="ml-auto flex-shrink-0">
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#16A34A] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <Zap size={11} /> Active
          </span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-orange-100 focus:border-[#EA580C] outline-none transition"
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-orange-100 outline-none bg-white"
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-orange-100 outline-none bg-white"
        >
          {['All', 'In Stock', 'Low Stock', 'Out of Stock', 'Unlimited'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* ── Items Table ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <PackageOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-[#171717]">
              {items.length === 0 ? 'No menu items found' : 'No items match your filters'}
            </h3>
            <p className="text-[#6B7280] mt-1 text-sm">
              {items.length === 0
                ? 'Go to Menu Management to add items before tracking inventory.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
                  <th className="py-4 px-5 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">Item</th>
                  <th className="py-4 px-5 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">Category</th>
                  <th className="py-4 px-5 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">Daily Quota</th>
                  <th className="py-4 px-5 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">Current Stock</th>
                  <th className="py-4 px-5 font-semibold text-[#6B7280] text-xs uppercase tracking-wider">Status</th>
                  <th className="py-4 px-5 font-semibold text-[#6B7280] text-xs uppercase tracking-wider text-center">Visible</th>
                  <th className="py-4 px-5 font-semibold text-[#6B7280] text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.map(item => {
                  const isTracked = item.daily_stock !== null && item.daily_stock >= 0;
                  const isOOS = isTracked && item.current_stock !== null && item.current_stock === 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#FAFAFA] transition duration-200 ${isOOS ? 'bg-red-50/30' : ''}`}
                    >
                      {/* Item Name */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.item_name}
                              className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-[#E5E7EB]"
                              onError={e => e.target.style.display = 'none'}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 border border-[#E5E7EB]">
                              <Package size={16} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-[#171717] text-sm leading-tight">{item.item_name}</p>
                            <p className="text-xs text-[#6B7280]">₱{Number(item.price).toFixed(2)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
                          {item.category || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Daily Quota */}
                      <td className="py-4 px-5">
                        {isTracked ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[#171717]">{item.daily_stock}</span>
                            <span className="text-xs text-[#6B7280]">/ day</span>
                          </div>
                        ) : (
                          <span className="text-sm text-[#3B82F6] font-semibold flex items-center gap-1">
                            <Infinity size={14} /> Unlimited
                          </span>
                        )}
                      </td>

                      {/* Current Stock with progress bar */}
                      <td className="py-4 px-5 min-w-[160px]">
                        {isTracked ? (
                          <div>
                            <span className={`text-lg font-black ${item.current_stock <= 0 ? 'text-[#DC2626]' : item.current_stock / item.daily_stock <= 0.25 ? 'text-[#D97706]' : 'text-[#171717]'}`}>
                              {Math.max(0, item.current_stock ?? 0)}
                            </span>
                            <StockBar currentStock={item.current_stock ?? 0} dailyStock={item.daily_stock} />
                          </div>
                        ) : (
                          <span className="text-sm text-[#6B7280]">—</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-5">
                        <StockBadge currentStock={item.current_stock} dailyStock={item.daily_stock} />
                      </td>

                      {/* Availability Toggle */}
                      <td className="py-4 px-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.is_available ? 'bg-[#16A34A]' : 'bg-gray-300'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${item.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                          <span className={`text-[10px] font-bold ${item.is_available ? 'text-[#16A34A]' : 'text-[#6B7280]'}`}>
                            {item.is_available ? 'On' : 'Off'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isTracked && (
                            <button
                              onClick={() => handleResetItem(item)}
                              title="Reset current stock to daily quota"
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#3B82F6] bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 border border-blue-100"
                            >
                              <RotateCcw size={12} /> Reset
                            </button>
                          )}
                          <button
                            onClick={() => setEditingItem(item)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#EA580C] bg-orange-50 hover:bg-orange-100 rounded-lg transition-all duration-200 border border-orange-100"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── How It Works Info ── */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            icon: Package,
            color: 'text-[#EA580C] bg-orange-50',
            title: 'Daily Quota',
            desc: 'Set how many portions you prepare each day. This never changes unless you edit it.'
          },
          {
            icon: TrendingDown,
            color: 'text-[#3B82F6] bg-blue-50',
            title: 'Real-Time Deduction',
            desc: 'When a customer places an order, the current stock is instantly reduced by the quantity ordered.'
          },
          {
            icon: RotateCcw,
            color: 'text-[#16A34A] bg-emerald-50',
            title: 'Auto Daily Reset',
            desc: 'Every midnight, current stock is automatically restored to the daily quota—no manual work needed.'
          }
        ].map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="flex gap-3 p-4 bg-white rounded-xl border border-[#E5E7EB]">
            <div className={`p-2 rounded-xl h-fit flex-shrink-0 ${color}`}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#171717]">{title}</p>
              <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Edit Modal ── */}
      {editingItem && (
        <EditStockModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveStock}
        />
      )}

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default OwnerInventory;

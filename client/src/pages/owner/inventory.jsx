import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  PackageOpen, Save, RefreshCw, RotateCcw, AlertTriangle,
  CheckCircle, Package, TrendingDown, Infinity, Edit3, X,
  BarChart3, Clock, Zap
} from 'lucide-react';

const BASE_URL = () => import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
        <X size={11} /> Out of Stock
      </span>
    );
  }
  if (pct <= 25) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
        <AlertTriangle size={11} /> Critical ({pct}%)
      </span>
    );
  }
  if (pct <= 50) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
        <TrendingDown size={11} /> Low ({pct}%)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
      <CheckCircle size={11} /> In Stock ({pct}%)
    </span>
  );
}

// ─── Stock Progress Bar ───────────────────────────────────────────────────────
function StockBar({ currentStock, dailyStock }) {
  if (dailyStock === null || dailyStock < 0 || dailyStock === 0) return null;
  const pct = Math.min(100, Math.round((Math.max(0, currentStock) / dailyStock) * 100));
  const color = pct <= 25 ? 'from-red-500 to-red-400'
    : pct <= 50 ? 'from-orange-500 to-orange-400'
    : 'from-emerald-500 to-emerald-400';

  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
        <span>{currentStock} remaining</span>
        <span>of {dailyStock}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
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

    // Validate
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit Stock — {item.item_name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{item.category} · ID #{item.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Daily Stock */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Daily Stock Quota
              <span className="text-xs font-normal text-gray-400 ml-2">— Fresh supply every day</span>
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
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition text-sm"
              />
              <button
                type="button"
                onClick={() => setDailyStock('')}
                className="px-3 py-2.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition flex items-center gap-1"
              >
                <Infinity size={14} /> Unlimited
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Example: 30 means 30 portions are made each day.</p>
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
                className="mt-0.5 w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">Also reset current stock now</p>
                <p className="text-xs text-gray-500 mt-0.5">Sets the remaining stock back to the daily quota immediately.</p>
              </div>
            </label>
          )}

          {/* Current Stock Override (only when not syncing) */}
          {!isUnlimited && !syncCurrent && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Current Stock (Today's Remaining)
                <span className="text-xs font-normal text-gray-400 ml-2">— Active as of now</span>
              </label>
              <input
                type="number"
                min="0"
                max={dailyStock || undefined}
                value={currentStock}
                onChange={e => setCurrentStock(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">How many units are still available for orders today.</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
              <AlertTriangle size={16} className="flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold rounded-xl transition shadow-md text-sm disabled:opacity-60"
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
      const res = await axios.get(`${BASE_URL()}/api/owner/inventory`, { withCredentials: true });
      if (res.data.success) {
        setItems(res.data.items);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    // Poll every 30 seconds for real-time stock updates
    const interval = setInterval(fetchInventory, 30000);
    return () => clearInterval(interval);
  }, [fetchInventory]);

  const handleSaveStock = async (itemId, { daily_stock, sync_current, current_stock_override }) => {
    // Update daily_stock (and optionally sync current_stock)
    await axios.put(
      `${BASE_URL()}/api/owner/inventory/${itemId}`,
      { daily_stock, sync_current },
      { withCredentials: true }
    );

    // If not syncing and a specific current_stock override was given, apply it separately
    if (!sync_current && current_stock_override !== null && current_stock_override !== undefined) {
      await axios.patch(
        `${BASE_URL()}/api/owner/inventory/${itemId}/current`,
        { current_stock: current_stock_override },
        { withCredentials: true }
      );
    }

    await fetchInventory();
    showSuccess(`Stock settings saved for item #${itemId}`);
  };

  const handleToggleAvailability = async (item) => {
    try {
      await axios.put(
        `${BASE_URL()}/api/owner/inventory/${item.id}`,
        { is_available: !item.is_available },
        { withCredentials: true }
      );
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
      showSuccess(`"${item.item_name}" is now ${!item.is_available ? 'available' : 'hidden'}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update availability');
    }
  };

  const handleResetItem = async (item) => {
    try {
      const res = await axios.post(
        `${BASE_URL()}/api/owner/inventory/reset`,
        { item_id: item.id },
        { withCredentials: true }
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
      const res = await axios.post(
        `${BASE_URL()}/api/owner/inventory/reset`,
        {},
        { withCredentials: true }
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        <p className="text-sm text-gray-500">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package size={28} className="text-orange-500" />
            Inventory Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Track daily stock, manage quotas, and the system automatically resets stock every midnight.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={fetchInventory}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition shadow-sm text-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={handleResetAll}
            disabled={isResettingAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition shadow-md text-sm"
          >
            {isResettingAll ? <RefreshCw size={16} className="animate-spin" /> : <RotateCcw size={16} />}
            Reset All Stock
          </button>
        </div>
      </div>

      {/* ── Status Messages ── */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: totalItems, icon: Package, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
          { label: 'Stock Tracked', value: trackedItems, icon: BarChart3, color: 'bg-orange-50 text-orange-600', border: 'border-orange-100', sub: 'with daily quota' },
          { label: 'Low Stock', value: lowStock, icon: TrendingDown, color: 'bg-yellow-50 text-yellow-600', border: 'border-yellow-100', sub: '≤25% remaining' },
          { label: 'Out of Stock', value: outOfStock, icon: X, color: 'bg-red-50 text-red-600', border: 'border-red-100', sub: 'needs immediate restock' },
        ].map(({ label, value, icon: Icon, color, border, sub }) => (
          <div key={label} className={`bg-white rounded-2xl p-4 border ${border} shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
              <div className={`p-1.5 rounded-lg ${color}`}>
                <Icon size={14} />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Scheduler Notice ── */}
      <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100">
        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600 flex-shrink-0">
          <Clock size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-900">Automatic Daily Reset Active</p>
          <p className="text-xs text-indigo-600">The system automatically resets all current stock back to daily quotas every midnight. No manual action required.</p>
        </div>
        <div className="ml-auto flex-shrink-0">
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
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
          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition"
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-100 outline-none"
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-100 outline-none"
        >
          {['All', 'In Stock', 'Low Stock', 'Out of Stock', 'Unlimited'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* ── Items Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <PackageOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900">
              {items.length === 0 ? 'No menu items found' : 'No items match your filters'}
            </h3>
            <p className="text-gray-500 mt-1 text-sm">
              {items.length === 0
                ? 'Go to Menu Management to add items before tracking inventory.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Item</th>
                  <th className="py-4 px-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Category</th>
                  <th className="py-4 px-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Daily Quota</th>
                  <th className="py-4 px-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Current Stock</th>
                  <th className="py-4 px-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="py-4 px-5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">Visible</th>
                  <th className="py-4 px-5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(item => {
                  const isTracked = item.daily_stock !== null && item.daily_stock >= 0;
                  const isOOS = isTracked && item.current_stock !== null && item.current_stock === 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50/60 transition duration-150 ${isOOS ? 'bg-red-50/30' : ''}`}
                    >
                      {/* Item Name */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.item_name}
                              className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                              onError={e => e.target.style.display = 'none'}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package size={16} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900 text-sm leading-tight">{item.item_name}</p>
                            <p className="text-xs text-gray-400">₱{Number(item.price).toFixed(2)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
                          {item.category || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Daily Quota */}
                      <td className="py-4 px-5">
                        {isTracked ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-gray-900">{item.daily_stock}</span>
                            <span className="text-xs text-gray-400">/ day</span>
                          </div>
                        ) : (
                          <span className="text-sm text-blue-500 font-semibold flex items-center gap-1">
                            <Infinity size={14} /> Unlimited
                          </span>
                        )}
                      </td>

                      {/* Current Stock with progress bar */}
                      <td className="py-4 px-5 min-w-[160px]">
                        {isTracked ? (
                          <div>
                            <span className={`text-lg font-black ${item.current_stock <= 0 ? 'text-red-600' : item.current_stock / item.daily_stock <= 0.25 ? 'text-orange-600' : 'text-gray-900'}`}>
                              {Math.max(0, item.current_stock ?? 0)}
                            </span>
                            <StockBar currentStock={item.current_stock ?? 0} dailyStock={item.daily_stock} />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
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
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.is_available ? 'bg-emerald-500' : 'bg-gray-300'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${item.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                          <span className={`text-[10px] font-bold ${item.is_available ? 'text-emerald-600' : 'text-gray-400'}`}>
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
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-100"
                            >
                              <RotateCcw size={12} /> Reset
                            </button>
                          )}
                          <button
                            onClick={() => setEditingItem(item)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition border border-orange-100"
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
            color: 'text-orange-500 bg-orange-50',
            title: 'Daily Quota',
            desc: 'Set how many portions you prepare each day. This never changes unless you edit it.'
          },
          {
            icon: TrendingDown,
            color: 'text-blue-500 bg-blue-50',
            title: 'Real-Time Deduction',
            desc: 'When a customer places an order, the current stock is instantly reduced by the quantity ordered.'
          },
          {
            icon: RotateCcw,
            color: 'text-emerald-500 bg-emerald-50',
            title: 'Auto Daily Reset',
            desc: 'Every midnight, current stock is automatically restored to the daily quota—no manual work needed.'
          }
        ].map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="flex gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className={`p-2 rounded-xl h-fit flex-shrink-0 ${color}`}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
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
      `}</style>
    </div>
  );
}

export default OwnerInventory;

import { useState, useEffect } from 'react';
import { createApiClient } from '../../services/apiClient';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Menu as MenuIcon, ChevronDown, ChevronUp, Layers, Tag, Banknote, AlertCircle, Check } from 'lucide-react';

// ── Combo type presets ───────────────────────────────────────────────────────
const COMBO_PRESETS = [
  { label: 'Meat + Veggie', slots: [{ component_type: 'Meat', slot_index: 0, options: [] }, { component_type: 'Veggie', slot_index: 1, options: [] }] },
  { label: 'Meat + Meat',   slots: [{ component_type: 'Meat', slot_index: 0, options: [] }, { component_type: 'Meat',  slot_index: 1, options: [] }] },
  { label: 'Veggie + Veggie', slots: [{ component_type: 'Veggie', slot_index: 0, options: [] }, { component_type: 'Veggie', slot_index: 1, options: [] }] },
  { label: 'Meat + Rice',   slots: [{ component_type: 'Meat', slot_index: 0, options: [] }, { component_type: 'Rice', slot_index: 1, options: [] }] },
  { label: 'Custom',        slots: [] },
];

const COMPONENT_TYPES = ['Meat', 'Veggie', 'Rice', 'Soup', 'Fish', 'Noodle', 'Dessert', 'Other'];

// ── Empty combo scaffold ─────────────────────────────────────────────────────
const emptyCombo = () => ({
  _tempId: Date.now() + Math.random(),
  label: '',
  price: '',
  slots: [],
  isOpen: true,
});

const emptySlot = (idx = 0) => ({
  component_type: 'Meat',
  slot_index: idx,
  options: [''],
});

// ── BudgetMealBuilder ────────────────────────────────────────────────────────
function BudgetMealBuilder({ combinations, onChange }) {
  const setCombinations = onChange;

  const addCombo = () => setCombinations(prev => [...prev, emptyCombo()]);

  const removeCombo = (tempId) =>
    setCombinations(prev => prev.filter(c => c._tempId !== tempId));

  const updateCombo = (tempId, field, value) =>
    setCombinations(prev => prev.map(c => c._tempId === tempId ? { ...c, [field]: value } : c));

  const toggleCombo = (tempId) =>
    setCombinations(prev => prev.map(c => c._tempId === tempId ? { ...c, isOpen: !c.isOpen } : c));

  const applyPreset = (tempId, preset) => {
    const slots = preset.slots.map((s, i) => ({ ...emptySlot(i), component_type: s.component_type }));
    setCombinations(prev => prev.map(c =>
      c._tempId === tempId ? { ...c, label: preset.label === 'Custom' ? c.label : preset.label, slots } : c
    ));
  };

  const addSlot = (tempId) =>
    setCombinations(prev => prev.map(c => {
      if (c._tempId !== tempId) return c;
      return { ...c, slots: [...c.slots, emptySlot(c.slots.length)] };
    }));

  const removeSlot = (tempId, slotIdx) =>
    setCombinations(prev => prev.map(c => {
      if (c._tempId !== tempId) return c;
      return { ...c, slots: c.slots.filter((_, i) => i !== slotIdx).map((s, i) => ({ ...s, slot_index: i })) };
    }));

  const updateSlotType = (tempId, slotIdx, newType) =>
    setCombinations(prev => prev.map(c => {
      if (c._tempId !== tempId) return c;
      return { ...c, slots: c.slots.map((s, i) => i === slotIdx ? { ...s, component_type: newType } : s) };
    }));

  const addOption = (tempId, slotIdx) =>
    setCombinations(prev => prev.map(c => {
      if (c._tempId !== tempId) return c;
      return {
        ...c, slots: c.slots.map((s, i) =>
          i === slotIdx ? { ...s, options: [...s.options, ''] } : s
        )
      };
    }));

  const updateOption = (tempId, slotIdx, optIdx, value) =>
    setCombinations(prev => prev.map(c => {
      if (c._tempId !== tempId) return c;
      return {
        ...c, slots: c.slots.map((s, i) =>
          i === slotIdx ? {
            ...s, options: s.options.map((o, j) => j === optIdx ? value : o)
          } : s
        )
      };
    }));

  const removeOption = (tempId, slotIdx, optIdx) =>
    setCombinations(prev => prev.map(c => {
      if (c._tempId !== tempId) return c;
      return {
        ...c, slots: c.slots.map((s, i) =>
          i === slotIdx ? { ...s, options: s.options.filter((_, j) => j !== optIdx) } : s
        )
      };
    }));

  return (
    <div className="space-y-4">
      {combinations.length === 0 && (
        <div className="flex flex-col items-center py-8 text-center border-2 border-dashed border-orange-200 rounded-2xl bg-orange-50/50">
          <Layers className="text-orange-400 mb-2" size={28} />
          <p className="font-semibold text-gray-700 text-sm">No combinations yet</p>
          <p className="text-xs text-gray-500 mt-1">Add combo types like Meat + Veggie with their options</p>
        </div>
      )}

      {combinations.map((combo, comboIdx) => (
        <div key={combo._tempId} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Combo Header */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-100/50 cursor-pointer"
            onClick={() => toggleCombo(combo._tempId)}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-black">
                {comboIdx + 1}
              </div>
              <span className="font-bold text-sm text-gray-800">
                {combo.label || 'Untitled Combination'}
              </span>
              {combo.price && (
                <span className="text-xs font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                  ₱{parseFloat(combo.price).toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeCombo(combo._tempId); }}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 size={14} />
              </button>
              {combo.isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </div>
          </div>

          {combo.isOpen && (
            <div className="p-4 space-y-4">
              {/* Preset Pills */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Presets</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMBO_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(combo._tempId, preset)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border border-orange-200 bg-white text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Combo Label + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Combo Name *</label>
                  <div className="relative">
                    <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. Meat + Veggie"
                      value={combo.label}
                      onChange={e => updateCombo(combo._tempId, 'label', e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Price (₱) *</label>
                  <div className="relative">
                    <Banknote size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={combo.price}
                      onChange={e => updateCombo(combo._tempId, 'price', e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Slots */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Component Slots</p>
                  <button
                    type="button"
                    onClick={() => addSlot(combo._tempId)}
                    className="text-xs flex items-center gap-1 font-semibold text-orange-600 hover:text-orange-700 transition"
                  >
                    <Plus size={12} /> Add Slot
                  </button>
                </div>

                {combo.slots.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No slots yet. Apply a preset or add a slot manually.</p>
                )}

                {combo.slots.map((slot, slotIdx) => (
                  <div key={slotIdx} className="p-3 rounded-xl border border-gray-100 bg-gray-50 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Slot {slotIdx + 1}</span>
                      <select
                        value={slot.component_type}
                        onChange={e => updateSlotType(combo._tempId, slotIdx, e.target.value)}
                        className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-300 outline-none"
                      >
                        {COMPONENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeSlot(combo._tempId, slotIdx)}
                        className="p-1 text-red-400 hover:text-red-600 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Options */}
                    <div className="space-y-1.5 ml-1">
                      {slot.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder={`${slot.component_type} option ${optIdx + 1}`}
                            value={opt}
                            onChange={e => updateOption(combo._tempId, slotIdx, optIdx, e.target.value)}
                            className="flex-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-300 outline-none bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(combo._tempId, slotIdx, optIdx)}
                            className="p-1 text-red-400 hover:text-red-600 transition flex-shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(combo._tempId, slotIdx)}
                        className="text-[11px] flex items-center gap-1 font-semibold text-blue-500 hover:text-blue-700 transition mt-1"
                      >
                        <Plus size={11} /> Add {slot.component_type} option
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addCombo}
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-orange-300 text-orange-600 font-semibold text-sm rounded-2xl hover:bg-orange-50 transition"
      >
        <Plus size={16} /> Add Combination Type
      </button>
    </div>
  );
}

// ── Main OwnerMenu component ─────────────────────────────────────────────────
function OwnerMenu() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    half_price: '',
    large_price: '',
    category: '',
    isAvailable: true,
    image_url: '',
    inventory_count: -1
  });
  const [combinations, setCombinations] = useState([]);

  const fetchMenu = async () => {
    try {
      setIsLoading(true);
      const apiClient = createApiClient();
      const response = await apiClient.get('/owner/menu');
      if (response.data.success) setItems(response.data.items);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  const handleOpenModal = async (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.item_name,
        description: item.description || '',
        price: item.price,
        half_price: item.half_price || '',
        large_price: item.large_price || '',
        category: item.category || '',
        isAvailable: item.is_available,
        image_url: item.image_url || '',
        inventory_count: item.inventory_count ?? -1
      });
      // Load existing combinations if Budget Meal
      if (item.category === 'Budget Meal') {
        try {
          const apiClient = createApiClient();
          const res = await apiClient.get(`/owner/menu/${item.id}/combinations`);
          if (res.data.success) {
            const loaded = res.data.combinations.map(c => ({
              ...c,
              _tempId: Date.now() + Math.random(),
              price: String(c.price),
              isOpen: false,
              slots: c.slots.map(s => ({
                ...s,
                options: s.options.map(o => o.name)
              }))
            }));
            setCombinations(loaded);
          } else {
            setCombinations([]);
          }
        } catch { setCombinations([]); }
      } else {
        setCombinations([]);
      }
    } else {
      setEditingItem(null);
      setFormData({ name: '', description: '', price: '', half_price: '', large_price: '', category: '', isAvailable: true, image_url: '', inventory_count: -1 });
      setCombinations([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setCombinations([]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Reset combinations when switching away from Budget Meal
    if (name === 'category' && value !== 'Budget Meal') setCombinations([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate budget meal combinations
    if (formData.category === 'Budget Meal') {
      if (combinations.length === 0) {
        alert('Please add at least one combination for this Budget Meal.');
        return;
      }
      for (const combo of combinations) {
        if (!combo.label.trim()) { alert('All combinations must have a name.'); return; }
        if (!combo.price || isNaN(parseFloat(combo.price))) { alert(`Combination "${combo.label}" must have a valid price.`); return; }
        for (const slot of combo.slots) {
          const validOpts = slot.options.filter(o => o.trim());
          if (validOpts.length === 0) { alert(`Each slot in "${combo.label}" must have at least one option.`); return; }
        }
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        price: formData.category === 'Budget Meal' ? (parseFloat(combinations[0]?.price) || 0) : parseFloat(formData.price),
        half_price: formData.half_price ? parseFloat(formData.half_price) : null,
        large_price: formData.large_price ? parseFloat(formData.large_price) : null,
        inventory_count: parseInt(formData.inventory_count)
      };

      let menuItemId;
      const apiClient = createApiClient();
      if (editingItem) {
        await apiClient.put(`/owner/menu/${editingItem.id}`, payload);
        menuItemId = editingItem.id;
      } else {
        const res = await apiClient.post('/owner/menu', payload);
        menuItemId = res.data.id;
      }

      // Save combinations if Budget Meal
      if (formData.category === 'Budget Meal' && menuItemId) {
        const comboPayload = combinations.map(c => ({
          label: c.label,
          price: parseFloat(c.price),
          slots: c.slots.map(s => ({
            component_type: s.component_type,
            slot_index: s.slot_index,
            options: s.options.filter(o => o.trim())
          }))
        }));
        await apiClient.put(
          `/owner/menu/${menuItemId}/combinations`,
          { combinations: comboPayload }
        );
      }

      setSuccessMsg(editingItem ? 'Item updated successfully!' : 'Item added successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      handleCloseModal();
      fetchMenu();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        const apiClient = createApiClient();
        await apiClient.delete(`/owner/menu/${id}`);
        fetchMenu();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting item');
      }
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Menu Management</h1>
          <p className="text-gray-500 mt-1">Add, edit, or remove items from your menu.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
        >
          <Plus size={18} />
          Add Menu Item
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl">
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Responsive table/list */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="hidden lg:grid grid-cols-[2.2fr_1fr_1fr_1fr_1.2fr] gap-4 px-6 py-4 bg-gray-50/80 border-b border-gray-100">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Menu Item</span>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Category</span>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Price</span>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</span>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Actions</span>
        </div>

        <div className="divide-y divide-gray-100">
          {items.map(item => (
            <div key={item.id} className="group px-4 sm:px-5 lg:px-6 py-4 transition-colors hover:bg-gray-50/70">
              <div className="grid grid-cols-1 lg:grid-cols-[2.2fr_1fr_1fr_1fr_1.2fr] gap-4 lg:gap-6 items-start lg:items-center">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <ImageIcon size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.item_name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{item.description || 'No description provided'}</p>
                  </div>
                </div>

                <div className="lg:block flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 lg:hidden">Category</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {item.category}
                  </span>
                </div>

                <div className="lg:block flex items-start justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 lg:hidden">Price</span>
                  <div className="text-left lg:text-left">
                    {item.category === 'Budget Meal' ? (
                      <span className="font-semibold text-gray-900 text-sm">From ₱{parseFloat(item.price).toFixed(2)}</span>
                    ) : item.category === 'Drinks' ? (
                      <div className="space-y-0.5">
                        <p className="font-semibold text-gray-900 text-sm">₱{parseFloat(item.price).toFixed(2)} Med</p>
                        {item.half_price && <p className="text-xs text-gray-500">S: ₱{parseFloat(item.half_price).toFixed(2)}</p>}
                        {item.large_price && <p className="text-xs text-gray-500">L: ₱{parseFloat(item.large_price).toFixed(2)}</p>}
                      </div>
                    ) : (
                      <span className="font-semibold text-gray-900 text-sm">₱{parseFloat(item.price).toFixed(2)}</span>
                    )}
                  </div>
                </div>

                <div className="lg:block flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 lg:hidden">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${item.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 lg:pt-0">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 text-sm font-medium"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-all duration-200 text-sm font-medium"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && !isLoading && (
          <div className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <MenuIcon size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No menu items yet</h3>
            <p className="text-gray-500 mb-4">Start building your restaurant's menu by adding your first item.</p>
            <button onClick={() => handleOpenModal()} className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md">
              Add Menu Item
            </button>
          </div>
        )}
      </div>

      {/* Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-2xl flex flex-col max-h-[86vh] animate-slide-up">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
                {formData.category === 'Budget Meal' && (
                  <p className="text-xs text-orange-600 font-medium mt-0.5 flex items-center gap-1">
                    <Layers size={12} /> Budget Meal — Define combinations & options below
                  </p>
                )}
              </div>
              <button type="button" onClick={handleCloseModal} className="text-gray-400 hover:text-gray-700 transition p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Basic Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Item Name *</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Category *</label>
                    <select required name="category" value={formData.category} onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition">
                      <option value="">Select Category</option>
                      <option value="Main">Main</option>
                      <option value="Drinks">Drinks</option>
                      <option value="Snack">Snack</option>
                      <option value="Dessert">Dessert</option>
                      <option value="Budget Meal">Budget Meal</option>
                    </select>
                  </div>

                  {/* Pricing based on category */}
                  {formData.category === 'Drinks' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Small Price (₱) *</label>
                        <input required min="0" step="0.01" type="number" name="half_price" value={formData.half_price} onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Medium Price (₱) *</label>
                        <input required min="0" step="0.01" type="number" name="price" value={formData.price} onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Large Price (₱) *</label>
                        <input required min="0" step="0.01" type="number" name="large_price" value={formData.large_price} onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition" />
                      </div>
                    </>
                  )}

                  {formData.category !== 'Drinks' && formData.category !== 'Budget Meal' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Full Price (₱) *</label>
                        <input required min="0" step="0.01" type="number" name="price" value={formData.price} onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Half Price (₱) [Optional]</label>
                        <input min="0" step="0.01" type="number" name="half_price" value={formData.half_price} onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition" />
                      </div>
                    </>
                  )}

                  {formData.category === 'Budget Meal' && (
                    <div className="sm:col-span-2">
                      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 mb-1">
                        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                        <span>Pricing is set per combination below. The first combination's price will be saved as the item's base price for display.</span>
                      </div>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Description</label>
                    <textarea rows="2" name="description" value={formData.description} onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition resize-none"></textarea>
                  </div>

                  {/* Photo Upload */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Menu Photo</label>
                    <div className="flex items-center gap-4">
                      {formData.image_url ? (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                          <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                            className="absolute top-1 right-1 bg-white/90 p-1 rounded-md text-red-600 hover:bg-red-50 transition">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0 bg-gray-50">
                          <ImageIcon className="text-gray-400" size={24} />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setFormData(prev => ({ ...prev, image_url: reader.result }));
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                        />
                        <p className="text-xs text-gray-500 mt-1">Max 5MB. JPEG/PNG recommended.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Stock Limit (-1 = unlimited)</label>
                    <input type="number" name="inventory_count" value={formData.inventory_count} onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition" />
                  </div>

                  <div className="flex items-center col-span-1 mt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleChange}
                        className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                      <span className="font-semibold text-gray-900 text-sm">Currently available</span>
                    </label>
                  </div>
                </div>

                {/* Budget Meal Combinations Section */}
                {formData.category === 'Budget Meal' && (
                  <div className="border-t border-dashed border-orange-200 pt-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Layers size={18} className="text-orange-500" />
                      <h3 className="font-bold text-gray-900">Combinations Builder</h3>
                      <span className="text-xs text-gray-400 font-medium">({combinations.length} combo{combinations.length !== 1 ? 's' : ''})</span>
                    </div>
                    <BudgetMealBuilder combinations={combinations} onChange={setCombinations} />
                  </div>
                )}

                <div className="pt-3 flex flex-col sm:flex-row gap-2.5">
                  <button type="button" onClick={handleCloseModal}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-all duration-200">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving}
                    className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                    {isSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : (editingItem ? 'Save Changes' : 'Create Item')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default OwnerMenu;

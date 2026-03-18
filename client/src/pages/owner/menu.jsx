import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';

function OwnerMenu() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isAvailable: true,
    image_url: '',
    inventory_count: -1
  });

  const fetchMenu = async () => {
    try {
      setIsLoading(true);
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${baseURL}/api/owner/menu`, { withCredentials: true });
      if (response.data.success) {
        setItems(response.data.items);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.item_name,
        description: item.description || '',
        price: item.price,
        category: item.category || '',
        isAvailable: item.is_available,
        image_url: item.image_url || '',
        inventory_count: item.inventory_count ?? -1
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '', description: '', price: '', category: '', isAvailable: true, image_url: '', inventory_count: -1
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const payload = { ...formData, price: parseFloat(formData.price), inventory_count: parseInt(formData.inventory_count) };
      
      if (editingItem) {
        await axios.put(`${baseURL}/api/owner/menu/${editingItem.id}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${baseURL}/api/owner/menu`, payload, { withCredentials: true });
      }
      handleCloseModal();
      fetchMenu();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving item');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        await axios.delete(`${baseURL}/api/owner/menu/${id}`, { withCredentials: true });
        fetchMenu();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting item');
      }
    }
  };

  if (isLoading && items.length === 0) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-500 mt-1">Add, edit, or remove items from your menu.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold rounded-xl transition shadow-md hover:shadow-lg"
        >
          <Plus size={20} />
          Add Item
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition group">
            <div className="h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden">
              {item.image_url ? (
                <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              ) : (
                <ImageIcon size={40} className="text-gray-300" />
              )}
              {/* Status Badge */}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-sm backdrop-blur-md ${item.is_available ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                  {item.is_available ? 'Available' : 'Unavailable'}
                </span>
                {item.inventory_count >= 0 && (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/90 text-white shadow-sm backdrop-blur-md">
                    Stock: {item.inventory_count}
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-900 leading-tight">{item.item_name}</h3>
                <span className="font-bold text-orange-600">${parseFloat(item.price).toFixed(2)}</span>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-md">{item.category}</span>
              </div>

              <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{item.description}</p>
              
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => handleOpenModal(item)}
                  className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-600 font-medium rounded-lg transition"
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="flex justify-center items-center p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && !isLoading && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MenuIcon size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No menu items yet</h3>
            <p className="text-gray-500 mb-4">Start building your restaurant's menu by adding your first item.</p>
            <button onClick={() => handleOpenModal()} className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition">
              Add First Item
            </button>
          </div>
        )}
      </div>

      {/* Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-700 transition p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Item Name *</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Price ($) *</label>
                    <input required min="0" step="0.01" type="number" name="price" value={formData.price} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Category</label>
                    <input type="text" name="category" placeholder="e.g. Mains, Drinks" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Description</label>
                    <textarea rows="3" name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition resize-none"></textarea>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Image URL</label>
                    <input type="url" name="image_url" placeholder="https://" value={formData.image_url} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Limit Stock (-1 for unlimited)</label>
                    <input type="number" name="inventory_count" value={formData.inventory_count} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition" />
                  </div>
                  <div className="col-span-2 mt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                      <span className="font-semibold text-gray-900">Item is currently available to order</span>
                    </label>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition shadow-md">{editingItem ? 'Save Changes' : 'Create Item'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
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

import { useState, useEffect } from 'react';
import axios from 'axios';
import { PackageOpen, Save, RefreshCw } from 'lucide-react';

function OwnerInventory() {
  const [items, setItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${baseURL}/api/owner/menu`, { withCredentials: true });
      if (response.data.success) {
        setItems(response.data.items);
        setSavedItems(JSON.parse(JSON.stringify(response.data.items)));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockChange = (id, newStock) => {
    setItems(items.map(item => item.id === id ? { ...item, inventory_count: newStock } : item));
  };

  const toggleAvailability = (id) => {
    setItems(items.map(item => item.id === id ? { ...item, is_available: !item.is_available } : item));
  };

  const getHasChanges = () => {
    return JSON.stringify(items) !== JSON.stringify(savedItems);
  };

  const updateInventory = async () => {
    try {
      setIsSaving(true);
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      // Basic optimization: only send modified items
      const modifiedItems = items.filter((item, index) => JSON.stringify(item) !== JSON.stringify(savedItems[index]));
      
      const promises = modifiedItems.map(item => 
        axios.put(`${baseURL}/api/owner/menu/${item.id}`, {
          name: item.item_name,
          description: item.description,
          price: item.price,
          category: item.category,
          image_url: item.image_url,
          isAvailable: item.is_available,
          inventory_count: parseInt(item.inventory_count)
        }, { withCredentials: true })
      );

      await Promise.all(promises);
      await fetchInventory(); // Refresh clean state
      alert('Inventory saved successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating inventory');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && items.length === 0) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 mt-1">Track stock levels and quickly toggle item availability.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchInventory} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw size={18} />
            Discard Changes
          </button>
          <button 
            onClick={updateInventory}
            disabled={!getHasChanges() || isSaving}
            className={`flex items-center gap-2 px-5 py-2 font-semibold rounded-xl transition shadow-md ${
              getHasChanges() && !isSaving
                ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white hover:shadow-lg' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
            Save Inventory
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <PackageOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No menu items found</h3>
            <p className="text-gray-500">Go to Menu Management to add items before tracking inventory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm tracking-wider uppercase">Item Name</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm tracking-wider uppercase">Category</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm tracking-wider uppercase w-48">Stock Count</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm tracking-wider uppercase text-right">Visibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => {
                  const hasStockWarning = item.inventory_count >= 0 && item.inventory_count <= 5;
                  const isOutOfStock = item.inventory_count === 0;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition duration-150">
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900">{item.item_name}</div>
                        {(hasStockWarning && !isOutOfStock) && <div className="text-xs text-orange-600 font-semibold mt-1">Low Stock</div>}
                        {isOutOfStock && <div className="text-xs text-red-600 font-semibold mt-1">Out of Stock</div>}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">{item.category || 'Uncategorized'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <input
                          type="number"
                          value={item.inventory_count}
                          onChange={(e) => handleStockChange(item.id, e.target.value)}
                          className={`w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 transition ${
                            isOutOfStock ? 'border-red-300 bg-red-50 text-red-700' :
                            hasStockWarning ? 'border-orange-300 bg-orange-50 text-orange-700' :
                            'border-gray-200 focus:border-orange-500'
                          }`}
                        />
                        <div className="text-xs text-gray-400 mt-1">-1 for unlimited</div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => toggleAvailability(item.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            item.is_available ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            item.is_available ? 'translate-x-6' : 'translate-x-1'
                          }`}/>
                        </button>
                        <span className={`block text-xs font-semibold mt-1 ${item.is_available ? 'text-green-600' : 'text-gray-500'}`}>
                          {item.is_available ? 'Available' : 'Hidden'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerInventory;

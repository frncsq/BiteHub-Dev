import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Building2, User, FileText, CheckCircle, AlertCircle } from 'lucide-react';

function OwnerSettings() {
  const [formData, setFormData] = useState({
    business_name: '',
    business_address: '',
    city: '',
    owner_name: '',
    owner_phone: '',
    business_email: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${baseURL}/api/owner/settings`, { withCredentials: true });
      if (response.data.success && response.data.settings) {
        setFormData({
          business_name: response.data.settings.business_name || '',
          business_address: response.data.settings.business_address || '',
          city: response.data.settings.city || '',
          owner_name: response.data.settings.owner_name || '',
          owner_phone: response.data.settings.owner_phone || '',
          business_email: response.data.settings.business_email || '', // Usually read-only
          description: response.data.settings.description || ''
        });
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load settings');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setMessage('');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.put(`${baseURL}/api/owner/settings`, formData, { withCredentials: true });
      setMessage('Settings updated successfully');
      setMessageType('success');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error updating settings');
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Restaurant Settings</h1>
        <p className="text-gray-500 mt-1">Manage your public restaurant profile and business details.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {messageType === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium">{message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business Profile */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <Building2 className="text-orange-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Business Profile</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Business Name</label>
              <input required type="text" name="business_name" value={formData.business_name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition" />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Business Email (Login ID)</label>
              <input type="email" value={formData.business_email} disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">Contact support to change your primary business email.</p>
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-gray-900 mb-2">City</label>
              <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Full Business Address</label>
              <input required type="text" name="business_address" value={formData.business_address} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition" />
            </div>
          </div>
        </div>

        {/* Public Description */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <FileText className="text-orange-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Public Description</h2>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-2">This description appears to customers browsing your restaurant on BiteHub.</label>
            <textarea rows="4" name="description" value={formData.description} onChange={handleChange} placeholder="Tell customers about your cuisine, history, and specialties..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition resize-none"></textarea>
          </div>
        </div>

        {/* Owner Contact Information */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <User className="text-orange-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Key Contact Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Owner Full Name</label>
              <input required type="text" name="owner_name" value={formData.owner_name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Contact Phone</label>
              <input required type="tel" name="owner_phone" value={formData.owner_phone} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-orange-400 disabled:to-orange-400 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> Saving...</>
            ) : (
              <><Save size={20} /> Save Changes</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default OwnerSettings;

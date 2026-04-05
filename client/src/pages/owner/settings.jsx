import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createApiClient } from '../../services/apiClient';
import { Save, Building2, User, FileText, CheckCircle, AlertCircle, LogOut } from 'lucide-react';

function OwnerSettings() {
  const [formData, setFormData] = useState({
    business_name: '',
    business_address: '',
    city: '',
    owner_name: '',
    owner_phone: '',
    business_email: '',
    description: '',
    restaurant_logo_url: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navigate = useNavigate();
  const logoutRef = useRef(null);

  // Close logout confirm when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (logoutRef.current && !logoutRef.current.contains(e.target)) {
        setShowLogoutConfirm(false);
      }
    };
    if (showLogoutConfirm) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLogoutConfirm]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    navigate('/');
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const apiClient = createApiClient();
      const response = await apiClient.get('/owner/settings');
      if (response.data.success && response.data.settings) {
        setFormData({
          business_name: response.data.settings.business_name || '',
          business_address: response.data.settings.business_address || '',
          city: response.data.settings.city || '',
          owner_name: response.data.settings.owner_name || '',
          owner_phone: response.data.settings.owner_phone || '',
          business_email: response.data.settings.business_email || '', // Usually read-only
          description: response.data.settings.description || '',
          restaurant_logo_url: response.data.settings.restaurant_logo_url || ''
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

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
         setMessage('File size should be less than 5MB');
         setMessageType('error');
         return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result;
        // Compress large images using a canvas to keep base64 size manageable
        const img = new Image();
        img.onload = () => {
          const MAX_SIDE = 1200;
          let { width, height } = img;
          if (width > MAX_SIDE || height > MAX_SIDE) {
            const ratio = Math.min(MAX_SIDE / width, MAX_SIDE / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setFormData(prev => ({ ...prev, restaurant_logo_url: compressed }));
          setMessage('Photo selected – click "Save Changes" to apply.');
          setMessageType('success');
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setMessage('');
      const apiClient = createApiClient();
      await apiClient.put('/owner/settings', formData);
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
    <div className="max-w-[1000px] mx-auto pb-12">
      {/* Header & Main Save Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your restaurant profile, contact details, and account.</p>
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md disabled:shadow-none"
        >
          {isSaving ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-white"></div> Saving...</> : <><Save size={18} /> Save Changes</>}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-8 flex items-center gap-3 text-sm font-medium ${messageType === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {messageType === 'success' ? <CheckCircle size={18} className="text-emerald-500" /> : <AlertCircle size={18} className="text-red-500" />}
          {message}
        </div>
      )}

      {/* Main Settings Form Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
        
        {/* Profile Section */}
        <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="text-orange-500" size={18} /> Business Profile
            </h2>
            <p className="text-sm text-gray-500 mt-2">Update your restaurant's name, logo, and core details.</p>
          </div>
          <div className="space-y-6">
            {/* Logo Upload */}
            <div className="flex gap-6 items-center">
               <div className="relative w-24 h-24 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 group">
                  {formData.restaurant_logo_url ? (
                    <img src={formData.restaurant_logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="text-gray-300" size={32} />
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-semibold">Change</span>
                  </div>
               </div>
               <div className="flex-1">
                 <label className="block text-sm font-semibold text-gray-900 mb-1.5">Restaurant Photo</label>
                 <p className="text-xs text-gray-500 mb-3">Square, high-res image recommended (max 5MB).</p>
                 <button type="button" className="relative px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 rounded-lg transition-colors overflow-hidden">
                    Choose File
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                 </button>
               </div>
            </div>

            {/* Core Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">Business Name</label>
                <input required type="text" name="business_name" value={formData.business_name} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50/80 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all text-gray-900 outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">Email (Login ID)</label>
                <input type="email" value={formData.business_email} disabled className="w-full px-4 py-2.5 bg-gray-50/80 border border-transparent rounded-xl text-gray-400 cursor-not-allowed outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">City</label>
                <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50/80 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all text-gray-900 outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">Full Address</label>
                <input required type="text" name="business_address" value={formData.business_address} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50/80 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all text-gray-900 outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Public Description */}
        <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileText className="text-orange-500" size={18} /> About Section
            </h2>
            <p className="text-sm text-gray-500 mt-2">Write a short description to welcome customers.</p>
          </div>
          <div>
            <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">Public Description</label>
            <textarea rows="4" name="description" value={formData.description} onChange={handleChange} placeholder="Tell customers about your cuisine, history, and specialties..." className="w-full px-4 py-3 bg-gray-50/80 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all text-gray-900 outline-none resize-none"></textarea>
          </div>
        </div>

        {/* Owner Details */}
        <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <User className="text-orange-500" size={18} /> Key Contact
            </h2>
            <p className="text-sm text-gray-500 mt-2">Personal details for BiteHub administrative contact.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">Full Name</label>
              <input required type="text" name="owner_name" value={formData.owner_name} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50/80 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all text-gray-900 outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">Contact Phone</label>
              <input required type="tel" name="owner_phone" value={formData.owner_phone} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50/80 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all text-gray-900 outline-none" />
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 bg-gray-50/30">
          <div>
            <h2 className="text-base font-bold text-red-600 flex items-center gap-2">
              <LogOut size={18} /> Session
            </h2>
            <p className="text-sm text-gray-500 mt-2">Safely log out of your owner account on this device.</p>
          </div>
          <div className="relative" ref={logoutRef}>
            {!showLogoutConfirm ? (
              <button 
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600 font-semibold rounded-xl transition-all shadow-sm"
              >
                <LogOut size={16} /> Logout from account
              </button>
            ) : (
              <div className="p-4 bg-white border border-red-100 shadow-xl shadow-red-100/50 rounded-xl max-w-sm flex flex-col gap-3 animate-fade-in z-10 relative">
                <div className="flex items-center gap-2 text-red-700 font-bold mb-1">
                   <AlertCircle size={16} />
                   <p className="text-sm">Are you sure you want to log out?</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={handleLogout}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    Yes, Logout
                  </button>
                  <button 
                     type="button"
                     onClick={() => setShowLogoutConfirm(false)}
                     className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default OwnerSettings;

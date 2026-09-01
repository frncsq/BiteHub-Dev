import axios from 'axios';
import { createApiClient, getApiBaseUrl } from './apiClient';

const api = createApiClient();

/** Resolve banner image URL (uploads path or external URL). */
export function resolveAdImageUrl(image) {
  if (!image) return null;
  if (image.startsWith('http') || image.startsWith('data:')) return image;
  const base = getApiBaseUrl();
  const path = image.startsWith('/') ? image : `/${image}`;
  return base ? `${base}${path}` : path;
}

export const adsService = {
  /** Public: list ads (optional filters). */
  list(params = {}) {
    return api.get('/ads', { params });
  },

  /** Public: active ads for a placement slug. */
  getByPlacement(position) {
    return api.get(`/ads/active/${position}`);
  },

  getById(id) {
    return api.get(`/ads/${id}`);
  },

  trackClick(id) {
    return api.post(`/ads/${id}/click`);
  },

  trackImpression(id) {
    return api.post(`/ads/${id}/impression`);
  },

  /** Admin analytics summary. */
  getAnalytics() {
    return api.get('/ads/analytics');
  },

  /** Admin: create with optional image file. */
  create(formData) {
    return api.post('/ads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update(id, formData) {
    return api.put(`/ads/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  remove(id) {
    return api.delete(`/ads/${id}`);
  },

  setStatus(id, status) {
    return api.patch(`/ads/${id}/status`, { status });
  },
};

/** Build FormData for create/update from plain object + optional File. */
export function buildAdFormData(values, imageFile) {
  const fd = new FormData();
  Object.entries(values).forEach(([key, val]) => {
    if (val === undefined || val === null) return;
    if (key === 'metadata' && typeof val === 'object') {
      fd.append(key, JSON.stringify(val));
    } else {
      fd.append(key, val);
    }
  });
  if (imageFile) fd.append('image', imageFile);
  return fd;
}

export const AD_PLACEMENTS = [
  { value: 'homepage_top', label: 'Homepage — Top Banner' },
  { value: 'homepage_sidebar', label: 'Homepage — Sidebar' },
  { value: 'menu_between', label: 'Between Menu Items' },
  { value: 'footer', label: 'Footer' },
  { value: 'dashboard_promo', label: 'Dashboard Promotion' },
  { value: 'restaurant_featured', label: 'Featured Restaurants' },
  { value: 'sponsored_card', label: 'Sponsored Card' },
];

export const AD_TYPES = [
  { value: 'banner', label: 'Banner' },
  { value: 'sponsored_meal', label: 'Sponsored Meal' },
  { value: 'sponsored_restaurant', label: 'Sponsored Restaurant' },
  { value: 'partner', label: 'Partner Business' },
  { value: 'adsense', label: 'Google AdSense Slot' },
];

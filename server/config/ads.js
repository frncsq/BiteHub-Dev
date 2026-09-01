/** Ad placement slugs used across the frontend and API. */
export const AD_PLACEMENTS = [
  'homepage_top',
  'homepage_sidebar',
  'menu_between',
  'footer',
  'dashboard_promo',
  'restaurant_featured',
  'sponsored_card',
];

/** Supported ad content types. */
export const AD_TYPES = [
  'banner',
  'sponsored_meal',
  'sponsored_restaurant',
  'partner',
  'adsense',
];

export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Base URL path served by Express static middleware. */
export const AD_UPLOAD_PUBLIC_PATH = '/uploads/ads';

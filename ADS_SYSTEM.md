# BiteHub Advertisement Management System

Full-stack ads for banners, sponsored content, and Google AdSense. **BiteHub uses PostgreSQL** (not MySQL) at runtime; MySQL DDL is provided as a reference in `server/migrations/ads-schema.mysql.sql`.

## Quick start

1. **Install server dependencies** (includes `multer` and `express-rate-limit`):

   ```bash
   cd server
   npm install
   ```

2. **Start API** — tables `ads` and `ad_clicks` are created automatically on boot.

3. **Start client**:

   ```bash
   cd client
   npm run dev
   ```

4. **Admin**: log in at `/admin-login`, open **Advertisements** (`/admin/ads`).

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/ads` | Public | List ads (`?position=`, `?active=true`) |
| GET | `/api/ads/active/:position` | Public | Active ads for placement |
| GET | `/api/ads/:id` | Public | Single ad |
| GET | `/api/ads/analytics` | Admin JWT | Dashboard analytics |
| POST | `/api/ads` | Admin JWT | Create ad (multipart `image`) |
| PUT | `/api/ads/:id` | Admin JWT | Update ad |
| PATCH | `/api/ads/:id/status` | Admin JWT | Activate/deactivate |
| DELETE | `/api/ads/:id` | Admin JWT | Delete ad |
| POST | `/api/ads/:id/click` | Public (rate limited) | Track click, returns `redirectUrl` |
| POST | `/api/ads/:id/impression` | Public (rate limited) | Increment impressions |

Uploaded images are served from `/uploads/ads/…` (proxied in Vite dev).

## Placements

| Slug | Used in |
|------|---------|
| `homepage_top` | `AdCarousel` on home dashboard |
| `homepage_sidebar` | `SidebarAd` on home |
| `sponsored_card` | `SponsoredCard` on home |
| `menu_between` | `AdBanner` on restaurant menu |
| `footer` | Use `AdBanner placement="footer"` where needed |
| `dashboard_promo` | Owner/admin promo slots |
| `restaurant_featured` | Featured restaurant campaigns |

## Google AdSense

1. Add script to `client/index.html` (from Google).
2. Set in `client/.env`:

   ```
   VITE_ADSENSE_CLIENT=ca-pub-xxxxxxxx
   VITE_ADSENSE_SLOT_HOMEPAGE_TOP=1234567890
   ```

3. Create an ad with type **Google AdSense Slot** and optional slot ID in metadata.

`AdSenseSlot` renders a placeholder until env vars are set.

## Frontend components

```
client/src/components/ads/
  AdBanner.jsx      — single banner
  AdCarousel.jsx    — rotating banners
  SidebarAd.jsx     — sidebar stack
  SponsoredCard.jsx — meal/restaurant/partner cards
  AdAnalytics.jsx   — admin charts
  AdSenseSlot.jsx   — AdSense placeholder
```

Hooks: `useAds(placement)`, `useAdAnalytics()`  
Service: `client/src/services/adsService.js`

## Security

- Admin CRUD requires JWT (`Authorization: Bearer`) or admin session
- Image upload: jpg/jpeg/png/webp only, 5 MB max
- Rate limits on click/impression tracking and admin writes
- CORS configured in `server/index.js`

## Folder structure

```
server/
  config/ads.js
  controllers/adsController.js
  middleware/isAdmin.js, uploadAds.js, rateLimit.js
  routes/ads.js
  uploads/ads/
  migrations/ads-schema.postgresql.sql
  migrations/ads-schema.mysql.sql

client/src/
  components/ads/
  pages/admin/ads.jsx
  services/adsService.js
  hooks/useAds.js, useAdAnalytics.js
```

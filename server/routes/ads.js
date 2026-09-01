import express from 'express';
import {
  listAds,
  getAdById,
  getActiveByPlacement,
  createAd,
  updateAd,
  deleteAd,
  toggleAdStatus,
  trackClick,
  trackImpression,
  getAnalytics,
} from '../controllers/adsController.js';
import { isAdmin } from '../middleware/isAdmin.js';
import { uploadAdImage } from '../middleware/uploadAds.js';
import { adTrackingLimiter, adminWriteLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Multer error handler wrapper
const handleUpload = (req, res, next) => {
  uploadAdImage.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// ——— Public read ———
router.get('/', listAds);
router.get('/analytics', isAdmin, getAnalytics);
router.get('/active/:position', getActiveByPlacement);
router.get('/:id', getAdById);

// ——— Tracking ———
router.post('/:id/click', adTrackingLimiter, trackClick);
router.post('/:id/impression', adTrackingLimiter, trackImpression);

// ——— Admin CRUD (JWT protected) ———
router.post('/', adminWriteLimiter, isAdmin, handleUpload, createAd);
router.put('/:id', adminWriteLimiter, isAdmin, handleUpload, updateAd);
router.patch('/:id/status', adminWriteLimiter, isAdmin, toggleAdStatus);
router.delete('/:id', adminWriteLimiter, isAdmin, deleteAd);

export default router;

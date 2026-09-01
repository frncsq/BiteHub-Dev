import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIMES,
  MAX_IMAGE_SIZE_BYTES,
} from '../config/ads.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ADS_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'ads');

if (!fs.existsSync(ADS_UPLOAD_DIR)) {
  fs.mkdirSync(ADS_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ADS_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext) || !ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Allowed: jpg, jpeg, png, webp'));
  }
  cb(null, true);
};

export const uploadAdImage = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter,
});

/** Remove a previously uploaded banner file when replacing or deleting an ad. */
export const deleteAdImageFile = (imagePath) => {
  if (!imagePath || imagePath.startsWith('http')) return;
  const filename = path.basename(imagePath);
  const fullPath = path.join(ADS_UPLOAD_DIR, filename);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

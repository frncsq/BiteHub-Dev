import rateLimit from 'express-rate-limit';

/** Limit ad click/impression tracking to reduce abuse. */
export const adTrackingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many ad tracking requests. Please try again later.' },
});

/** Stricter limit for admin write operations. */
export const adminWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many admin requests. Please slow down.' },
});

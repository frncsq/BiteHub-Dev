import jwt from 'jsonwebtoken';

/**
 * Protects admin-only routes. Accepts JWT Bearer token or express-session adminId.
 */
export const isAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-123');
      req.userId = decoded.id;
      req.user = decoded;
      if (req.session) {
        req.session.adminId = decoded.id;
        req.session.adminRole = decoded.role;
      }
      return next();
    } catch (err) {
      console.error('[ADMIN AUTH] Token invalid:', err.message);
    }
  }

  const adminId = req.session?.adminId;
  if (!adminId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access. Admin token or session required.',
    });
  }

  req.userId = adminId;
  next();
};

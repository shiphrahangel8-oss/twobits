import { verifyToken } from '../utils/cryptoAuth.js';
import { db } from '../services/supabaseService.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await db.getById('users', decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User session no longer valid.' });
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatar_url: user.avatar_url,
      preferences: user.preferences,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated request.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized for this operation. Allowed roles: ${allowedRoles.join(', ')}.`,
      });
    }
    return next();
  };
}

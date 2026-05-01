/**
 * Role middleware — enforces that req.user.role is in the list of allowed roles.
 * Must be mounted AFTER authMiddleware so req.user is populated.
 *
 * Usage:
 *   router.get('/admin', authMiddleware, requireRole('government'), handler)
 *   router.post('/x',    authMiddleware, requireRole('school'), handler)
 *   router.get('/y',     authMiddleware, requireRole('school', 'government'), handler)
 */

const { errorResponse } = require('../utils/responses');

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required', 'AUTH_REQUIRED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
        'INSUFFICIENT_ROLE'
      );
    }

    return next();
  };
}

module.exports = requireRole;

/**
 * Auth middleware — verifies the Firebase ID token from the Authorization header,
 * loads the user's Firestore profile, and attaches it to req.user for downstream handlers.
 */

const { auth, db } = require('../config/firebase-admin');
const { COLLECTIONS } = require('../utils/constants');
const { errorResponse } = require('../utils/responses');

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || req.headers.Authorization;

    if (!header) {
      return errorResponse(res, 401, 'No authentication token provided', 'NO_TOKEN');
    }

    if (!header.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Invalid token format. Expected "Bearer <token>"', 'INVALID_TOKEN_FORMAT');
    }

    const token = header.split('Bearer ')[1];

    if (!token || !token.trim()) {
      return errorResponse(res, 401, 'Token is empty', 'EMPTY_TOKEN');
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      switch (error.code) {
        case 'auth/id-token-expired':
          return errorResponse(res, 401, 'Token has expired. Please login again.', 'TOKEN_EXPIRED');
        case 'auth/id-token-revoked':
          return errorResponse(res, 401, 'Token has been revoked. Please login again.', 'TOKEN_REVOKED');
        case 'auth/argument-error':
          return errorResponse(res, 401, 'Invalid token format.', 'INVALID_TOKEN');
        default:
          return errorResponse(res, 401, 'Authentication failed.', 'AUTH_FAILED');
      }
    }

    const userDoc = await db.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return errorResponse(res, 401, 'User profile not found. Please register first.', 'PROFILE_NOT_FOUND');
    }

    const userData = userDoc.data();

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: userData.name,
      role: userData.role,
      schoolId: userData.schoolId || null,
      district: userData.district || null
    };

    return next();
  } catch (error) {
    console.error('[authMiddleware] Unexpected error:', error);
    return errorResponse(res, 500, 'Internal authentication error', 'AUTH_INTERNAL_ERROR');
  }
}

module.exports = authMiddleware;

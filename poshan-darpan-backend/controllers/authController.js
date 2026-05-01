/**
 * Auth controller — register, login, logout, getMe, forgotPassword, updateProfile.
 */

const { admin, auth, db } = require('../config/firebase-admin');
const {
  clientAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} = require('../config/firebase-client');
const { COLLECTIONS, ROLES } = require('../utils/constants');
const { successResponse, errorResponse } = require('../utils/responses');
const { checkValidation, formatFirestoreTimestamp } = require('../utils/helpers');

async function register(req, res) {
  const validation = checkValidation(req);
  if (!validation.isValid) {
    return errorResponse(res, 400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const { name, email, password, role, schoolId, district } = req.body;

  let createdUser = null;

  try {
    if (role === ROLES.SCHOOL) {
      const schoolDoc = await db.collection(COLLECTIONS.SCHOOLS).doc(schoolId).get();
      if (!schoolDoc.exists) {
        return errorResponse(res, 404, 'Selected school not found', 'SCHOOL_NOT_FOUND');
      }
    }

    try {
      createdUser = await auth.createUser({
        email,
        password,
        displayName: name
      });
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-exists':
          return errorResponse(res, 409, 'Email already registered', 'EMAIL_EXISTS');
        case 'auth/invalid-email':
          return errorResponse(res, 400, 'Invalid email address', 'INVALID_EMAIL');
        case 'auth/weak-password':
        case 'auth/invalid-password':
          return errorResponse(res, 400, 'Password is too weak', 'WEAK_PASSWORD');
        default:
          console.error('[register] createUser error:', error);
          return errorResponse(res, 500, 'Failed to create user account', 'CREATE_USER_FAILED');
      }
    }

    try {
      await db.collection(COLLECTIONS.USERS).doc(createdUser.uid).set({
        name,
        email,
        role,
        schoolId: role === ROLES.SCHOOL ? schoolId : null,
        district: role === ROLES.GOVERNMENT ? district : null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('[register] Firestore profile write failed, rolling back auth user:', error);
      try {
        await auth.deleteUser(createdUser.uid);
      } catch (cleanupError) {
        console.error('[register] Cleanup deleteUser failed:', cleanupError);
      }
      return errorResponse(res, 500, 'Registration failed. Please try again.', 'PROFILE_WRITE_FAILED');
    }

    let idToken = null;
    try {
      const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
      idToken = await userCredential.user.getIdToken();
    } catch (error) {
      console.error('[register] Auto-login after registration failed:', error);
    }

    const userData = {
      uid: createdUser.uid,
      name,
      email,
      role,
      schoolId: role === ROLES.SCHOOL ? schoolId : null,
      district: role === ROLES.GOVERNMENT ? district : null,
      token: idToken
    };

    return successResponse(res, 201, 'User registered successfully', userData);
  } catch (error) {
    console.error('[register] Unexpected error:', error);
    if (createdUser && createdUser.uid) {
      try {
        await auth.deleteUser(createdUser.uid);
      } catch (cleanupError) {
        console.error('[register] Cleanup deleteUser failed:', cleanupError);
      }
    }
    return errorResponse(res, 500, 'Registration failed. Please try again.', 'REGISTRATION_FAILED');
  }
}

async function login(req, res) {
  const validation = checkValidation(req);
  if (!validation.isValid) {
    return errorResponse(res, 400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const { email, password } = req.body;

  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
  } catch (error) {
    switch (error.code) {
      case 'auth/user-not-found':
        return errorResponse(res, 401, 'No account found with this email', 'USER_NOT_FOUND');
      case 'auth/wrong-password':
        return errorResponse(res, 401, 'Invalid password', 'WRONG_PASSWORD');
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
        return errorResponse(res, 401, 'Invalid email or password', 'INVALID_CREDENTIALS');
      case 'auth/user-disabled':
        return errorResponse(res, 403, 'This account has been disabled', 'USER_DISABLED');
      case 'auth/too-many-requests':
        return errorResponse(res, 429, 'Too many login attempts. Please try again later.', 'TOO_MANY_REQUESTS');
      case 'auth/invalid-email':
        return errorResponse(res, 400, 'Invalid email format', 'INVALID_EMAIL');
      default:
        console.error('[login] signIn error:', error);
        return errorResponse(res, 500, 'Login failed', 'LOGIN_FAILED');
    }
  }

  try {
    const idToken = await userCredential.user.getIdToken();
    const uid = userCredential.user.uid;

    const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
    if (!userDoc.exists) {
      return errorResponse(res, 404, 'User profile not found. Please contact support.', 'PROFILE_NOT_FOUND');
    }

    const userData = userDoc.data();

    await db.collection(COLLECTIONS.USERS).doc(uid).update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });

    let schoolData = null;
    if (userData.role === ROLES.SCHOOL && userData.schoolId) {
      const schoolDoc = await db.collection(COLLECTIONS.SCHOOLS).doc(userData.schoolId).get();
      if (schoolDoc.exists) {
        schoolData = { id: schoolDoc.id, ...schoolDoc.data() };
      }
    }

    return successResponse(res, 200, 'Login successful', {
      uid,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      schoolId: userData.schoolId || null,
      district: userData.district || null,
      school: schoolData,
      token: idToken
    });
  } catch (error) {
    console.error('[login] post-signIn error:', error);
    return errorResponse(res, 500, 'Login failed', 'LOGIN_FAILED');
  }
}

async function logout(req, res) {
  try {
    await auth.revokeRefreshTokens(req.user.uid);
    return successResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    console.error('[logout] revokeRefreshTokens error:', error);
    return errorResponse(res, 500, 'Logout failed', 'LOGOUT_FAILED');
  }
}

async function getMe(req, res) {
  try {
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(req.user.uid).get();

    if (!userDoc.exists) {
      return errorResponse(res, 404, 'User profile not found', 'PROFILE_NOT_FOUND');
    }

    const userData = userDoc.data();

    let schoolData = null;
    if (userData.role === ROLES.SCHOOL && userData.schoolId) {
      const schoolDoc = await db.collection(COLLECTIONS.SCHOOLS).doc(userData.schoolId).get();
      if (schoolDoc.exists) {
        schoolData = { id: schoolDoc.id, ...schoolDoc.data() };
      }
    }

    return successResponse(res, 200, 'Profile fetched', {
      uid: req.user.uid,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      schoolId: userData.schoolId || null,
      district: userData.district || null,
      school: schoolData,
      createdAt: formatFirestoreTimestamp(userData.createdAt),
      lastLogin: formatFirestoreTimestamp(userData.lastLogin)
    });
  } catch (error) {
    console.error('[getMe] error:', error);
    return errorResponse(res, 500, 'Failed to fetch profile', 'FETCH_PROFILE_FAILED');
  }
}

async function forgotPassword(req, res) {
  const validation = checkValidation(req);
  if (!validation.isValid) {
    return errorResponse(res, 400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const { email } = req.body;

  try {
    await sendPasswordResetEmail(clientAuth, email);
  } catch (error) {
    console.error('[forgotPassword] sendPasswordResetEmail error (suppressed):', error.code || error.message);
  }

  return successResponse(
    res,
    200,
    'Password reset email sent. Please check your inbox.'
  );
}

async function updateProfile(req, res) {
  const validation = checkValidation(req);
  if (!validation.isValid) {
    return errorResponse(res, 400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const updates = {};

  if (req.body.name !== undefined && req.body.name !== null) {
    const trimmed = String(req.body.name).trim();
    if (trimmed.length > 0) updates.name = trimmed;
  }

  if (
    req.body.district !== undefined &&
    req.body.district !== null &&
    req.user.role === ROLES.GOVERNMENT
  ) {
    const trimmed = String(req.body.district).trim();
    if (trimmed.length > 0) updates.district = trimmed;
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse(res, 400, 'No valid fields to update', 'NO_UPDATES');
  }

  try {
    await db.collection(COLLECTIONS.USERS).doc(req.user.uid).update(updates);

    if (updates.name) {
      try {
        await auth.updateUser(req.user.uid, { displayName: updates.name });
      } catch (authUpdateError) {
        console.error('[updateProfile] auth.updateUser displayName failed:', authUpdateError);
      }
    }

    const userDoc = await db.collection(COLLECTIONS.USERS).doc(req.user.uid).get();
    const userData = userDoc.data();

    return successResponse(res, 200, 'Profile updated successfully', {
      uid: req.user.uid,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      schoolId: userData.schoolId || null,
      district: userData.district || null,
      createdAt: formatFirestoreTimestamp(userData.createdAt),
      lastLogin: formatFirestoreTimestamp(userData.lastLogin)
    });
  } catch (error) {
    console.error('[updateProfile] error:', error);
    return errorResponse(res, 500, 'Failed to update profile', 'UPDATE_PROFILE_FAILED');
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  updateProfile
};

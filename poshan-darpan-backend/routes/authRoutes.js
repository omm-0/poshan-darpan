/**
 * /api/auth routes.
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateProfileUpdate
} = require('../utils/validators');

router.post('/register', validateRegister, authController.register);

router.post('/login', validateLogin, authController.login);

router.post('/logout', authMiddleware, authController.logout);

router.get('/me', authMiddleware, authController.getMe);

router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);

router.put('/profile', authMiddleware, validateProfileUpdate, authController.updateProfile);

module.exports = router;

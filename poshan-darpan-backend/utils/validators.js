/**
 * Express-validator chains for request validation.
 */

const { body, param, query } = require('express-validator');

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['school', 'government']).withMessage('Role must be "school" or "government"'),

  body('schoolId')
    .if(body('role').equals('school'))
    .notEmpty().withMessage('School selection is required for school administrators'),

  body('district')
    .if(body('role').equals('government'))
    .trim()
    .notEmpty().withMessage('District is required for government officials')
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
];

const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
];

const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

  body('district')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('District must be 2-100 characters')
];

const validateAddStock = [
  body('item')
    .notEmpty().withMessage('Item is required')
    .isIn(['rice', 'wheat', 'dal']).withMessage('Item must be rice, wheat, or dal'),

  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isFloat({ min: 0.1 }).withMessage('Quantity must be a positive number (minimum 0.1 kg)')
];

const validateAttendance = [
  body('date')
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
    .custom((value) => {
      const inputDate = new Date(value + 'T00:00:00+05:30');
      if (isNaN(inputDate.getTime())) {
        throw new Error('Invalid date');
      }
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (inputDate > today) {
        throw new Error('Cannot submit attendance for a future date');
      }
      return true;
    }),

  body('studentsPresent')
    .notEmpty().withMessage('Number of students is required')
    .isInt({ min: 1 }).withMessage('Students present must be at least 1')
];

const validateCreateSchool = [
  body('name')
    .trim()
    .notEmpty().withMessage('School name is required')
    .isLength({ min: 5, max: 200 }).withMessage('School name must be 5-200 characters'),

  body('enrollment')
    .notEmpty().withMessage('Enrollment count is required')
    .isInt({ min: 1, max: 5000 }).withMessage('Enrollment must be between 1 and 5000'),

  body('district')
    .trim()
    .notEmpty().withMessage('District is required')
    .isLength({ min: 2, max: 100 }).withMessage('District must be 2-100 characters'),

  body('contactPerson')
    .trim()
    .notEmpty().withMessage('Contact person name is required'),

  body('contactEmail')
    .trim()
    .notEmpty().withMessage('Contact email is required')
    .isEmail().withMessage('Invalid email format')
];

const validateDateParam = [
  param('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
];

const validateDaysParam = [
  param('days')
    .isInt().withMessage('days must be an integer')
    .custom((v) => {
      const n = parseInt(v, 10);
      if (![7, 30, 90].includes(n)) {
        throw new Error('days must be 7, 30, or 90');
      }
      return true;
    })
];

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateProfileUpdate,
  validateAddStock,
  validateAttendance,
  validateCreateSchool,
  validateDateParam,
  validateDaysParam
};

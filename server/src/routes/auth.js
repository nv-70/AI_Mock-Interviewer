const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const sanitizeInput = require('../middleware/sanitize');
const { register, login, getProfile } = require('../controllers/authController');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('education.degree')
    .notEmpty().withMessage('Education degree is required')
    .isIn(['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'B.E', 'M.E', 'B.Com', 'M.Com', 'MBA', 'Other'])
    .withMessage('Invalid education degree'),
  body('experienceLevel')
    .isIn(['fresher', 'experienced']).withMessage('Experience level must be fresher or experienced'),
  body('experienceYears')
    .optional()
    .isInt({ min: 0 }).withMessage('Experience years must be a non-negative integer'),
  body('domains')
    .optional()
    .isArray().withMessage('Domains must be an array'),
  body('preferredRoles')
    .optional()
    .isArray().withMessage('Preferred roles must be an array')
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

router.post('/register', sanitizeInput, registerValidation, register);
router.post('/login', sanitizeInput, loginValidation, login);
router.get('/profile', authenticate, getProfile);

module.exports = router;


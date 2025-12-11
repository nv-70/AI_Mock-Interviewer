const express = require('express');
const { query } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const sanitizeInput = require('../middleware/sanitize');
const { getSessions, getStats } = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

const getSessionsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'active', 'completed']).withMessage('Invalid status'),
  query('studentId')
    .optional()
    .isMongoId().withMessage('Invalid student ID'),
  query('roleProfileId')
    .optional()
    .isMongoId().withMessage('Invalid role profile ID')
];

router.get('/sessions', sanitizeInput, getSessionsValidation, getSessions);
router.get('/stats', getStats);

module.exports = router;


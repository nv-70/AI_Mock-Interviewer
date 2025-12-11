const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const sanitizeInput = require('../middleware/sanitize');
const { getRoles, createRole } = require('../controllers/roleController');

const router = express.Router();

const createRoleValidation = [
  body('roleName')
    .trim()
    .notEmpty().withMessage('Role name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Role name must be between 2 and 100 characters'),
  body('domainTags')
    .optional()
    .isArray().withMessage('Domain tags must be an array'),
  body('skillExpectations')
    .optional()
    .isArray().withMessage('Skill expectations must be an array'),
  body('interviewStructures')
    .optional()
    .isObject().withMessage('Interview structures must be an object')
];

router.get('/', getRoles);
router.post(
  '/',
  authenticate,
  authorize('admin'),
  sanitizeInput,
  createRoleValidation,
  createRole
);

module.exports = router;


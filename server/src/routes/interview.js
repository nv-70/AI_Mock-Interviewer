const express = require('express');
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const sanitizeInput = require('../middleware/sanitize');
const {
  startInterview,
  getNextQuestion,
  submitAnswer,
  completeInterview,
  getUserSessions,
  downloadSessionReport
} = require('../controllers/interviewController');

const router = express.Router();

const startInterviewValidation = [
  body('mode')
    .isIn(['resume', 'role', 'mixed']).withMessage('Mode must be: resume, role, or mixed'),
  body('roleProfileId')
    .notEmpty().withMessage('Role profile ID is required')
    .isMongoId().withMessage('Invalid role profile ID'),
  body('resumeId')
    .optional()
    .isMongoId().withMessage('Invalid resume ID')
];

const submitAnswerValidation = [
  param('sessionId')
    .isMongoId().withMessage('Invalid session ID'),
  body('questionId')
    .notEmpty().withMessage('Question ID is required'),
  body('answerText')
    .trim()
    .notEmpty().withMessage('Answer text is required')
    .isLength({ min: 10 }).withMessage('Answer must be at least 10 characters'),
  body('timeSpentSeconds')
    .optional()
    .isNumeric().withMessage('Time spent must be a number')
    .isInt({ min: 0 }).withMessage('Time spent must be a positive integer')
];

router.post(
  '/start',
  authenticate,
  sanitizeInput,
  startInterviewValidation,
  startInterview
);

router.get(
  '/sessions',
  authenticate,
  sanitizeInput,
  getUserSessions
);

router.get(
  '/:sessionId/next',
  authenticate,
  sanitizeInput,
  param('sessionId').isMongoId().withMessage('Invalid session ID'),
  getNextQuestion
);

router.post(
  '/:sessionId/answer',
  authenticate,
  sanitizeInput,
  submitAnswerValidation,
  submitAnswer
);

router.post(
  '/:sessionId/complete',
  authenticate,
  sanitizeInput,
  param('sessionId').isMongoId().withMessage('Invalid session ID'),
  body('forceComplete')
    .optional()
    .isBoolean().withMessage('forceComplete must be a boolean'),
  completeInterview
);

router.get(
  '/:sessionId/summary',
  authenticate,
  sanitizeInput,
  param('sessionId').isMongoId().withMessage('Invalid session ID'),
  completeInterview
);

router.get(
  '/:sessionId/report',
  authenticate,
  sanitizeInput,
  param('sessionId').isMongoId().withMessage('Invalid session ID'),
  downloadSessionReport
);

module.exports = router;


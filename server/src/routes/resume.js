const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const sanitizeInput = require('../middleware/sanitize');
const { uploadResume, getResumeInsights } = require('../controllers/resumeController');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = process.env.UPLOADS_DIR || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}_${sanitizedName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'text/plain'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and text files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

router.post(
  '/upload',
  authenticate,
  sanitizeInput,
  upload.single('file'),
  (req, res, next) => {
    // Validation middleware
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a PDF or text file.'
      });
    }

    // Additional validation
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!['.pdf', '.txt'].includes(ext)) {
      // Clean up file
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PDF and text files are allowed.'
      });
    }

    next();
  },
  uploadResume
);

router.get(
  '/insights',
  authenticate,
  sanitizeInput,
  getResumeInsights
);

module.exports = router;


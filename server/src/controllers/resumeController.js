const { validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
const Resume = require('../models/Resume');
const { parseResume } = require('../utils/resumeParser');

const uploadResume = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user._id;
    const file = req.file;
    let extractedText = '';

    // Extract text from PDF
    if (file.mimetype === 'application/pdf') {
      try {
        const dataBuffer = await fs.readFile(file.path);
        const pdfData = await pdf(dataBuffer);
        extractedText = pdfData.text;
      } catch (error) {
        console.error('Error parsing PDF:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to extract text from PDF'
        });
      }
    } else if (file.mimetype === 'text/plain') {
      // Read text file
      try {
        extractedText = await fs.readFile(file.path, 'utf-8');
      } catch (error) {
        console.error('Error reading text file:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to read text file'
        });
      }
    }

    // Parse resume using local parser
    const parsed = parseResume(extractedText);

    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExt}`;
    const uploadsDir = process.env.UPLOADS_DIR || './uploads';
    const newPath = path.join(uploadsDir, uniqueFilename);

    // Move file to final location
    await fs.rename(file.path, newPath);

    // Save resume to database
    const resume = new Resume({
      userId,
      filename: uniqueFilename,
      path: newPath,
      extractedText,
      parsed
    });

    await resume.save();

    // Update user's resumeId
    const User = require('../models/User');
    await User.findByIdAndUpdate(userId, { resumeId: resume._id });

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      data: {
        resumeId: resume._id,
        parsed
      }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    next(error);
  }
};

const getResumeInsights = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const resume = await Resume.findOne({ userId }).sort({ createdAt: -1 });

    if (!resume) {
      return res.json({
        success: true,
        data: null,
        message: 'No resume uploaded yet'
      });
    }

    res.json({
      success: true,
      data: {
        resumeId: resume._id,
        updatedAt: resume.updatedAt,
        parsed: resume.parsed
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  getResumeInsights
};


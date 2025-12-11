const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    default: ''
  },
  parsed: {
    summary: { type: String, default: '' },
    contact: {
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' }
    },
    skills: { type: [String], default: [] },
    categorizedSkills: {
      type: [
        {
          name: String,
          matchedSkills: [String],
          score: Number
        }
      ],
      default: []
    },
    education: { type: [String], default: [] },
    projects: { type: [String], default: [] },
    experience: {
      entries: { type: [String], default: [] },
      totalYears: { type: Number, default: 0 }
    },
    achievements: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    targetFields: {
      type: [
        {
          field: String,
          score: Number,
          matchedSkills: [String]
        }
      ],
      default: []
    },
    atsScore: {
      overall: { type: Number, default: 0 },
      breakdown: {
        sections: { type: Number, default: 0 },
        skills: { type: Number, default: 0 },
        keywords: { type: Number, default: 0 },
        experience: { type: Number, default: 0 },
        achievements: { type: Number, default: 0 }
      },
      strengths: { type: [String], default: [] },
      improvements: { type: [String], default: [] }
    }
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
resumeSchema.index({ userId: 1 });
resumeSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);


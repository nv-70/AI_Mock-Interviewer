const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  roundType: {
    type: String,
    enum: ['technical', 'hr', 'manager', 'cto', 'case'],
    required: true
  },
  questions: [{
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    expectedKeywords: {
      type: [String],
      default: []
    },
    difficulty: {
      type: String,
      enum: [
        '2-month-summer-intern',
        '6-month-intern',
        'full-time-fresher',
        'experience-1-year',
        'experience-2-years',
        'experience-3-years',
        'experience-4-years',
        'experience-5-plus-years'
      ],
      default: 'full-time-fresher'
    },
    timeMinutes: {
      type: Number,
      default: 5
    }
  }],
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    answerText: {
      type: String,
      required: true
    },
    startedAt: {
      type: Date
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    timeSpentSeconds: {
      type: Number,
      min: 0
    },
    evaluation: {
      score: {
        type: Number,
        min: 0,
        max: 10
      },
      feedbackText: {
        type: String,
        default: ''
      },
      strengths: {
        type: [String],
        default: []
      },
      weaknesses: {
        type: [String],
        default: []
      },
      improvementTips: {
        type: [String],
        default: []
      }
    }
  }],
  completed: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const interviewSessionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  roleProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoleProfile',
    required: true
  },
  mode: {
    type: String,
    enum: ['resume', 'role', 'mixed'],
    required: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  currentRoundIndex: {
    type: Number,
    default: 0,
    min: 0
  },
  rounds: {
    type: [roundSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  },
  proctored: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
interviewSessionSchema.index({ studentId: 1, createdAt: -1 });
interviewSessionSchema.index({ status: 1 });
interviewSessionSchema.index({ roleProfileId: 1 });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);


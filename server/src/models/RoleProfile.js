const mongoose = require('mongoose');

const roleProfileSchema = new mongoose.Schema({
  roleName: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true
  },
  domainTags: {
    type: [String],
    default: []
  },
  skillExpectations: {
    type: [String],
    default: []
  },
  interviewStructures: {
    technical: {
      questionCount: {
        type: Number,
        default: 5,
        min: 1,
        max: 20
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
      }
    },
    hr: {
      questionCount: {
        type: Number,
        default: 5,
        min: 1,
        max: 15
      }
    },
    manager: {
      questionCount: {
        type: Number,
        default: 4,
        min: 1,
        max: 15
      }
    },
    cto: {
      questionCount: {
        type: Number,
        default: 3,
        min: 1,
        max: 10
      }
    },
    case: {
      questionCount: {
        type: Number,
        default: 3,
        min: 1,
        max: 10
      }
    }
  }
}, {
  timestamps: true
});

// Indexes
roleProfileSchema.index({ roleName: 1 });
roleProfileSchema.index({ domainTags: 1 });

module.exports = mongoose.model('RoleProfile', roleProfileSchema);


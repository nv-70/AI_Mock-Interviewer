const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'interviewer'],
    default: 'student'
  },
  education: {
    degree: {
      type: String,
      enum: ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'B.E', 'M.E', 'B.Com', 'M.Com', 'MBA', 'Other'],
      required: true
    },
    college: {
      type: String,
      trim: true,
      maxlength: [200, 'College name cannot exceed 200 characters']
    },
    passingYear: {
      type: Number,
      min: [1950, 'Invalid passing year'],
      max: [new Date().getFullYear() + 5, 'Invalid passing year']
    }
  },
  experienceLevel: {
    type: String,
    enum: ['fresher', 'experienced'],
    required: true
  },
  experienceYears: {
    type: Number,
    min: [0, 'Experience years cannot be negative'],
    default: 0
  },
  domains: {
    type: [String],
    default: []
  },
  preferredRoles: {
    type: [String],
    default: []
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Remove passwordHash from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);


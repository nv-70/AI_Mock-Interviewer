require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI', 'GEMINI_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName] || process.env[varName].trim() === '');

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease check your .env file in the server folder.');
  if (missingVars.includes('GEMINI_API_KEY')) {
    console.error('\n⚠️  GEMINI_API_KEY is required for interview question generation.');
    console.error('   Get your API key from: https://makersuite.google.com/app/apikey');
  }
  process.exit(1);
}

// Validate JWT_SECRET is not empty
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
  console.error('❌ JWT_SECRET is empty or not set in .env file');
  console.error('Please set JWT_SECRET in server/.env file');
  process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resume');
const roleRoutes = require('./routes/roles');
const interviewRoutes = require('./routes/interview');
const adminRoutes = require('./routes/admin');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // stricter limit for auth endpoints
  message: 'Too many authentication attempts, please try again later.'
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mock_interviewer', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock Interviewer API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ JWT_SECRET is configured: ${process.env.JWT_SECRET ? 'Yes' : 'No'}`);
  if (process.env.JWT_SECRET) {
    console.log(`   Secret length: ${process.env.JWT_SECRET.length} characters`);
  }
  console.log(`✅ GEMINI_API_KEY is configured: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
  if (process.env.GEMINI_API_KEY) {
    const keyPreview = process.env.GEMINI_API_KEY.substring(0, 10) + '...';
    console.log(`   Key preview: ${keyPreview}`);
  }
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  console.log(`✅ Using Gemini model: ${geminiModel} (default: gemini-2.5-flash)`);
});

module.exports = app;


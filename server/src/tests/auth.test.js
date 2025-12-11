/**
 * Basic test examples for authentication endpoints
 * Run with: npm test
 */

const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const mongoose = require('mongoose');

// Test user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'testpass123',
  education: {
    degree: 'B.Tech',
    college: 'Test University',
    passingYear: 2023
  },
  experienceLevel: 'fresher',
  experienceYears: 0,
  domains: ['JavaScript'],
  preferredRoles: ['Software Developer']
};

describe('Authentication API', () => {
  beforeAll(async () => {
    // Connect to test database
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mock_interviewer_test';
    await mongoose.connect(MONGO_URI);
  });

  afterAll(async () => {
    // Clean up
    await User.deleteMany({ email: testUser.email });
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.passwordHash).toBeUndefined(); // Should not be in response
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;

    beforeAll(async () => {
      // Get token by logging in
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      token = response.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});


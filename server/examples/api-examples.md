# API Usage Examples

Complete examples for testing the Mock Interviewer API.

## Prerequisites

1. Server running on `http://localhost:3000`
2. MongoDB running locally
3. Valid Gemini API key in `.env`

## Step-by-Step Flow

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "password": "securepass123",
    "education": {
      "degree": "B.Tech",
      "college": "Tech University",
      "passingYear": 2023
    },
    "experienceLevel": "fresher",
    "experienceYears": 0,
    "domains": ["MERN", "JavaScript"],
    "preferredRoles": ["MERN Stack Developer", "Web Frontend Developer"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "role": "student",
      "education": {
        "degree": "B.Tech",
        "college": "Tech University",
        "passingYear": 2023
      },
      "experienceLevel": "fresher",
      "experienceYears": 0,
      "domains": ["MERN", "JavaScript"],
      "preferredRoles": ["MERN Stack Developer", "Web Frontend Developer"]
    }
  }
}
```

**Save the token:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Login (Alternative)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "securepass123"
  }'
```

### 3. Get User Profile

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Upload Resume

Create a sample resume file first, or use an existing PDF:

```bash
# Upload PDF resume
curl -X POST http://localhost:3000/api/resume/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/resume.pdf"

# Or upload text file
curl -X POST http://localhost:3000/api/resume/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/resume.txt"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Resume uploaded and parsed successfully",
  "data": {
    "resumeId": "64a1b2c3d4e5f6g7h8i9j0k2",
    "parsed": {
      "skills": ["JavaScript", "React", "Node.js"],
      "projects": ["E-commerce Platform", "Task Management App"],
      "education": ["B.Tech in Computer Science"],
      "experienceYears": 0,
      "keywordsCount": 25
    }
  }
}
```

### 5. Get Available Roles

```bash
curl -X GET http://localhost:3000/api/roles
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
        "roleName": "MERN Stack Developer",
        "domainTags": ["MongoDB", "Express", "React", "Node.js"],
        "skillExpectations": ["JavaScript", "React", "Node.js"],
        "interviewStructures": {
          "technical": { "questionCount": 8, "difficulty": "mid" },
          "hr": { "questionCount": 5 },
          "manager": { "questionCount": 4 },
          "cto": { "questionCount": 3 },
          "case": { "questionCount": 2 }
        }
      },
      ...
    ],
    "count": 12
  }
}
```

**Save a roleProfileId:**
```bash
export ROLE_PROFILE_ID="64a1b2c3d4e5f6g7h8i9j0k3"
```

### 6. Start Interview Session

```bash
curl -X POST http://localhost:3000/api/interview/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "mixed",
    "roleProfileId": "'$ROLE_PROFILE_ID'"
  }'
```

**Note:** If you uploaded a resume, it will be automatically used. You can also specify `resumeId` explicitly.

**Expected Response:**
```json
{
  "success": true,
  "message": "Interview session started successfully",
  "data": {
    "sessionId": "64a1b2c3d4e5f6g7h8i9j0k4",
    "mode": "mixed",
    "roleProfile": {
      "id": "64a1b2c3d4e5f6g7h8i9j0k3",
      "name": "MERN Stack Developer"
    },
    "roundsMetadata": [
      {
        "roundIndex": 0,
        "roundType": "technical",
        "questionCount": 8,
        "completed": false
      },
      {
        "roundIndex": 1,
        "roundType": "hr",
        "questionCount": 5,
        "completed": false
      },
      {
        "roundIndex": 2,
        "roundType": "manager",
        "questionCount": 4,
        "completed": false
      },
      {
        "roundIndex": 3,
        "roundType": "cto",
        "questionCount": 3,
        "completed": false
      },
      {
        "roundIndex": 4,
        "roundType": "case",
        "questionCount": 2,
        "completed": false
      }
    ],
    "status": "active"
  }
}
```

**Save sessionId:**
```bash
export SESSION_ID="64a1b2c3d4e5f6g7h8i9j0k4"
```

### 7. Get Next Question

```bash
curl -X GET http://localhost:3000/api/interview/$SESSION_ID/next \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "roundType": "technical",
    "questionId": "q1",
    "questionText": "Explain the difference between let, const, and var in JavaScript. When would you use each?",
    "questionNumber": 1,
    "totalQuestions": 22,
    "difficulty": "mid",
    "timeMinutes": 5
  }
}
```

### 8. Submit Answer

```bash
curl -X POST http://localhost:3000/api/interview/$SESSION_ID/answer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "q1",
    "answerText": "let and const are block-scoped variables introduced in ES6, while var is function-scoped. let allows reassignment, const does not. var has hoisting behavior that can lead to bugs. I would use const for values that should not change, let for variables that need reassignment, and avoid var in modern JavaScript."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Answer submitted successfully",
  "data": {
    "evaluation": {
      "score": 8,
      "feedbackText": "Excellent explanation! You clearly understand the differences between let, const, and var. You mentioned block scoping, reassignment rules, and hoisting. Consider adding examples of when each is appropriate in real-world scenarios.",
      "strengths": [
        "Clear understanding of scoping differences",
        "Mentioned hoisting behavior",
        "Good practical advice"
      ],
      "weaknesses": [
        "Could provide more concrete examples",
        "Didn't mention temporal dead zone"
      ],
      "improvementTips": [
        "Study temporal dead zone concept",
        "Practice with real code examples",
        "Understand when to use each in different contexts"
      ]
    },
    "nextQuestionAvailable": true
  }
}
```

### 9. Continue with More Questions

Repeat steps 7 and 8 until all questions are answered.

### 10. Complete Interview

```bash
curl -X POST http://localhost:3000/api/interview/$SESSION_ID/complete \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Interview completed successfully",
  "data": {
    "sessionId": "64a1b2c3d4e5f6g7h8i9j0k4",
    "overallScore": 7.8,
    "totalQuestions": 22,
    "questionsAnswered": 22,
    "roundWisePerformance": [
      {
        "roundType": "technical",
        "questionsAnswered": 8,
        "totalQuestions": 8,
        "averageScore": 8.2
      },
      {
        "roundType": "hr",
        "questionsAnswered": 5,
        "totalQuestions": 5,
        "averageScore": 7.6
      },
      {
        "roundType": "manager",
        "questionsAnswered": 4,
        "totalQuestions": 4,
        "averageScore": 7.5
      },
      {
        "roundType": "cto",
        "questionsAnswered": 3,
        "totalQuestions": 3,
        "averageScore": 8.0
      },
      {
        "roundType": "case",
        "questionsAnswered": 2,
        "totalQuestions": 2,
        "averageScore": 7.0
      }
    ],
    "completedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Admin Endpoints

### Get All Sessions (Admin Only)

First, create an admin user manually in MongoDB or modify a user's role:

```bash
# In MongoDB shell
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Then:

```bash
curl -X GET "http://localhost:3000/api/admin/sessions?page=1&limit=10&status=completed" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Get Statistics

```bash
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Error Examples

### Invalid Token
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer invalid_token"
```

**Response:**
```json
{
  "success": false,
  "message": "Invalid token."
}
```

### Validation Error
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A",
    "email": "invalid-email",
    "password": "123"
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Name must be between 2 and 100 characters",
      "param": "name"
    },
    {
      "msg": "Please provide a valid email",
      "param": "email"
    },
    {
      "msg": "Password must be at least 6 characters",
      "param": "password"
    }
  ]
}
```

## Using Postman

1. Import the collection (see `postman-collection.json` if provided)
2. Set environment variables:
   - `base_url`: `http://localhost:3000`
   - `token`: (set after login/register)
   - `session_id`: (set after starting interview)
3. Run requests in sequence

## Notes

- All timestamps are in ISO 8601 format
- Token expires in 7 days (configurable via `JWT_EXPIRES_IN`)
- File uploads are limited to 5MB
- Rate limiting: 100 requests per 15 minutes (5 for auth endpoints)
- Questions are generated dynamically using Gemini API
- Answers are evaluated immediately upon submission


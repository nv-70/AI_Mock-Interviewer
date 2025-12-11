# Mock Interviewer Platform

A complete Mock Interview Practice Platform backend built with Node.js, Express, and MongoDB.

## 📁 Project Structure

```
mock-interviewer-backend/
├── server/              # Backend server code
│   ├── src/            # Source code
│   ├── scripts/        # Database seeding
│   ├── examples/       # API examples
│   ├── .env.example    # Environment variables template
│   └── README.md        # Detailed server documentation
└── README.md           # This file
```

## 🚀 Quick Start

1. **Navigate to server folder**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your values (see ENV_SETUP.md for details)
   ```

4. **Start MongoDB** (if using local):
   ```bash
   mongod
   ```

5. **Seed the database**:
   ```bash
   npm run seed
   ```

6. **Start the server**:
   ```bash
   npm run dev
   ```

## 📝 Environment Variables

You need to create a `.env` file in the `server` folder with these variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `JWT_EXPIRES_IN` | Token expiration (default: 7d) | No |
| `GEMINI_API_KEY` | Google Gemini API key | **Yes** |
| `UPLOADS_DIR` | Resume upload directory | No |

**See `server/ENV_SETUP.md` for detailed setup instructions.**

## 🔑 Getting Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file

## 📚 Documentation

- **Server Documentation**: See `server/README.md`
- **Environment Setup**: See `server/ENV_SETUP.md`
- **Quick Start Guide**: See `server/QUICKSTART.md`
- **API Examples**: See `server/examples/api-examples.md`

## 🛠️ Available Scripts

All scripts should be run from the `server` folder:

```bash
cd server

# Development (with auto-reload)
npm run dev

# Production
npm start

# Seed database
npm run seed

# Run tests
npm test
```

## 📡 API Endpoints

- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/profile`
- **Resume**: `/api/resume/upload`
- **Roles**: `/api/roles`
- **Interview**: `/api/interview/start`, `/api/interview/:id/next`, `/api/interview/:id/answer`, `/api/interview/:id/complete`
- **Admin**: `/api/admin/sessions`, `/api/admin/stats`

## 🧪 Testing

Import the Postman collection from `server/postman-collection.json` or use the cURL examples in `server/examples/api-examples.md`.

## 📦 Tech Stack

- Node.js + Express
- MongoDB (Mongoose)
- JWT Authentication
- Google Gemini API
- Multer (file uploads)
- pdf-parse (resume parsing)

## 🔒 Security Features

- JWT-based authentication
- Password hashing (bcrypt)
- Input sanitization
- Rate limiting
- Helmet security headers
- CORS configuration

## 📄 License

ISC

---

**For detailed setup and API documentation, see `server/README.md`**


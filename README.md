# Mock Interviewer Platform

A complete Mock Interview Practice Platform with **Next.js frontend** and **Node.js backend**.

## 📁 Project Structure

```
mock-interviewer/
├── server/              # Backend (Node.js + Express + MongoDB)
│   ├── src/            # Source code
│   ├── scripts/        # Database seeding
│   ├── examples/       # API examples
│   ├── .env.example    # Environment variables template
│   └── README.md        # Backend documentation
├── client/              # Frontend (Next.js 14 + TailwindCSS)
│   ├── app/            # Next.js pages
│   ├── components/     # UI components
│   ├── contexts/       # React contexts
│   ├── lib/            # API client
│   └── README.md        # Frontend documentation
└── README.md           # This file
```

## 🚀 Quick Start

### Backend Setup

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
   # Most important: Add your GEMINI_API_KEY
   ```

4. **Start MongoDB** (if using local):
   ```bash
   mongod
   ```

5. **Seed the database**:
   ```bash
   npm run seed
   ```

6. **Start the backend server**:
   ```bash
   npm run dev
   ```
   Backend runs on `http://localhost:3000`

### Frontend Setup

1. **Navigate to client folder** (in a new terminal):
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local - set NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   ```

4. **Start the frontend**:
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:3000` (or next available port)

5. **Open browser** and navigate to the frontend URL

## 🎯 Features

### Backend API
- JWT Authentication
- Resume upload and parsing
- Role-based interview profiles
- AI-powered question generation (Gemini API)
- Answer evaluation and feedback
- Multiple interview rounds (Technical, HR, Manager, CTO, Case)

### Frontend
- Modern, responsive UI with TailwindCSS
- User authentication and protected routes
- Resume upload interface
- Interactive interview session
- Real-time answer evaluation
- Performance summary and analytics

## 📡 API Endpoints

See `server/README.md` for complete API documentation.

Main endpoints:
- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/profile`
- **Resume**: `/api/resume/upload`
- **Roles**: `/api/roles`
- **Interview**: `/api/interview/start`, `/api/interview/:id/next`, `/api/interview/:id/answer`, `/api/interview/:id/complete`
- **Admin**: `/api/admin/sessions`, `/api/admin/stats`

## 🛠️ Available Scripts

### Backend (server folder)
```bash
cd server
npm run dev      # Development server
npm start        # Production server
npm run seed     # Seed database
npm test         # Run tests
```

### Frontend (client folder)
```bash
cd client
npm run dev      # Development server
npm run build    # Production build
npm start        # Production server
npm run lint     # Lint code
```

## 📚 Documentation

### Backend
- **Server Documentation**: See `server/README.md`
- **Environment Setup**: See `server/ENV_SETUP.md`
- **Quick Start Guide**: See `server/QUICKSTART.md`
- **API Examples**: See `server/examples/api-examples.md`

### Frontend
- **Frontend Documentation**: See `client/README.md`
- **Frontend Setup**: See `client/SETUP.md`

## 🧪 Testing

### Backend API Testing
- Import Postman collection: `server/postman-collection.json`
- Use cURL examples: `server/examples/api-examples.md`

### Frontend Testing
- Start both backend and frontend servers
- Register a new user through the UI
- Upload a resume
- Start an interview session
- Complete the interview flow

## 📦 Tech Stack

### Backend
- Node.js + Express
- MongoDB (Mongoose)
- JWT Authentication
- Google Gemini API
- Multer (file uploads)
- pdf-parse (resume parsing)

### Frontend
- Next.js 14 (App Router)
- React 18
- TailwindCSS
- Axios
- Context API (state management)

## 🔒 Security Features

- JWT-based authentication
- Password hashing (bcrypt)
- Input sanitization
- Rate limiting
- CORS configuration
- Protected routes

## 🎓 Getting Started Flow

1. **Setup Backend** → Follow `server/README.md`
2. **Setup Frontend** → Follow `client/README.md`
3. **Start Both Servers** → Backend on port 3000, Frontend on port 3000 (or auto-assigned)
4. **Register Account** → Use the frontend registration page
5. **Upload Resume** → Optional but recommended
6. **Start Interview** → Select role and begin practicing!

## 📝 Environment Variables

### Backend (server/.env)
- `PORT=3000`
- `MONGO_URI=your_mongo_uri_here`
- `JWT_SECRET=your_secret_key`
- `GEMINI_API_KEY=your_gemini_api_key` ⚠️ **Required**
- `UPLOADS_DIR=./uploads`

### Frontend (client/.env.local)
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000`

See `server/ENV_SETUP.md` for detailed setup instructions.

## 🐛 Troubleshooting

### Backend Issues
- Ensure MongoDB is running
- Check `.env` file has all required variables
- Verify Gemini API key is valid
- See `server/README.md` for more help

### Frontend Issues
- Ensure backend is running
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Clear browser cache and localStorage
- See `client/README.md` for more help

## 📄 License

ISC

---

**For detailed documentation:**
- Backend: See `server/README.md`
- Frontend: See `client/README.md`


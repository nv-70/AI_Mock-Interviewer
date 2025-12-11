# Mock Interviewer Frontend

A modern, responsive Next.js 14 frontend for the Mock Interview Practice Platform.

## Features

- 🎨 **Modern UI** - Built with Next.js 14 App Router and TailwindCSS
- 🔐 **Authentication** - JWT-based auth with protected routes
- 📄 **Resume Upload** - Upload and parse resumes (PDF/TXT)
- 🎯 **Interview Practice** - Multiple interview rounds (Technical, HR, Manager, CTO, Case)
- 🤖 **AI-Powered** - Integration with Gemini API for questions and evaluations
- 📊 **Performance Tracking** - View detailed feedback and scores

## Prerequisites

- Node.js 18+ installed
- Backend server running (see `../server/README.md`)
- Backend API accessible (default: `http://localhost:3000`)

## Installation

1. **Navigate to client folder**:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```

4. **Edit `.env.local`** and set your backend URL:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000` (or the next available port).

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
client/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── resume/            # Resume upload
│   ├── interview/        # Interview pages
│   │   ├── start/         # Start interview
│   │   └── session/        # Interview session & summary
│   ├── layout.jsx         # Root layout
│   ├── page.jsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Input.jsx
│   ├── Loader.jsx
│   ├── Navbar.jsx
│   └── ProtectedRoute.jsx
├── contexts/              # React contexts
│   └── AuthContext.jsx    # Authentication context
├── lib/                   # Utilities
│   └── api.js             # API client (axios)
└── package.json
```

## User Flow

1. **Landing Page** → User sees intro and can login/register
2. **Register/Login** → User creates account or logs in
3. **Dashboard** → User sees profile and can upload resume or start interview
4. **Resume Upload** → User uploads PDF/TXT resume, gets parsed summary
5. **Start Interview** → User selects role and interview mode
6. **Interview Session** → User answers questions one by one, gets instant feedback
7. **Summary** → User sees overall performance and round-wise scores

## API Integration

The frontend communicates with the backend through the API client in `lib/api.js`. All API calls automatically include the JWT token from localStorage.

### Available API Functions

- `authAPI.register()` - Register new user
- `authAPI.login()` - Login user
- `authAPI.getProfile()` - Get user profile
- `resumeAPI.upload()` - Upload resume
- `rolesAPI.getAll()` - Get all role profiles
- `interviewAPI.start()` - Start interview session
- `interviewAPI.getNextQuestion()` - Get next question
- `interviewAPI.submitAnswer()` - Submit answer and get evaluation
- `interviewAPI.complete()` - Complete interview and get summary

## Authentication

- JWT tokens are stored in `localStorage`
- Protected routes automatically redirect to login if not authenticated
- Token is automatically included in API requests via axios interceptors
- 401 responses automatically log out the user

## Components

### Reusable Components

- **Button** - Styled button with variants (primary, secondary, danger, outline)
- **Input** - Form input with label and error handling
- **Card** - Container card with shadow
- **Loader** - Loading spinner with different sizes
- **Navbar** - Navigation bar with auth state
- **ProtectedRoute** - Wrapper for protected pages

## Styling

- **TailwindCSS** - Utility-first CSS framework
- **Custom Colors** - Primary color scheme defined in `tailwind.config.js`
- **Responsive Design** - Mobile-first approach

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | `http://localhost:3000` |

## Troubleshooting

### Backend Connection Issues

- Ensure backend server is running
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Verify CORS is enabled on backend
- Check browser console for API errors

### Authentication Issues

- Clear localStorage and try logging in again
- Check if token is being stored correctly
- Verify backend JWT_SECRET is set

### Build Issues

- Delete `.next` folder and rebuild
- Clear `node_modules` and reinstall dependencies
- Check Node.js version (requires 18+)

## Development Tips

1. **Hot Reload** - Changes automatically refresh in development
2. **API Testing** - Use browser DevTools Network tab to inspect API calls
3. **State Debugging** - Use React DevTools to inspect AuthContext state
4. **Error Handling** - Check browser console for detailed error messages

## Next Steps

- Add session history page
- Implement real-time notifications
- Add interview analytics dashboard
- Enhance UI with animations
- Add dark mode support

## License

ISC

---

For backend setup, see `../server/README.md`


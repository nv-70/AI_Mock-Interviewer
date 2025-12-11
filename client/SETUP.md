# Frontend Setup Guide

Quick setup guide for the Mock Interviewer Frontend.

## Prerequisites

- Node.js 18 or higher
- Backend server running (see `../server/README.md`)

## Quick Start

1. **Install dependencies**:
   ```bash
   cd client
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.local.example .env.local
   ```

3. **Edit `.env.local`**:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   ```
   (Update if your backend runs on a different port)

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open browser**:
   Navigate to `http://localhost:3000` (or the port shown in terminal)

## First Time Setup

1. **Register a new account**:
   - Go to `/register`
   - Fill in your details
   - Submit the form

2. **Upload a resume** (optional but recommended):
   - Go to Dashboard → Upload Resume
   - Upload a PDF or TXT file
   - Wait for parsing to complete

3. **Start an interview**:
   - Go to Dashboard → Start Interview
   - Select interview mode and role
   - Begin answering questions

## Troubleshooting

### Port Already in Use
If port 3000 is taken, Next.js will automatically use the next available port (3001, 3002, etc.)

### Backend Connection Failed
- Ensure backend is running: `cd ../server && npm run dev`
- Check backend URL in `.env.local`
- Verify backend is accessible at the configured URL

### Module Not Found Errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Development Commands

```bash
# Development server (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Project Structure

- `app/` - Next.js pages (App Router)
- `components/` - Reusable UI components
- `contexts/` - React contexts (Auth)
- `lib/` - Utilities and API client

## Next Steps

- Read `README.md` for detailed documentation
- Check `../server/README.md` for backend setup
- Start building your features!


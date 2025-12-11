# Quick Start Guide

Get the Mock Interviewer Backend running in 5 minutes!

## Prerequisites Check

- [ ] Node.js (>=16) installed
- [ ] MongoDB installed and running
- [ ] Gemini API key ready

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your values:
```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Start MongoDB
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
# or
mongod --dbpath /path/to/data
```

### 4. Seed Database
```bash
npm run seed
```

You should see:
```
✅ Connected to MongoDB
✅ Cleared existing role profiles
🌱 Seeding role profiles...
  ✓ Created: Software Developer
  ✓ Created: Java Developer
  ...
✅ Seeding completed! Created 12 role profiles.
```

### 5. Start Server
```bash
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 3000
📝 Environment: development
```

### 6. Test the API

Open a new terminal and test the health endpoint:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","message":"Mock Interviewer API is running"}
```

## Next Steps

1. **Register a user** - See `examples/api-examples.md`
2. **Upload a resume** - Test the resume parsing
3. **Start an interview** - Try the full interview flow
4. **Import Postman collection** - Use `postman-collection.json` for easier testing

## Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check `MONGO_URI` in `.env`
- Verify MongoDB is on the default port (27017)

### Gemini API Errors
- Verify `GEMINI_API_KEY` is set in `.env`
- Check API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Review server logs for specific error messages

### Port Already in Use
- Change `PORT` in `.env` to a different port (e.g., 3001)
- Or stop the process using port 3000

## File Structure

```
mock-interviewer-backend/
├── src/
│   ├── controllers/    # Business logic
│   ├── models/         # Database schemas
│   ├── routes/         # API endpoints
│   ├── middleware/     # Auth, validation, etc.
│   ├── services/       # Gemini client
│   └── utils/          # Resume parser
├── scripts/
│   └── seed.js         # Database seeding
├── uploads/            # Resume files (auto-created)
└── .env                # Your config (create this)
```

## Common Commands

```bash
# Development (auto-reload)
npm run dev

# Production
npm start

# Seed database
npm run seed

# Run tests
npm test
```

## Need Help?

- Check `README.md` for detailed documentation
- See `examples/api-examples.md` for API usage examples
- Review server logs for error messages

Happy coding! 🚀


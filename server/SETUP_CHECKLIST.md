# Setup Checklist

Follow these steps to get your Mock Interviewer backend running:

## ✅ Prerequisites

- [ ] Node.js (>=16) installed
- [ ] MongoDB installed and running
- [ ] Google account for Gemini API key

## ✅ Step 1: Install Dependencies

```bash
cd server
npm install
```

## ✅ Step 2: Create .env File

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in a text editor

3. Fill in these **REQUIRED** values:

   ```env
   # Required: MongoDB connection
   MONGO_URI=mongodb://localhost:27017/mock_interviewer
   
   # Required: JWT secret (use a random string)
   JWT_SECRET=your_random_secret_here
   
   # Required: Gemini API key (get from https://makersuite.google.com/app/apikey)
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## ✅ Step 3: Get Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key
5. Paste it in `.env` file as `GEMINI_API_KEY=...`

## ✅ Step 4: Start MongoDB

**Windows:**
```bash
mongod
```

**macOS/Linux:**
```bash
sudo systemctl start mongod
# or
mongod --dbpath /path/to/data
```

## ✅ Step 5: Seed Database

```bash
npm run seed
```

Expected output:
```
✅ Connected to MongoDB
✅ Cleared existing role profiles
🌱 Seeding role profiles...
  ✓ Created: Software Developer
  ...
✅ Seeding completed! Created 12 role profiles.
```

## ✅ Step 6: Start Server

```bash
npm run dev
```

Expected output:
```
✅ MongoDB connected successfully
🚀 Server running on port 3000
```

## ✅ Step 7: Test API

Open a new terminal:

```bash
curl http://localhost:3000/health
```

Should return:
```json
{"status":"ok","message":"Mock Interviewer API is running"}
```

## 🎉 You're Done!

Your backend is now running. See `README.md` for API documentation and `examples/api-examples.md` for usage examples.

## ❌ Troubleshooting

### MongoDB Connection Failed
- Check if MongoDB is running: `mongod`
- Verify `MONGO_URI` in `.env`
- Check MongoDB is on port 27017

### Gemini API Errors
- Verify `GEMINI_API_KEY` is correct (no extra spaces)
- Check API key is active at Google AI Studio
- Review server logs for specific errors

### Port Already in Use
- Change `PORT` in `.env` to a different port (e.g., 3001)
- Or stop the process using port 3000

## 📚 Next Steps

- Read `README.md` for full API documentation
- Check `examples/api-examples.md` for API usage
- Import `postman-collection.json` into Postman
- Start building your frontend!


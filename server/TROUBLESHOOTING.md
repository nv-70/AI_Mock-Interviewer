# Troubleshooting Guide

## JWT_SECRET Error: "secretOrPrivateKey must have a value"

If you're getting this error, follow these steps:

### Step 1: Verify .env File Location

The `.env` file **must** be in the `server` folder (same level as `package.json`):

```
server/
├── .env          ← Must be here!
├── package.json
├── src/
└── ...
```

### Step 2: Check .env File Format

Your `.env` file should look like this (NO quotes, NO spaces around =):

```env
JWT_SECRET=dhdsyigfiusfh4754ds44
MONGO_URI=mongodb://localhost:27017/mock_interviewer
PORT=3000
```

**Common mistakes:**
- ❌ `JWT_SECRET = "dhdsyigfiusfh4754ds44"` (spaces and quotes)
- ❌ `JWT_SECRET="dhdsyigfiusfh4754ds44"` (quotes)
- ❌ `JWT_SECRET = dhdsyigfiusfh4754ds44` (spaces)
- ✅ `JWT_SECRET=dhdsyigfiusfh4754ds44` (correct)

### Step 3: Restart the Server

After modifying `.env`, you **must restart** the server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
cd server
npm run dev
```

### Step 4: Check Server Startup Logs

When the server starts, you should see:

```
✅ MongoDB connected successfully
🚀 Server running on port 3000
✅ JWT_SECRET is configured: Yes
   Secret length: 20 characters
```

If you see "JWT_SECRET is configured: No", the server isn't reading your .env file.

### Step 5: Verify dotenv is Loading

The server uses `require('dotenv').config()` at the very top of `src/index.js`. This should automatically load `.env` from the server folder.

### Step 6: Manual Check

Test if the .env is being read:

```bash
cd server
node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Found' : 'NOT FOUND');"
```

### Common Issues

#### Issue 1: .env file in wrong location
- **Solution**: Move `.env` to the `server` folder root

#### Issue 2: Server not restarted
- **Solution**: Stop and restart the server after changing .env

#### Issue 3: .env file has wrong format
- **Solution**: Remove quotes and spaces around `=`

#### Issue 4: Multiple .env files
- **Solution**: Make sure you're editing the one in `server/.env`, not root folder

#### Issue 5: Hidden characters or encoding
- **Solution**: Recreate the .env file from scratch

### Quick Fix Script

If you're still having issues, try this:

1. **Delete and recreate .env**:
   ```bash
   cd server
   rm .env
   cp .env.example .env
   ```

2. **Edit .env** and add your values (no quotes, no spaces):
   ```env
   JWT_SECRET=dhdsyigfiusfh4754ds44
   MONGO_URI=mongodb://localhost:27017/mock_interviewer
   PORT=3000
   JWT_EXPIRES_IN=7d
   GEMINI_API_KEY=your_key_here
   UPLOADS_DIR=./uploads
   ```

3. **Restart server**:
   ```bash
   npm run dev
   ```

### Still Not Working?

1. Check the server console for error messages
2. Verify the .env file path is correct
3. Make sure there are no special characters in JWT_SECRET
4. Try a simple JWT_SECRET value like: `JWT_SECRET=test123456789`
5. Check if you're running the server from the correct directory

### Need More Help?

Check the server logs when starting. The server now validates JWT_SECRET on startup and will show clear error messages if it's missing.


# Gemini API Troubleshooting Guide

## Error: "Error generating questions. Please try again later."

This error occurs when the Gemini API call fails. Follow these steps to diagnose and fix:

### Step 1: Verify GEMINI_API_KEY

1. **Check if key is set in .env**:
   ```bash
   cd server
   # Check if GEMINI_API_KEY exists
   grep GEMINI_API_KEY .env
   ```

2. **Verify key format**:
   - Should start with `AIza` (for Google API keys)
   - Should be about 39 characters long
   - No quotes or spaces around the value

3. **Get a new key if needed**:
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with Google
   - Click "Create API Key"
   - Copy and paste into `.env` file

### Step 2: Check Server Logs

When you try to start an interview, check the server console for detailed error messages:

```bash
# Look for errors like:
Error generating questions for technical: ...
Gemini API call failed (attempt 1/2): ...
```

Common error messages:
- **"API key not valid"** → Your API key is incorrect or expired
- **"Quota exceeded"** → You've hit the API rate limit
- **"Model not found"** → API endpoint issue
- **"Request timeout"** → Network or API is slow

### Step 3: Test API Key Manually

Test if your API key works:

```bash
# Replace YOUR_API_KEY with your actual key
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Say hello"
      }]
    }]
  }'
```

If this fails, your API key is invalid.

### Step 4: Check API Quota

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Quotas
3. Check if you've exceeded the free tier limits

Free tier limits:
- 60 requests per minute
- 1,500 requests per day

### Step 5: Verify API Endpoint and Model

The code now uses `gemini-1.5-flash` by default (available in free tier).

**Available Models:**
- `gemini-1.5-flash` (default) - Fast, free tier available
- `gemini-1.5-pro` - More capable, may require paid tier
- `gemini-pro` - Deprecated, not available

**To change the model**, add to your `.env` file:
```env
GEMINI_MODEL=gemini-1.5-flash
```

Or use the more capable model:
```env
GEMINI_MODEL=gemini-1.5-pro
```

### Step 6: Common Issues and Solutions

#### Issue 1: Invalid API Key
**Solution**: 
- Get a new key from https://makersuite.google.com/app/apikey
- Update `.env` file
- Restart server

#### Issue 2: API Quota Exceeded
**Solution**:
- Wait for quota to reset (usually daily)
- Or upgrade to paid tier

#### Issue 3: Network/Timeout Issues
**Solution**:
- Check internet connection
- Increase timeout in code (already set to 60 seconds)
- Try again later

#### Issue 4: API Endpoint Changed
**Solution**:
- Google may have updated the API
- Check [Gemini API Documentation](https://ai.google.dev/docs)
- Update endpoint if needed

### Step 7: Enable Detailed Logging

The server now logs detailed error information. Check the console output when starting an interview to see:
- Exact error message from Gemini API
- HTTP status code
- Response details

### Step 8: Alternative: Use Fallback Questions

If Gemini API continues to fail, you could:
1. Implement a fallback system with pre-written questions
2. Cache generated questions
3. Use a different AI service

### Still Not Working?

1. **Check server console** for the exact error message
2. **Verify API key** is correct and active
3. **Test API key** manually using curl (see Step 3)
4. **Check quota** in Google Cloud Console
5. **Restart server** after changing .env

### Quick Checklist

- [ ] GEMINI_API_KEY is set in `.env` file
- [ ] API key is valid (starts with `AIza`)
- [ ] Server was restarted after setting API key
- [ ] API quota not exceeded
- [ ] Internet connection is working
- [ ] Checked server logs for specific error

### Need More Help?

Share the exact error message from the server console, and we can help diagnose further.


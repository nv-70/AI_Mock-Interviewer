// Quick script to check if .env is being loaded correctly
require('dotenv').config();

console.log('\n🔍 Environment Variables Check\n');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? `✅ Found (${process.env.JWT_SECRET.length} chars)` : '❌ NOT FOUND');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Found' : '❌ NOT FOUND');
console.log('PORT:', process.env.PORT || '3000 (default)');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Found' : '❌ NOT FOUND');

if (!process.env.JWT_SECRET) {
  console.log('\n❌ ERROR: JWT_SECRET is missing!');
  console.log('Please check your .env file in the server folder.');
  process.exit(1);
}

if (process.env.JWT_SECRET.trim() === '') {
  console.log('\n❌ ERROR: JWT_SECRET is empty!');
  console.log('Please set a value for JWT_SECRET in .env file.');
  process.exit(1);
}

console.log('\n✅ All required variables are set!\n');


const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const ALLOWED_DIFFICULTIES = [
  "2-month-summer-intern",
  "6-month-intern",
  "full-time-fresher",
  "experience-1-year",
  "experience-2-years",
  "experience-3-years",
  "experience-4-years",
  "experience-5-plus-years",
];

const DIFFICULTY_MAP = {
  beginner: "2-month-summer-intern",
  intern: "2-month-summer-intern",
  fresher: "full-time-fresher",
  entry: "6-month-intern",
  junior: "full-time-fresher",
  medium: "experience-2-years",
  intermediate: "experience-2-years",
  senior: "experience-4-years",
  expert: "experience-5-plus-years",
  easy: "6-month-intern",
  hard: "experience-4-years",
};

// ✅ FIXED NORMALIZER (NO "mid")
const normalizeDifficultyValue = (value, fallback = "full-time-fresher") => {
  if (!value) return fallback;

  const normalized = value.toString().trim().toLowerCase().replace(/\s+/g, "-");

  if (ALLOWED_DIFFICULTIES.includes(normalized)) {
    return normalized;
  }

  if (DIFFICULTY_MAP[normalized]) {
    return DIFFICULTY_MAP[normalized];
  }

  return fallback;
};

const callGemini = async (prompt) => {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await axios.post(url, {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  });

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Invalid Gemini response");
  }

  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { raw: text };
  }
};

// ✅ FIXED generateQuestions
const generateQuestions = async (roundType, context) => {
  const {
    roleProfile,
    resumeData,
    userProfile,
    questionCount = 5,
    difficulty = "full-time-fresher", // ✅ FIXED
  } = context;

  const normalizedDifficulty = normalizeDifficultyValue(difficulty);

  let contextString = `Role: ${roleProfile.roleName}\n`;
  contextString += `Skills: ${roleProfile.skillExpectations.join(", ")}\n`;

  const prompt = `
Generate ${questionCount} ${roundType} interview questions.

Difficulty level: ${normalizedDifficulty}

Return ONLY JSON:
{
  "questions": [
    {
      "id": "q1",
      "text": "Question",
      "difficulty": "${normalizedDifficulty}",
      "expectedKeywords": ["keyword"],
      "timeMinutes": 5
    }
  ]
}
`;

  const response = await callGemini(prompt);

  if (!response.questions || !Array.isArray(response.questions)) {
    throw new Error("Invalid response");
  }

  const questions = response.questions.map((q, index) => ({
    id: `${roundType}-q${index + 1}`,
    text: q.text || "",
    difficulty: normalizeDifficultyValue(
      q.difficulty || normalizedDifficulty || "full-time-fresher",
    ),
    expectedKeywords: Array.isArray(q.expectedKeywords)
      ? q.expectedKeywords
      : [],
    timeMinutes: q.timeMinutes || 5,
  }));

  return { questions };
};

// evaluateAnswer (same safe version)
const evaluateAnswer = async (questionData, studentAnswer) => {
  return {
    questionId: questionData.id,
    score: 5,
    feedbackText: "Evaluation placeholder",
    strengths: [],
    weaknesses: [],
    improvementTips: [],
  };
};

module.exports = {
  generateQuestions,
  evaluateAnswer,
  normalizeDifficultyValue,
};

const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Use gemini-2.5-flash as default (newer model, available in free tier and faster)
// Fallback to gemini-2.0-flash if 2.5 is not available
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
}

const ALLOWED_DIFFICULTIES = [
  '2-month-summer-intern',
  '6-month-intern',
  'full-time-fresher',
  'experience-1-year',
  'experience-2-years',
  'experience-3-years',
  'experience-4-years',
  'experience-5-plus-years'
];

const DIFFICULTY_MAP = {
  beginner: '2-month-summer-intern',
  intern: '2-month-summer-intern',
  fresher: 'full-time-fresher',
  entry: '6-month-intern',
  'entry-level': '6-month-intern',
  junior: 'full-time-fresher',
  mid: 'experience-2-years',
  middle: 'experience-2-years',
  medium: 'experience-2-years',
  intermediate: 'experience-2-years',
  senior: 'experience-4-years',
  expert: 'experience-5-plus-years',
  advanced: 'experience-4-years',
  lead: 'experience-4-years',
  principal: 'experience-5-plus-years',
  easy: '6-month-intern',
  hard: 'experience-4-years'
};

const normalizeDifficultyValue = (value, fallback = 'full-time-fresher') => {
  if (!value) return fallback;
  const normalized = value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

  if (ALLOWED_DIFFICULTIES.includes(normalized)) {
    return normalized;
  }

  if (DIFFICULTY_MAP[normalized]) {
    return DIFFICULTY_MAP[normalized];
  }

  return fallback;
};

/**
 * List available models (for debugging)
 */
const listModels = async () => {
  if (!GEMINI_API_KEY) {
    return null;
  }
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error listing models:', error.response?.data || error.message);
    return null;
  }
};

/**
 * Call Gemini API with retry logic and automatic model/version fallback
 */
const callGemini = async (prompt, maxRetries = 2) => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // First, try to get available models and use them
  let availableModelNames = [];
  try {
    const modelsList = await listModels();
    if (modelsList?.models) {
      availableModelNames = modelsList.models
        .map(m => {
          const name = m.name || m.displayName || '';
          // Remove "models/" prefix if present
          return name.replace(/^models\//, '');
        })
        .filter(name => name.startsWith('gemini-'));
      console.log('Available Gemini models:', availableModelNames.join(', '));
    }
  } catch (err) {
    console.warn('Could not fetch available models, using defaults');
  }

  // Build configs based on available models, or use defaults
  const configs = [];
  
  // Priority order: 2.5-flash, 2.0-flash, 2.5-pro, then others
  const preferredModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.0-flash-001'];
  
  // If we have available models, use only those
  const modelsToTry = availableModelNames.length > 0 
    ? preferredModels.filter(m => availableModelNames.includes(m) || availableModelNames.some(am => am.includes(m.replace('gemini-', ''))))
    : preferredModels;
  
  // If no preferred models found, use all available
  const finalModels = modelsToTry.length > 0 ? modelsToTry : (availableModelNames.length > 0 ? availableModelNames : preferredModels);
  
  // Build configs with v1 first (more stable), then v1beta
  for (const model of finalModels) {
    configs.push({ version: 'v1', model });
    configs.push({ version: 'v1beta', model });
  }
  
  // Add custom model if set and not already in list
  if (GEMINI_MODEL && !finalModels.includes(GEMINI_MODEL)) {
    configs.push({ version: 'v1', model: GEMINI_MODEL });
    configs.push({ version: 'v1beta', model: GEMINI_MODEL });
  }

  console.log(`Trying ${configs.length} model/version combinations...`);

  let lastError;
  
  for (const config of configs) {
    const url = `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${GEMINI_API_KEY}`;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(url, {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 seconds timeout
        });

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error('Invalid response format from Gemini API');
        }

        // Try to parse JSON from response
        try {
          // Remove markdown code blocks if present
          const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          return JSON.parse(cleanedText);
        } catch (parseError) {
          // If not JSON, return as text
          return { raw: text };
        }
      } catch (error) {
        lastError = error;
        const errorDetails = error.response?.data?.error || {};
        const errorMessage = errorDetails?.message || error.message || '';
        
        // Check if it's a model not found error
        const isModelNotFound = errorMessage.includes('not found') || 
                               errorMessage.includes('not supported') ||
                               error.response?.status === 404;
        
        if (isModelNotFound) {
          console.warn(`Model ${config.model} with ${config.version} not available: ${errorMessage.substring(0, 100)}`);
          break; // Try next config
        }
        
        // For other errors, log and retry
        console.error(`Gemini API call failed (${config.version}/${config.model}, attempt ${attempt}/${maxRetries}):`, {
          message: errorMessage.substring(0, 200),
          status: error.response?.status,
          code: error.code
        });
        
        if (attempt < maxRetries) {
          const delay = attempt * 1000; // Exponential backoff
          console.warn(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we got a successful response, we wouldn't reach here
    // If we get here and it's not a "not found" error, break to avoid trying other configs
    if (lastError) {
      const errorMsg = lastError.response?.data?.error?.message || lastError.message || '';
      const isModelNotFound = errorMsg.includes('not found') || errorMsg.includes('not supported');
      
      if (!isModelNotFound && lastError.response?.status !== 404) {
        // This was a different error (not model not found), so break
        console.error('Non-model error detected, stopping config attempts');
        break;
      }
    }
  }

  // If we get here, all attempts failed
  const errorMessage = lastError?.response?.data?.error?.message || 
                      lastError?.message || 
                      'Unknown error';
  
  // Try to list available models for debugging
  console.error('Attempting to list available models for debugging...');
  const availableModels = await listModels();
  if (availableModels?.models) {
    const modelNames = availableModels.models.map(m => m.name || m.displayName).filter(Boolean);
    console.error('Available models:', modelNames.join(', '));
  }
  
  throw new Error(`Gemini API call failed after trying all models and versions: ${errorMessage}`);
};

/**
 * Generate interview questions for a specific round
 * 
 * Prompt template for question generation:
 * - Technical: Focus on DSA, coding, projects, system design
 * - HR: Behavioral questions using STAR format
 * - Manager: Leadership, ownership, team management
 * - CTO: Architecture, scalability, technical leadership
 * - Case: Problem-solving, analytical thinking
 */
const generateQuestions = async (roundType, context) => {
  const {
    roleProfile,
    resumeData,
    userProfile,
    questionCount = 5,
    difficulty = 'mid'
  } = context;

  const normalizedDifficulty = normalizeDifficultyValue(difficulty);

  // Build context string
  let contextString = `Role: ${roleProfile.roleName}\n`;
  contextString += `Domain Tags: ${roleProfile.domainTags.join(', ')}\n`;
  contextString += `Expected Skills: ${roleProfile.skillExpectations.join(', ')}\n`;
  
  if (userProfile) {
    contextString += `\nCandidate Profile:\n`;
    contextString += `- Education: ${userProfile.education.degree} from ${userProfile.education.college || 'N/A'}\n`;
    contextString += `- Experience Level: ${userProfile.experienceLevel}\n`;
    contextString += `- Experience Years: ${userProfile.experienceYears}\n`;
    contextString += `- Domains: ${userProfile.domains.join(', ')}\n`;
  }

  if (resumeData) {
    contextString += `\nResume Information:\n`;
    if (resumeData.parsed?.skills?.length > 0) {
      contextString += `- Skills: ${resumeData.parsed.skills.join(', ')}\n`;
    }
    if (resumeData.parsed?.projects?.length > 0) {
      contextString += `- Projects: ${resumeData.parsed.projects.slice(0, 3).join('; ')}\n`;
    }
    const resumeExperienceYears =
      resumeData.parsed?.experience?.totalYears ?? resumeData.parsed?.experienceYears;
    if (resumeExperienceYears) {
      contextString += `- Experience: ${resumeExperienceYears} years\n`;
    }
  }

  // Round-specific prompts
  const roundPrompts = {
    technical: `Generate ${questionCount} technical interview questions for a candidate at ${normalizedDifficulty.replace(/-/g, ' ')} level.
Focus on:
- Data structures and algorithms
- Coding problems
- Project deep-dive questions
- System design basics (for experienced candidates)
- Technology-specific questions based on the role

Each question should be practical and relevant to the candidate's background.`,

    hr: `Generate ${questionCount} behavioral/HR interview questions.
Use the STAR (Situation, Task, Action, Result) format as a guide for what to evaluate.
Focus on:
- Teamwork and collaboration
- Problem-solving in challenging situations
- Leadership and initiative
- Handling conflicts
- Motivation and career goals
- Cultural fit`,

    manager: `Generate ${questionCount} managerial interview questions.
Focus on:
- Leadership and team management
- Decision-making under pressure
- Handling difficult team situations
- Project ownership and accountability
- Mentoring and developing team members
- Balancing technical and management responsibilities`,

    cto: `Generate ${questionCount} CTO/Technical Leadership interview questions.
Focus on:
- System architecture and scalability
- Technical decision-making
- Technology strategy
- Handling technical debt
- Building and leading technical teams
- Long-term technical vision`,

    case: `Generate ${questionCount} case study/problem-solving interview questions.
Focus on:
- Analytical thinking
- Structured problem-solving approach
- Business logic and reasoning
- Data interpretation
- Scenario-based challenges
- Consulting-style case questions`
  };

  const roundPrompt = roundPrompts[roundType] || roundPrompts.technical;

  const fullPrompt = `You are an expert interview question generator for a mock interview platform.

${contextString}

${roundPrompt}

IMPORTANT: You must respond with ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "questions": [
    {
      "id": "q1",
      "text": "Question text here",
      "difficulty": "${normalizedDifficulty}",
      "expectedKeywords": ["keyword1", "keyword2"],
      "timeMinutes": 5
    }
  ]
}

Generate exactly ${questionCount} questions. Make them diverse and relevant to the candidate's profile.`;

  try {
    const response = await callGemini(fullPrompt);
    
    // Validate response structure
    if (!response.questions || !Array.isArray(response.questions)) {
      throw new Error('Invalid response format: missing questions array');
    }

    // Ensure all questions have required fields with unique IDs
    // ALWAYS generate unique IDs with roundType prefix to prevent duplicates across rounds
    // Ignore any IDs returned by Gemini to ensure uniqueness
    const questions = response.questions.map((q, index) => ({
      id: `${roundType}-q${index + 1}`, // Always use our format, ignore Gemini's ID
      text: q.text || '',
      difficulty: normalizeDifficultyValue(q.difficulty || normalizedDifficulty, normalizedDifficulty),
      expectedKeywords: Array.isArray(q.expectedKeywords) ? q.expectedKeywords : [],
      timeMinutes: q.timeMinutes || 5
    }));

    return { questions };
  } catch (error) {
    console.error('Error generating questions:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

/**
 * Evaluate a student's answer
 * 
 * Input: question text, expected keywords, student's answer
 * Output: score (0-10), feedback, strengths, weaknesses, improvement tips
 */
const evaluateAnswer = async (questionData, studentAnswer) => {
  const { text: questionText, expectedKeywords = [] } = questionData;

  const prompt = `You are a strict and accurate interview evaluator. Evaluate the following interview answer with precision.

Question: ${questionText}

Expected Keywords/Topics: ${expectedKeywords.join(', ')}

Student's Answer:
${studentAnswer}

CRITICAL EVALUATION CRITERIA (be strict and accurate):
1. **Relevance (0-2 points)**: Does the answer address the question? 
   - Test answers, gibberish, or completely irrelevant responses = 0
   - Partial relevance = 1
   - Fully relevant = 2

2. **Accuracy & Depth (0-4 points)**: 
   - No substance, test text, or placeholder answers = 0
   - Basic understanding with some errors = 1-2
   - Good understanding with minor gaps = 3
   - Excellent depth and accuracy = 4

3. **Clarity & Communication (0-2 points)**:
   - Unclear or incoherent = 0
   - Somewhat clear = 1
   - Very clear and well-structured = 2

4. **Completeness (0-2 points)**:
   - Incomplete or very brief = 0-1
   - Complete answer = 2

SCORING RULES:
- Answers like "test", "testing", "testing purpose", or similar placeholder text should receive 0-2/10
- One-word or very short answers (< 20 words) without substance should receive 0-3/10
- Answers must demonstrate actual understanding to score above 5/10
- Only well-thought-out, detailed, and accurate answers should score 8-10/10

IMPORTANT: You must respond with ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "questionId": "${questionData.id || 'unknown'}",
  "score": 7,
  "feedbackText": "Detailed feedback explaining the score and what was good/bad...",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "improvementTips": ["tip1", "tip2"],
  "scoreBreakdown": {
    "relevance": 2,
    "accuracy": 3,
    "clarity": 2,
    "completeness": 2
  }
}

Be strict, fair, and constructive in your evaluation.`;

  try {
    const response = await callGemini(prompt);
    
    // Validate and normalize response
    let score = Math.max(0, Math.min(10, parseInt(response.score) || 0));
    
    // Additional validation: if answer is too short or looks like test text, penalize heavily
    const answerLower = studentAnswer.toLowerCase().trim();
    const testPatterns = ['test', 'testing', 'testing purpose', 'just testing', 'test answer'];
    const isTestAnswer = testPatterns.some(pattern => answerLower.includes(pattern)) || answerLower.length < 20;
    
    if (isTestAnswer && score > 2) {
      score = Math.min(2, score); // Cap test answers at 2/10
    }
    
    const evaluation = {
      questionId: response.questionId || questionData.id,
      score: score,
      feedbackText: response.feedbackText || 'No feedback provided',
      strengths: Array.isArray(response.strengths) ? response.strengths : [],
      weaknesses: Array.isArray(response.weaknesses) ? response.weaknesses : [],
      improvementTips: Array.isArray(response.improvementTips) ? response.improvementTips : [],
      scoreBreakdown: response.scoreBreakdown || null
    };

    return evaluation;
  } catch (error) {
    console.error('Error evaluating answer:', error);
    throw error;
  }
};

module.exports = {
  generateQuestions,
  evaluateAnswer,
  callGemini,
  listModels,
  normalizeDifficultyValue
};

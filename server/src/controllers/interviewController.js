const { validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const InterviewSession = require('../models/InterviewSession');
const RoleProfile = require('../models/RoleProfile');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { generateQuestions, evaluateAnswer, normalizeDifficultyValue } = require('../services/geminiClient');

const startInterview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      mode, 
      roleProfileId, 
      resumeId,
      // Customization options
      enabledRounds, // Array of round types to include: ['technical', 'hr', ...]
      questionCounts, // Object: { technical: 3, hr: 2, ... }
      difficulty, // Override difficulty for technical round
      proctored
    } = req.body;
    const studentId = req.user._id;

    // Validate mode
    if (!['resume', 'role', 'mixed'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mode. Must be: resume, role, or mixed'
      });
    }

    // Get role profile
    const roleProfile = await RoleProfile.findById(roleProfileId);
    if (!roleProfile) {
      return res.status(404).json({
        success: false,
        message: 'Role profile not found'
      });
    }

    // Get resume if needed
    let resumeData = null;
    if (mode === 'resume' || mode === 'mixed') {
      if (!resumeId) {
        // Try to get user's resume
        const user = await User.findById(studentId);
        if (user && user.resumeId) {
          resumeData = await Resume.findById(user.resumeId);
        }
      } else {
        resumeData = await Resume.findById(resumeId);
        if (resumeData && resumeData.userId.toString() !== studentId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'You do not have access to this resume'
          });
        }
      }

      if (!resumeData && (mode === 'resume' || mode === 'mixed')) {
        return res.status(400).json({
          success: false,
          message: 'Resume is required for this interview mode'
        });
      }
    }

    // Get user profile
    const userProfile = await User.findById(studentId);

    // Default interview structure based on Indian system standards
    const defaultInterviewStructures = {
      '2-month-summer-intern': {
        technical: { questionCount: 3, difficulty: '2-month-summer-intern' },
        hr: { questionCount: 2 },
        manager: { questionCount: 0 },
        cto: { questionCount: 0 },
        case: { questionCount: 1 }
      },
      '6-month-intern': {
        technical: { questionCount: 4, difficulty: '6-month-intern' },
        hr: { questionCount: 3 },
        manager: { questionCount: 1 },
        cto: { questionCount: 0 },
        case: { questionCount: 2 }
      },
      'full-time-fresher': {
        technical: { questionCount: 5, difficulty: 'full-time-fresher' },
        hr: { questionCount: 4 },
        manager: { questionCount: 2 },
        cto: { questionCount: 0 },
        case: { questionCount: 2 }
      },
      'experience-1-year': {
        technical: { questionCount: 6, difficulty: 'experience-1-year' },
        hr: { questionCount: 4 },
        manager: { questionCount: 3 },
        cto: { questionCount: 1 },
        case: { questionCount: 3 }
      },
      'experience-2-years': {
        technical: { questionCount: 7, difficulty: 'experience-2-years' },
        hr: { questionCount: 4 },
        manager: { questionCount: 3 },
        cto: { questionCount: 2 },
        case: { questionCount: 3 }
      },
      'experience-3-years': {
        technical: { questionCount: 8, difficulty: 'experience-3-years' },
        hr: { questionCount: 4 },
        manager: { questionCount: 4 },
        cto: { questionCount: 2 },
        case: { questionCount: 4 }
      },
      'experience-4-years': {
        technical: { questionCount: 8, difficulty: 'experience-4-years' },
        hr: { questionCount: 4 },
        manager: { questionCount: 4 },
        cto: { questionCount: 3 },
        case: { questionCount: 4 }
      },
      'experience-5-plus-years': {
        technical: { questionCount: 8, difficulty: 'experience-5-plus-years' },
        hr: { questionCount: 4 },
        manager: { questionCount: 4 },
        cto: { questionCount: 4 },
        case: { questionCount: 5 }
      }
    };

    // Build rounds based on role profile interview structures and customizations
    const rounds = [];
    const allRoundTypes = ['technical', 'hr', 'manager', 'cto', 'case'];
    
    // Determine which structure to use: custom difficulty defaults or role profile defaults
    const selectedDifficulty = normalizeDifficultyValue(
      difficulty || roleProfile.interviewStructures?.technical?.difficulty || 'full-time-fresher'
    );
    const defaultStructure = defaultInterviewStructures[selectedDifficulty] || defaultInterviewStructures['full-time-fresher'];
    
    // Use enabledRounds if provided, otherwise use defaults based on difficulty
    let roundTypesToInclude;
    if (enabledRounds && Array.isArray(enabledRounds) && enabledRounds.length > 0) {
      roundTypesToInclude = enabledRounds.filter(rt => allRoundTypes.includes(rt));
    } else {
      // Use default rounds based on difficulty level
      roundTypesToInclude = Object.keys(defaultStructure).filter(rt => 
        defaultStructure[rt].questionCount > 0
      );
    }

    for (const roundType of roundTypesToInclude) {
      // Priority: custom questionCounts > role profile > default structure
      let questionCount;
      let roundDifficulty = selectedDifficulty;
      
      if (questionCounts && questionCounts[roundType]) {
        questionCount = Math.max(1, Math.min(20, parseInt(questionCounts[roundType])));
      } else if (roleProfile.interviewStructures[roundType]?.questionCount) {
        questionCount = roleProfile.interviewStructures[roundType].questionCount;
      } else if (defaultStructure[roundType]?.questionCount) {
        questionCount = defaultStructure[roundType].questionCount;
      } else {
        questionCount = 3; // Fallback
      }
      
      // Set difficulty for technical round
      if (roundType === 'technical') {
        roundDifficulty = normalizeDifficultyValue(
          difficulty || roleProfile.interviewStructures?.technical?.difficulty || selectedDifficulty
        );
      } else if (roleProfile.interviewStructures[roundType]?.difficulty) {
        roundDifficulty = normalizeDifficultyValue(roleProfile.interviewStructures[roundType].difficulty, selectedDifficulty);
      }
      
      roundDifficulty = normalizeDifficultyValue(roundDifficulty, selectedDifficulty);
      
      // Only add round if question count > 0
      if (questionCount > 0) {
        rounds.push({
          roundType,
          questions: [],
          answers: [],
          completed: false,
          customQuestionCount: questionCount,
          customDifficulty: roundDifficulty
        });
      }
    }
    
    // If no rounds selected, return error
    if (rounds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one interview round must be enabled'
      });
    }

    // Generate questions for each round using Gemini
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];
      const structure = roleProfile.interviewStructures[round.roundType];

      try {
        const roundDifficulty = round.customDifficulty || structure?.difficulty || selectedDifficulty;

        const context = {
          roleProfile,
          resumeData,
          userProfile,
          questionCount: round.customQuestionCount || structure?.questionCount || 5,
          difficulty: normalizeDifficultyValue(roundDifficulty, selectedDifficulty)
        };

        const { questions } = await generateQuestions(round.roundType, context);
        round.questions = questions;
      } catch (error) {
        console.error(`Error generating questions for ${round.roundType}:`, error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
        
        // Provide more helpful error message
        let errorMessage = 'Error generating questions. ';
        if (error.message?.includes('GEMINI_API_KEY')) {
          errorMessage += 'Gemini API key is not configured. Please check your .env file.';
        } else if (error.message?.includes('timeout')) {
          errorMessage += 'Request timed out. Please try again.';
        } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
          errorMessage += 'API quota exceeded. Please try again later.';
        } else {
          errorMessage += `Please try again later. (${error.message})`;
        }
        
        // Continue with other rounds even if one fails
        round.questions = [{
          id: 'q1',
          text: errorMessage,
          difficulty: 'mid',
          expectedKeywords: [],
          timeMinutes: 5
        }];
      }
    }

    // Create interview session
    const session = new InterviewSession({
      studentId,
      roleProfileId,
      mode,
      resumeId: resumeData?._id,
      rounds,
      status: 'active',
      currentRoundIndex: 0,
      proctored: !!proctored
    });

    await session.save();

    // Prepare response with rounds metadata
    const roundsMetadata = rounds.map((round, index) => ({
      roundIndex: index,
      roundType: round.roundType,
      questionCount: round.questions.length,
      completed: round.completed
    }));

    res.status(201).json({
      success: true,
      message: 'Interview session started successfully',
      data: {
        sessionId: session._id,
        mode: session.mode,
        roleProfile: {
          id: roleProfile._id,
          name: roleProfile.roleName
        },
        roundsMetadata,
        status: session.status,
        proctored: session.proctored
      }
    });
  } catch (error) {
    next(error);
  }
};

const getNextQuestion = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    // Verify ownership
    if (session.studentId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this session'
      });
    }

    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Interview session is already completed'
      });
    }

    // Find next unanswered question
    let nextQuestion = null;
    let roundInfo = null;
    let questionNumber = 0;
    let totalQuestions = 0;

    for (let roundIndex = 0; roundIndex < session.rounds.length; roundIndex++) {
      const round = session.rounds[roundIndex];
      totalQuestions += round.questions.length;

      for (const question of round.questions) {
        questionNumber++;
        const answered = round.answers.some(
          answer => answer.questionId === question.id
        );

        if (!answered) {
          nextQuestion = question;
          roundInfo = {
            roundIndex,
            roundType: round.roundType
          };
          break;
        }
      }

      if (nextQuestion) break;
    }

    if (!nextQuestion) {
      return res.status(200).json({
        success: true,
        message: 'All questions have been answered',
        data: {
          allQuestionsAnswered: true,
          proctored: session.proctored
        }
      });
    }

    res.json({
      success: true,
      data: {
        roundType: roundInfo.roundType,
        questionId: nextQuestion.id,
        questionText: nextQuestion.text,
        questionNumber,
        totalQuestions,
        difficulty: nextQuestion.difficulty,
        timeMinutes: nextQuestion.timeMinutes,
        sessionStartTime: session.createdAt,
        proctored: session.proctored
      }
    });
  } catch (error) {
    next(error);
  }
};

const submitAnswer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { sessionId } = req.params;
    const { questionId, answerText, timeSpentSeconds } = req.body;
    const userId = req.user._id;

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    // Verify ownership
    if (session.studentId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this session'
      });
    }

    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Interview session is already completed'
      });
    }

    // Find the question in rounds - must match both questionId AND be in the correct round
    // Question IDs should be unique with format: roundType-q1, roundType-q2, etc.
    let questionData = null;
    let targetRound = null;
    let targetRoundIndex = -1;

    // First, try to find the question by matching the full questionId
    // If questionId starts with roundType-, we know which round to look in
    const questionIdParts = questionId.split('-');
    const expectedRoundType = questionIdParts.length > 1 ? questionIdParts[0] : null;

    for (let roundIndex = 0; roundIndex < session.rounds.length; roundIndex++) {
      const round = session.rounds[roundIndex];
      
      // If we can determine the round from the questionId, only check that round
      if (expectedRoundType && round.roundType !== expectedRoundType) {
        continue;
      }
      
      const question = round.questions.find(q => q.id === questionId);
      if (question) {
        questionData = question;
        targetRound = round;
        targetRoundIndex = roundIndex;
        break; // Found it, stop searching
      }
    }

    if (!questionData || !targetRound) {
      console.error('Question not found:', {
        questionId,
        expectedRoundType,
        availableQuestions: session.rounds.map(r => ({
          roundType: r.roundType,
          questionIds: r.questions.map(q => q.id)
        }))
      });
      return res.status(404).json({
        success: false,
        message: 'Question not found in this session'
      });
    }

    // Verify the question actually exists in the target round
    const questionExistsInRound = targetRound.questions.some(q => q.id === questionId);
    if (!questionExistsInRound) {
      return res.status(404).json({
        success: false,
        message: 'Question not found in the specified round'
      });
    }

    const existingAnswer = targetRound.answers.find(
      a => a.questionId === questionId
    );

    if (existingAnswer) {
      console.warn('Question already answered:', {
        questionId,
        roundType: targetRound.roundType,
        answeredAt: existingAnswer.submittedAt,
        allAnswersInRound: targetRound.answers.map(a => ({
          questionId: a.questionId,
          submittedAt: a.submittedAt
        }))
      });
      return res.status(400).json({
        success: false,
        message: 'This question has already been answered',
        data: {
          questionId,
          roundType: targetRound.roundType,
          answeredAt: existingAnswer.submittedAt
        }
      });
    }

    // Evaluate answer using Gemini
    let evaluation = null;
    try {
      evaluation = await evaluateAnswer(questionData, answerText);
    } catch (error) {
      console.error('Error evaluating answer:', error);
      // Continue without evaluation if Gemini fails
      evaluation = {
        score: 0,
        feedbackText: 'Evaluation temporarily unavailable. Your answer has been saved.',
        strengths: [],
        weaknesses: [],
        improvementTips: []
      };
    }

    // Save answer with time tracking
    const now = new Date();
    targetRound.answers.push({
      questionId,
      answerText,
      startedAt: timeSpentSeconds ? new Date(now.getTime() - (timeSpentSeconds * 1000)) : now,
      submittedAt: now,
      timeSpentSeconds: timeSpentSeconds || 0,
      evaluation
    });

    await session.save();

    // Check if there are more questions
    let nextQuestionAvailable = false;
    for (const round of session.rounds) {
      for (const question of round.questions) {
        const answered = round.answers.some(
          answer => answer.questionId === question.id
        );
        if (!answered) {
          nextQuestionAvailable = true;
          break;
        }
      }
      if (nextQuestionAvailable) break;
    }

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        evaluation: {
          score: evaluation.score,
          feedbackText: evaluation.feedbackText,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          improvementTips: evaluation.improvementTips
        },
        nextQuestionAvailable
      }
    });
  } catch (error) {
    next(error);
  }
};

const completeInterview = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    // For GET requests (summary), forceComplete is not needed
    // For POST requests (complete), get forceComplete from body
    const forceComplete = req.method === 'GET' ? true : (req.body?.forceComplete || false);
    const userId = req.user._id;

    const session = await InterviewSession.findById(sessionId)
      .populate('roleProfileId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    // Verify ownership
    if (session.studentId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this session'
      });
    }

    // If already completed, just return the existing summary data
    if (session.status === 'completed') {
      // Recalculate to return fresh data
      return await calculateAndReturnSummary(session, res);
    }

    // Calculate and return summary
    return await calculateAndReturnSummary(session, res, forceComplete);
  } catch (error) {
    next(error);
  }
};

const buildSessionSummary = (session) => {
  // Calculate overall performance (including partial completion)
  let totalScore = 0;
  let scoreEntries = 0;
  let answeredCount = 0;
  let totalQuestions = 0;
  let totalTimeSpentSeconds = 0;
  let averageTimePerQuestion = 0;
  const roundWisePerformance = [];

  const rounds = session.rounds || [];

  for (const round of rounds) {
    let roundScore = 0;
    let roundAnswered = 0;
    let roundTimeSpent = 0;
    totalQuestions += round.questions.length;

    for (const answer of round.answers) {
      if (answer.evaluation && answer.evaluation.score !== undefined) {
        roundScore += answer.evaluation.score;
        totalScore += answer.evaluation.score;
        roundAnswered++;
        answeredCount++;
        scoreEntries++;
      }
      if (answer.timeSpentSeconds) {
        roundTimeSpent += answer.timeSpentSeconds;
        totalTimeSpentSeconds += answer.timeSpentSeconds;
      }
    }

    const avgRoundScore = roundAnswered > 0 ? roundScore / roundAnswered : 0;
    const avgRoundTime = roundAnswered > 0 ? roundTimeSpent / roundAnswered : 0;

    roundWisePerformance.push({
      roundType: round.roundType,
      questionsAnswered: roundAnswered,
      totalQuestions: round.questions.length,
      averageScore: Math.round(avgRoundScore * 10) / 10,
      completionPercentage: round.questions.length > 0 
        ? Math.round((roundAnswered / round.questions.length) * 100) 
        : 0,
      totalTimeSpentSeconds: roundTimeSpent,
      averageTimePerQuestionSeconds: Math.round(avgRoundTime)
    });
  }

  const overallScore = scoreEntries > 0 ? totalScore / scoreEntries : 0;
  const completionPercentage = totalQuestions > 0 
    ? Math.round((answeredCount / totalQuestions) * 100) 
    : 0;
  averageTimePerQuestion = answeredCount > 0 ? totalTimeSpentSeconds / answeredCount : 0;
  const totalInterviewTimeSeconds = Math.floor((new Date() - session.createdAt) / 1000);

  // Check if all questions are answered
  const allAnswered = answeredCount === totalQuestions && totalQuestions > 0;

  // Calculate hiring threshold (typically 7/10 for most roles, 8/10 for senior)
  const hiringThreshold = 7.0;
  const isHireable = overallScore >= hiringThreshold;
  
  // Generate detailed report summary
  const allStrengths = [];
  const allWeaknesses = [];
  const allImprovementTips = [];
  const allFeedback = [];
  
  for (const round of rounds) {
    for (const answer of round.answers) {
      if (answer.evaluation) {
        if (answer.evaluation.strengths) {
          allStrengths.push(...answer.evaluation.strengths);
        }
        if (answer.evaluation.weaknesses) {
          allWeaknesses.push(...answer.evaluation.weaknesses);
        }
        if (answer.evaluation.improvementTips) {
          allImprovementTips.push(...answer.evaluation.improvementTips);
        }
        if (answer.evaluation.feedbackText) {
          allFeedback.push({
            roundType: round.roundType,
            feedback: answer.evaluation.feedbackText,
            score: answer.evaluation.score
          });
        }
      }
    }
  }
  
  // Remove duplicates and get top items
  const uniqueStrengths = [...new Set(allStrengths)].slice(0, 10);
  const uniqueWeaknesses = [...new Set(allWeaknesses)].slice(0, 10);
  const uniqueImprovementTips = [...new Set(allImprovementTips)].slice(0, 10);
  
  // Calculate time statistics
  const estimatedTimeSeconds = rounds.reduce((total, round) => {
    return total + round.questions.reduce((roundTotal, q) => {
      return roundTotal + (q.timeMinutes || 5) * 60;
    }, 0);
  }, 0);
  
  const timeEfficiency = estimatedTimeSeconds > 0 
    ? Math.round((totalTimeSpentSeconds / estimatedTimeSeconds) * 100) 
    : 100;

  const summary = {
    sessionId: session._id,
    mode: session.mode,
    roleProfile: session.roleProfileId ? {
      id: session.roleProfileId._id,
      name: session.roleProfileId.roleName,
      company: session.roleProfileId.companyName || ''
    } : null,
    overallScore: Math.round(overallScore * 10) / 10,
    totalQuestions,
    questionsAnswered: answeredCount,
    unansweredQuestions: totalQuestions - answeredCount,
    completionPercentage,
    isComplete: allAnswered,
    
    // Time statistics
    totalTimeSpentSeconds: Math.round(totalTimeSpentSeconds),
    averageTimePerQuestionSeconds: Math.round(averageTimePerQuestion),
    totalInterviewTimeSeconds,
    estimatedTimeSeconds,
    timeEfficiency,
    
    // Hiring assessment
    hiringThreshold,
    isHireable,
    scoreGap: Math.max(0, hiringThreshold - overallScore),
    hiringRecommendation: isHireable 
      ? 'You meet the hiring threshold! Continue improving to strengthen your profile.'
      : `You need to improve your score by ${(hiringThreshold - overallScore).toFixed(1)} points to meet the hiring threshold.`,
    
    // Detailed report
    overallStrengths: uniqueStrengths,
    overallWeaknesses: uniqueWeaknesses,
    overallImprovementTips: uniqueImprovementTips,
    detailedFeedback: allFeedback,
    
    roundWisePerformance,
    startedAt: session.createdAt,
    completedAt: session.updatedAt || session.createdAt
  };

  return {
    summary,
    meta: {
      allAnswered,
      totalQuestions,
      answeredCount
    }
  };
};

// Helper function to calculate and return summary
const calculateAndReturnSummary = async (session, res, forceComplete = false) => {
  const { summary, meta } = buildSessionSummary(session);

  // Update session status if not already completed
  const wasAlreadyCompleted = session.status === 'completed';
  if (!wasAlreadyCompleted) {
    session.status = 'completed';
    await session.save();
  }

  res.json({
    success: true,
    message: wasAlreadyCompleted 
      ? 'Interview summary retrieved' 
      : (meta.allAnswered 
        ? 'Interview completed successfully' 
        : 'Interview completed with partial answers'),
    data: summary
  });
};

const getUserSessions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);

    const sessions = await InterviewSession.find({ studentId: userId })
      .populate('roleProfileId', 'roleName companyName')
      .sort({ createdAt: -1 })
      .limit(limit);

    const formattedSessions = sessions.map((session) => {
      const rounds = session.rounds || [];

      const totalQuestions = rounds.reduce(
        (sum, round) => sum + round.questions.length,
        0
      );
      const answeredQuestions = rounds.reduce(
        (sum, round) => sum + round.answers.length,
        0
      );

      let totalScore = 0;
      let scoreEntries = 0;
      let latestFeedback = null;
      let latestFeedbackDate = null;

      rounds.forEach((round) => {
        round.answers.forEach((answer) => {
          if (answer.evaluation && typeof answer.evaluation.score === 'number') {
            totalScore += answer.evaluation.score;
            scoreEntries++;
          }

          const submittedAt = answer.submittedAt ? new Date(answer.submittedAt) : null;
          if (
            answer.evaluation?.feedbackText &&
            (!latestFeedbackDate || (submittedAt && submittedAt > latestFeedbackDate))
          ) {
            latestFeedback = answer.evaluation.feedbackText;
            latestFeedbackDate = submittedAt;
          }
        });
      });

      const averageScore =
        scoreEntries > 0 ? Math.round((totalScore / scoreEntries) * 10) / 10 : null;

      const roundSnapshots = rounds.map((round) => ({
        roundType: round.roundType,
        totalQuestions: round.questions.length,
        answeredQuestions: round.answers.length,
        completionPercentage:
          round.questions.length > 0
            ? Math.round((round.answers.length / round.questions.length) * 100)
            : 0,
      }));

      return {
        sessionId: session._id,
        roleName: session.roleProfileId?.roleName || 'Custom Interview',
        company: session.roleProfileId?.companyName || '',
        mode: session.mode,
        status: session.status,
        proctored: session.proctored,
        startedAt: session.createdAt,
        updatedAt: session.updatedAt,
        totalQuestions,
        answeredQuestions,
        completionPercentage:
          totalQuestions > 0
            ? Math.round((answeredQuestions / totalQuestions) * 100)
            : 0,
        averageScore,
        latestFeedback,
        rounds: roundSnapshots,
      };
    });

    res.json({
      success: true,
      data: {
        sessions: formattedSessions,
        count: formattedSessions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

const downloadSessionReport = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await InterviewSession.findById(sessionId).populate('roleProfileId');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found',
      });
    }

    if (session.studentId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this session',
      });
    }

    const { summary } = buildSessionSummary(session);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=mock-interview-${sessionId}.pdf`
    );

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(20).text('Mock Interview Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Session ID: ${sessionId}`);
    doc.text(
      `Role: ${summary.roleProfile?.name || session.roleProfileId?.roleName || 'N/A'}`
    );
    doc.text(`Mode: ${summary.mode}`);
    doc.text(`Status: ${session.status}`);
    doc.text(`Started: ${new Date(summary.startedAt).toLocaleString()}`);
    doc.text(`Completed: ${new Date(summary.completedAt).toLocaleString()}`);
    doc.moveDown();

    doc
      .fontSize(16)
      .text('Performance Overview', { underline: true, continued: false });
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Overall Score: ${summary.overallScore}/10`);
    doc.text(
      `Completion: ${summary.questionsAnswered}/${summary.totalQuestions} (${summary.completionPercentage}%)`
    );
    doc.text(
      `Hiring Recommendation: ${
        summary.isHireable ? 'Hire-ready' : 'Needs improvement'
      }`
    );
    doc.text(
      `Recommendation Detail: ${summary.hiringRecommendation.replace(/\n/g, ' ')}`
    );
    doc.moveDown();

    doc.fontSize(14).text('Round-wise Performance', { underline: true });
    doc.moveDown(0.5);
    summary.roundWisePerformance.forEach((round) => {
      doc
        .fontSize(12)
        .text(
          `${round.roundType.toUpperCase()}: Score ${round.averageScore}/10 | Completion ${round.completionPercentage}%`
        );
      doc.text(
        `Answered: ${round.questionsAnswered}/${round.totalQuestions} | Time: ${
          round.totalTimeSpentSeconds || 0
        }s`
      );
      doc.moveDown(0.3);
    });
    doc.moveDown();

    if (summary.overallStrengths.length) {
      doc.fontSize(14).text('Key Strengths', { underline: true });
      summary.overallStrengths.forEach((strength, idx) => {
        doc.fontSize(12).text(`${idx + 1}. ${strength}`);
      });
      doc.moveDown();
    }

    if (summary.overallWeaknesses.length) {
      doc.fontSize(14).text('Areas to Improve', { underline: true });
      summary.overallWeaknesses.forEach((weakness, idx) => {
        doc.fontSize(12).text(`${idx + 1}. ${weakness}`);
      });
      doc.moveDown();
    }

    if (summary.overallImprovementTips.length) {
      doc.fontSize(14).text('Actionable Tips', { underline: true });
      summary.overallImprovementTips.forEach((tip, idx) => {
        doc.fontSize(12).text(`${idx + 1}. ${tip}`);
      });
      doc.moveDown();
    }

    if (summary.detailedFeedback.length) {
      doc.fontSize(14).text('Detailed Feedback', { underline: true });
      summary.detailedFeedback.forEach((feedback, idx) => {
        doc
          .fontSize(12)
          .text(
            `${idx + 1}. ${feedback.roundType.toUpperCase()} - Score ${feedback.score}/10`
          );
        doc.fontSize(11).text(feedback.feedback);
        doc.moveDown(0.5);
      });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startInterview,
  getNextQuestion,
  submitAnswer,
  completeInterview,
  getUserSessions,
  downloadSessionReport
};


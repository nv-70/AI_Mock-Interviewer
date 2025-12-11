'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Loader from '@/components/Loader';
import { interviewAPI } from '@/lib/api';

const ROUND_LABELS = {
  technical: 'Technical Round',
  hr: 'HR Round',
  manager: 'Manager Round',
  cto: 'CTO Round',
  case: 'Case Study Round',
};

const formatTime = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function InterviewSummaryPage() {
  const params = useParams();
  const sessionId = params.sessionId;
  const router = useRouter();
  
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSummary();
  }, [sessionId]);

  const fetchSummary = async () => {
    try {
      // Try to get summary first (works for both completed and active sessions)
      let response;
      try {
        response = await interviewAPI.getSummary(sessionId);
      } catch (summaryErr) {
        // If summary endpoint fails, try complete endpoint
        response = await interviewAPI.complete(sessionId, true);
      }
      
      if (response.success) {
        setSummary(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <Loader size="lg" />
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Detailed Interview Report</h1>

        {/* Overall Performance Card */}
        <Card className="mb-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Overall Performance</h2>
            <div className={`text-6xl font-bold mb-4 ${
              summary.overallScore >= summary.hiringThreshold 
                ? 'text-green-600' 
                : summary.overallScore >= summary.hiringThreshold - 1
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}>
              {summary.overallScore}/10
            </div>
            
            {/* Hiring Status */}
            <div className={`mb-4 p-4 rounded-lg ${
              summary.isHireable 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <p className={`font-semibold text-lg ${
                summary.isHireable ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {summary.isHireable ? '✓' : '⚠'} {summary.hiringRecommendation}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Hiring Threshold: {summary.hiringThreshold}/10
                {!summary.isHireable && (
                  <span className="ml-2">
                    (Need {summary.scoreGap.toFixed(1)} more points)
                  </span>
                )}
              </p>
            </div>

            {/* Completion Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Questions Answered</p>
                <p className="text-xl font-semibold">
                  {summary.questionsAnswered}/{summary.totalQuestions}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completion</p>
                <p className="text-xl font-semibold">{summary.completionPercentage}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-xl font-semibold">
                  {summary.isComplete ? 'Complete' : 'Partial'}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-primary-600 h-3 rounded-full transition-all" 
                style={{ width: `${summary.completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </Card>

        {/* Time Analysis */}
        {summary.totalTimeSpentSeconds !== undefined && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Time Analysis</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-3">Time Spent</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Time:</span>
                    <span className="font-semibold">{formatTime(summary.totalTimeSpentSeconds)}</span>
                  </div>
                  {summary.estimatedTimeSeconds && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estimated Time:</span>
                        <span className="font-semibold">{formatTime(summary.estimatedTimeSeconds)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Efficiency:</span>
                        <span className={`font-semibold ${
                          summary.timeEfficiency <= 80 ? 'text-green-600' :
                          summary.timeEfficiency <= 120 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {summary.timeEfficiency}%
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        {summary.timeEfficiency <= 80 && '✓ You completed the interview efficiently!'}
                        {summary.timeEfficiency > 80 && summary.timeEfficiency <= 120 && 'You used a reasonable amount of time.'}
                        {summary.timeEfficiency > 120 && '⚠ You took longer than estimated. Consider practicing time management.'}
                      </div>
                    </>
                  )}
                  {summary.averageTimePerQuestionSeconds && (
                    <div className="flex justify-between mt-3 pt-3 border-t">
                      <span className="text-gray-600">Avg per Question:</span>
                      <span className="font-semibold">{formatTime(summary.averageTimePerQuestionSeconds)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-3">Session Duration</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span className="font-semibold text-sm">
                      {new Date(summary.startedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-semibold text-sm">
                      {new Date(summary.completedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t">
                    <span className="text-gray-600">Total Duration:</span>
                    <span className="font-semibold">
                      {formatTime(summary.totalInterviewTimeSeconds)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Strengths */}
        {summary.overallStrengths && summary.overallStrengths.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-green-700">✓ Key Strengths</h2>
            <ul className="space-y-2">
              {summary.overallStrengths.map((strength, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Weaknesses */}
        {summary.overallWeaknesses && summary.overallWeaknesses.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-red-700">⚠ Areas for Improvement</h2>
            <ul className="space-y-2">
              {summary.overallWeaknesses.map((weakness, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span className="text-gray-700">{weakness}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Improvement Tips & Suggestions */}
        {summary.overallImprovementTips && summary.overallImprovementTips.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">💡 Improvement Tips & Suggestions</h2>
            <ul className="space-y-3">
              {summary.overallImprovementTips.map((tip, idx) => (
                <li key={idx} className="flex items-start p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-600 mr-2 font-bold">{idx + 1}.</span>
                  <span className="text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Round-wise Performance */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Round-wise Performance</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {summary.roundWisePerformance?.map((round, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">
                    {ROUND_LABELS[round.roundType] || round.roundType}
                  </h3>
                  <span className={`text-2xl font-bold ${
                    round.averageScore >= 7 ? 'text-green-600' :
                    round.averageScore >= 5 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {round.averageScore}/10
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    {round.questionsAnswered} of {round.totalQuestions} questions answered
                  </p>
                  <p className="text-gray-600">
                    Completion: {round.completionPercentage}%
                  </p>
                  {round.totalTimeSpentSeconds !== undefined && (
                    <p className="text-gray-600">
                      Time: {formatTime(round.totalTimeSpentSeconds)}
                      {round.averageTimePerQuestionSeconds !== undefined && (
                        <span className="ml-2">
                          (Avg: {formatTime(round.averageTimePerQuestionSeconds)})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Detailed Feedback Summary */}
        {summary.detailedFeedback && summary.detailedFeedback.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Detailed Feedback Summary</h2>
            <div className="space-y-4">
              {summary.detailedFeedback.map((feedback, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary-500">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-primary-700">
                      {ROUND_LABELS[feedback.roundType] || feedback.roundType}
                    </span>
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${
                      feedback.score >= 7 ? 'bg-green-100 text-green-800' :
                      feedback.score >= 5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {feedback.score}/10
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{feedback.feedback}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Executive Summary */}
        <Card className="mb-6 bg-gradient-to-r from-primary-50 to-blue-50">
          <h2 className="text-xl font-semibold mb-4">Executive Summary</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              You completed <strong>{summary.questionsAnswered} out of {summary.totalQuestions}</strong> questions 
              with an overall score of <strong>{summary.overallScore}/10</strong>.
            </p>
            {summary.isHireable ? (
              <p className="text-green-700 font-medium">
                ✓ Congratulations! Your performance meets the hiring threshold of {summary.hiringThreshold}/10. 
                Continue practicing to further strengthen your interview skills.
              </p>
            ) : (
              <p className="text-yellow-700 font-medium">
                You're close! To meet the hiring threshold of {summary.hiringThreshold}/10, 
                you need to improve your score by {summary.scoreGap.toFixed(1)} points. 
                Focus on the areas for improvement listed above.
              </p>
            )}
            {summary.overallStrengths && summary.overallStrengths.length > 0 && (
              <p>
                Your key strengths include: <strong>{summary.overallStrengths.slice(0, 3).join(', ')}</strong>.
              </p>
            )}
            {summary.overallWeaknesses && summary.overallWeaknesses.length > 0 && (
              <p>
                Focus on improving: <strong>{summary.overallWeaknesses.slice(0, 3).join(', ')}</strong>.
              </p>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <Card>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <p className="text-sm text-gray-600">Interview completed on</p>
              <p className="font-medium">
                {new Date(summary.completedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => router.push('/interview/start')}
              >
                Start New Interview
              </Button>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

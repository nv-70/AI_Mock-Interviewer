'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Loader from '@/components/Loader';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { interviewAPI } from '@/lib/api';

const statusClasses = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800'
};

const formatMode = (mode) => {
  switch (mode) {
    case 'resume':
      return 'Resume-focused';
    case 'role':
      return 'Role-focused';
    case 'mixed':
      return 'Hybrid';
    default:
      return 'General';
  }
};

const formatDate = (date) => {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleString();
};

export default function InterviewHistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await interviewAPI.getSessions();
      if (response.success) {
        setSessions(response.data?.sessions || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load interview history.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (sessionId) => {
    try {
      setDownloadingId(sessionId);
      const response = await interviewAPI.downloadReport(sessionId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mock-interview-${sessionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to download report right now.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm uppercase tracking-wide text-primary-600 font-semibold">Interview History</p>
            <h1 className="text-3xl font-bold">Past Interviews & Reports</h1>
            <p className="text-gray-600 mt-1">Review every mock interview, revisit summaries, and download full reports.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={fetchSessions} disabled={loading}>
              Refresh
            </Button>
            <Button onClick={() => router.push('/interview/start')}>
              Start New Interview
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <Card>
            <div className="py-10 flex justify-center">
              <Loader />
            </div>
          </Card>
        ) : sessions.length === 0 ? (
          <Card>
            <div className="text-center py-10 text-gray-600">
              <p>No interviews yet. Take your first mock interview to build history.</p>
              <Button className="mt-4" onClick={() => router.push('/interview/start')}>
                Start Interview
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.sessionId} className="bg-gray-50 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <p className="text-lg font-semibold">
                        {session.roleName}
                        {session.company && <span className="text-gray-500 text-sm ml-2">· {session.company}</span>}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses[session.status] || 'bg-gray-100 text-gray-700'}`}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${session.proctored ? 'bg-purple-100 text-purple-800' : 'bg-gray-200 text-gray-700'}`}>
                        {session.proctored ? 'Proctored' : 'Standard'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatMode(session.mode)} · Started {formatDate(session.startedAt)}
                    </p>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <Metric label="Score" value={session.averageScore ?? 'N/A'} />
                      <Metric label="Completion" value={`${session.completionPercentage}%`} />
                      <Metric label="Answered" value={`${session.answeredQuestions}/${session.totalQuestions}`} />
                      <Metric label="Latest Feedback" value={session.latestFeedback || '—'} truncate />
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-white rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-primary-600 transition-all"
                          style={{ width: `${session.completionPercentage}%` }}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                        {session.rounds?.map((round) => (
                          <span key={round.roundType} className="px-2 py-1 bg-white rounded-full border border-gray-200">
                            {round.roundType.toUpperCase()}: {round.completionPercentage}%
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:w-56 gap-2">
                    <Link href={`/interview/session/${session.sessionId}/summary`} className="w-full">
                      <Button className="w-full">View Detailed Report</Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={downloadingId === session.sessionId}
                      onClick={() => handleDownloadReport(session.sessionId)}
                    >
                      {downloadingId === session.sessionId ? 'Preparing PDF...' : 'Download Report'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function Metric({ label, value, truncate = false }) {
  return (
    <div>
      <p className="text-gray-500 text-xs uppercase">{label}</p>
      <p className={`font-semibold ${truncate ? 'truncate max-w-[160px]' : ''}`} title={truncate ? value : undefined}>
        {value}
      </p>
    </div>
  );
}


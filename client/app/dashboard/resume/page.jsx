'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Loader from '@/components/Loader';
import Link from 'next/link';
import { resumeAPI } from '@/lib/api';

export default function ResumeInsightsPage() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await resumeAPI.getInsights();
      if (response.success && response.data?.parsed) {
        setInsights(response.data.parsed);
      } else {
        setInsights(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load resume insights.');
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm uppercase tracking-wide text-primary-600 font-semibold">Resume ATS Center</p>
            <h1 className="text-3xl font-bold">Resume Insights</h1>
            <p className="text-gray-600 mt-1">Monitor ATS score, strengths, improvements, and targeting alignment.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={fetchInsights} disabled={loading}>
              Refresh Insights
            </Button>
            <Link href="/resume/upload">
              <Button>Upload / Update Resume</Button>
            </Link>
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
        ) : !insights ? (
          <Card>
            <div className="text-center py-10 text-gray-600">
              <p>No resume parsed yet. Upload a resume to generate ATS analytics.</p>
              <Link href="/resume/upload" className="inline-block mt-4">
                <Button>Upload Resume</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <p className="text-sm text-gray-500">Overall ATS Score</p>
                <p className="text-6xl font-bold text-primary-600 my-3">
                  {insights.atsScore?.overall ?? 0}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Higher score means better ATS friendliness and recruiter visibility.
                </p>
                <div className="space-y-3">
                  {insights.atsScore?.breakdown && Object.entries(insights.atsScore.breakdown).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs uppercase text-gray-500">
                        <span>{key}</span>
                        <span>{Math.round(value)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-primary-500"
                          style={{ width: `${Math.min(value, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-2">Target Fields</p>
                  <div className="flex flex-wrap gap-2">
                    {insights.targetFields?.length ? insights.targetFields.map((field) => (
                      <span key={field.field} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
                        {field.field} · {field.score}%
                      </span>
                    )) : <span className="text-gray-500 text-sm">No clear targeting detected.</span>}
                  </div>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-2">ATS Strengths</p>
                  <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                    {(insights.atsScore?.strengths || []).slice(0, 4).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                    {!(insights.atsScore?.strengths || []).length && <li>No strengths detected yet.</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-2">Improvement Ideas</p>
                  <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                    {(insights.atsScore?.improvements || []).slice(0, 4).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                    {!(insights.atsScore?.improvements || []).length && <li>No suggestions available.</li>}
                  </ul>
                </div>
              </Card>

              <Card className="space-y-5">
                <SectionList title="Key Skills" items={insights.skills?.slice(0, 10)} emptyLabel="No skills detected" />
                <SectionList title="Education Highlights" items={insights.education?.slice(0, 3)} emptyLabel="Add academic details" />
                <SectionList
                  title="Projects / Experience"
                  items={(insights.projects?.slice(0, 2) || []).concat(insights.experience?.entries?.slice(0, 2) || [])}
                  emptyLabel="Mention impact projects"
                />
                <SectionList title="Achievements" items={insights.achievements?.slice(0, 3)} emptyLabel="Add awards or recognitions" />
                <SectionList title="Certifications" items={insights.certifications?.slice(0, 3)} emptyLabel="List certification highlights" />
              </Card>
            </div>

            <Card>
              <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-3">Keyword Cloud</p>
              {insights.keywords?.length ? (
                <div className="flex flex-wrap gap-2">
                  {insights.keywords.map((keyword) => (
                    <span key={keyword} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No keywords extracted.</p>
              )}
            </Card>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

function SectionList({ title, items = [], emptyLabel }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{title}</p>
      {items && items.length > 0 ? (
        <ul className="mt-2 text-sm text-gray-700 space-y-1 list-disc list-inside">
          {items.map((item, idx) => (
            <li key={`${title}-${idx}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-400 mt-2">{emptyLabel}</p>
      )}
    </div>
  );
}


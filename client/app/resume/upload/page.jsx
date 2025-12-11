'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Loader from '@/components/Loader';
import { resumeAPI } from '@/lib/api';

export default function ResumeUploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain') {
        if (selectedFile.size <= 5 * 1024 * 1024) {
          setFile(selectedFile);
          setError('');
        } else {
          setError('File size must be less than 5MB');
        }
      } else {
        setError('Only PDF and text files are allowed');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const response = await resumeAPI.upload(file);
      if (response.success) {
        setResult(response.data?.parsed ? response.data : null);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Upload Resume</h1>

        <Card>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resume File (PDF or TXT, max 5MB)
              </label>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={uploading}
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {result?.parsed && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-green-800 text-lg">Resume Parsed Successfully!</h3>
                    <p className="text-sm text-green-700">ATS insights generated. Redirecting to dashboard...</p>
                  </div>
                  <div className="bg-white rounded-lg shadow px-4 py-2 text-center">
                    <p className="text-xs text-gray-500 uppercase">ATS Score</p>
                    <p className="text-2xl font-bold text-green-600">{result.parsed.atsScore?.overall || 0}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-green-800">
                  <div>
                    <p className="font-semibold">Top Target Fields</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {result.parsed.targetFields?.length ? result.parsed.targetFields.map((field) => (
                        <span key={field.field} className="px-2 py-1 bg-white text-green-700 rounded-full text-xs font-medium">
                          {field.field} · {field.score}%
                        </span>
                      )) : <span className="text-green-700">—</span>}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">Strength Highlights</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {(result.parsed.atsScore?.strengths || []).slice(0, 2).map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? <Loader size="sm" /> : 'Upload Resume'}
            </Button>
          </form>
        </Card>
      </div>
    </ProtectedRoute>
  );
}


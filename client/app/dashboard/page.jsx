'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Link from 'next/link';

const resourceCards = [
  {
    title: 'Resume ATS Center',
    description: 'Upload resumes, view ATS score, and see strengths & improvement ideas tailored to your profile.',
    href: '/dashboard/resume',
    action: 'Open Resume Insights'
  },
  {
    title: 'Interview History',
    description: 'Browse every mock interview you have taken, download reports, and plan your next practice session.',
    href: '/dashboard/interviews',
    action: 'View Past Interviews'
  }
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            {user && (
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {user.name}</p>
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">Role:</span> {user.role}</p>
                <p><span className="font-medium">Education:</span> {user.education?.degree} from {user.education?.college || 'N/A'}</p>
                <p><span className="font-medium">Experience:</span> {user.experienceLevel} ({user.experienceYears} years)</p>
                {user.domains && user.domains.length > 0 && (
                  <p><span className="font-medium">Domains:</span> {user.domains.join(', ')}</p>
                )}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/resume/upload" className="block">
                <Button className="w-full">Upload Resume</Button>
              </Link>
              <Link href="/interview/start" className="block">
                <Button className="w-full">Start Interview</Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {resourceCards.map((card) => (
            <Card key={card.title} className="flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                <p className="text-gray-600 mb-4">{card.description}</p>
              </div>
              <Link href={card.href} className="block mt-auto">
                <Button className="w-full">{card.action}</Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}


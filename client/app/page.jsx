'use client';

import Link from 'next/link';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleStartPractice = () => {
    if (isAuthenticated) {
      router.push('/interview/start');
    } else {
      router.push('/register');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          AI Powered Mock Interview Practice
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Practice interviews with AI-generated questions across multiple rounds.
          Get instant feedback and improve your interview skills.
        </p>
        
        <div className="flex justify-center space-x-4 mb-16">
          {isAuthenticated ? (
            <Button onClick={handleStartPractice} size="lg" className="px-8 py-3 text-lg">
              Start Practice
            </Button>
          ) : (
            <>
              <Link href="/login">
                <Button variant="secondary" className="px-8 py-3 text-lg">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="px-8 py-3 text-lg">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Multiple Rounds</h3>
            <p className="text-gray-600">
              Practice Technical, HR, Manager, CTO, and Case interview rounds
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
            <p className="text-gray-600">
              Get personalized questions based on your resume and role
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Instant Feedback</h3>
            <p className="text-gray-600">
              Receive detailed evaluation and improvement suggestions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


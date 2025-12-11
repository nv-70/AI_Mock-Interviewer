'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Loader from '@/components/Loader';
import Link from 'next/link';

const DEGREES = ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'B.E', 'M.E', 'B.Com', 'M.Com', 'MBA', 'Other'];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    education: {
      degree: 'B.Tech',
      college: '',
      passingYear: new Date().getFullYear(),
    },
    experienceLevel: 'fresher',
    experienceYears: 0,
    domains: '',
    preferredRoles: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.education.college) newErrors.college = 'College is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('education.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        education: { ...formData.education, [field]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const submitData = {
      ...formData,
      domains: formData.domains.split(',').map(d => d.trim()).filter(Boolean),
      preferredRoles: formData.preferredRoles.split(',').map(r => r.trim()).filter(Boolean),
      experienceYears: parseInt(formData.experienceYears) || 0,
      education: {
        ...formData.education,
        passingYear: parseInt(formData.education.passingYear),
      },
    };
    delete submitData.confirmPassword;

    const result = await register(submitData);
    setLoading(false);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setErrors({ general: result.message || 'Registration failed' });
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center mb-6">Register</h2>
        
        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Degree <span className="text-red-500">*</span>
              </label>
              <select
                name="education.degree"
                value={formData.education.degree}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {DEGREES.map(degree => (
                  <option key={degree} value={degree}>{degree}</option>
                ))}
              </select>
            </div>
            <Input
              label="College"
              name="education.college"
              value={formData.education.college}
              onChange={handleChange}
              error={errors.college}
              required
            />
            <Input
              label="Passing Year"
              type="number"
              name="education.passingYear"
              value={formData.education.passingYear}
              onChange={handleChange}
              min="1950"
              max={new Date().getFullYear() + 5}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience Level <span className="text-red-500">*</span>
              </label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="fresher">Fresher</option>
                <option value="experienced">Experienced</option>
              </select>
            </div>
            <Input
              label="Experience Years"
              type="number"
              name="experienceYears"
              value={formData.experienceYears}
              onChange={handleChange}
              min="0"
            />
          </div>

          <Input
            label="Domains (comma-separated)"
            name="domains"
            value={formData.domains}
            onChange={handleChange}
            placeholder="e.g., Java, MERN, React"
          />
          <Input
            label="Preferred Roles (comma-separated)"
            name="preferredRoles"
            value={formData.preferredRoles}
            onChange={handleChange}
            placeholder="e.g., Software Developer, Full Stack Developer"
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? <Loader size="sm" /> : 'Register'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 hover:underline">
            Login here
          </Link>
        </p>
      </Card>
    </div>
  );
}


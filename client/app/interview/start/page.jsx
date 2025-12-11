'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Loader from '@/components/Loader';
import { rolesAPI, interviewAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function StartInterviewPage() {
  const [mode, setMode] = useState('role');
  const [roleProfileId, setRoleProfileId] = useState('');
  const [resumeId, setResumeId] = useState('');
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [showCustomization, setShowCustomization] = useState(false);
  const [proctored, setProctored] = useState('proctored');
  
  // Customization state
  const [enabledRounds, setEnabledRounds] = useState({
    technical: true,
    hr: true,
    manager: true,
    cto: true,
    case: true
  });
  const [questionCounts, setQuestionCounts] = useState({});
  const [difficulty, setDifficulty] = useState('full-time-fresher');
  
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchRoles();
  }, []);

  // Default interview structures based on Indian system
  const getDefaultStructures = (selectedDifficulty) => {
    const defaults = {
      '2-month-summer-intern': {
        technical: 3,
        hr: 2,
        manager: 0,
        cto: 0,
        case: 1
      },
      '6-month-intern': {
        technical: 4,
        hr: 3,
        manager: 1,
        cto: 0,
        case: 2
      },
      'full-time-fresher': {
        technical: 5,
        hr: 4,
        manager: 2,
        cto: 0,
        case: 2
      },
      'experience-1-year': {
        technical: 6,
        hr: 4,
        manager: 3,
        cto: 1,
        case: 3
      },
      'experience-2-years': {
        technical: 7,
        hr: 4,
        manager: 3,
        cto: 2,
        case: 3
      },
      'experience-3-years': {
        technical: 8,
        hr: 4,
        manager: 4,
        cto: 2,
        case: 4
      },
      'experience-4-years': {
        technical: 8,
        hr: 4,
        manager: 4,
        cto: 3,
        case: 4
      },
      'experience-5-plus-years': {
        technical: 8,
        hr: 4,
        manager: 4,
        cto: 4,
        case: 5
      }
    };
    return defaults[selectedDifficulty] || defaults['full-time-fresher'];
  };

  const fetchRoles = async () => {
    try {
      const response = await rolesAPI.getAll();
      if (response.success && response.data) {
        const rolesList = response.data.roles || response.data || [];
        setRoles(rolesList);
        if (rolesList.length > 0) {
          const firstRole = rolesList[0];
          setRoleProfileId(firstRole._id);
          setSelectedRole(firstRole);
          // Initialize with default structures based on difficulty
          const defaultStructs = getDefaultStructures(difficulty);
          setQuestionCounts(defaultStructs);
          // Set enabled rounds based on defaults (non-zero counts)
          const enabled = {};
          Object.keys(defaultStructs).forEach(roundType => {
            enabled[roundType] = defaultStructs[roundType] > 0;
          });
          setEnabledRounds(enabled);
        } else {
          setError('No roles available. Please seed the database first.');
        }
      } else {
        setError('Failed to load roles. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError(err.response?.data?.message || 'Failed to load roles. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e) => {
    const roleId = e.target.value;
    setRoleProfileId(roleId);
    const role = roles.find(r => r._id === roleId);
    setSelectedRole(role);
    
    // Update question counts based on default structures for selected difficulty
    const defaultStructs = getDefaultStructures(difficulty);
    setQuestionCounts(defaultStructs);
    // Update enabled rounds
    const enabled = {};
    Object.keys(defaultStructs).forEach(roundType => {
      enabled[roundType] = defaultStructs[roundType] > 0;
    });
    setEnabledRounds(enabled);
  };

  const handleDifficultyChange = (e) => {
    const newDifficulty = e.target.value;
    setDifficulty(newDifficulty);
    
    // Update question counts and enabled rounds based on new difficulty
    const defaultStructs = getDefaultStructures(newDifficulty);
    setQuestionCounts(defaultStructs);
    const enabled = {};
    Object.keys(defaultStructs).forEach(roundType => {
      enabled[roundType] = defaultStructs[roundType] > 0;
    });
    setEnabledRounds(enabled);
  };

  const handleRoundToggle = (roundType) => {
    setEnabledRounds(prev => ({
      ...prev,
      [roundType]: !prev[roundType]
    }));
  };

  const handleQuestionCountChange = (roundType, value) => {
    const count = Math.max(1, Math.min(20, parseInt(value) || 1));
    setQuestionCounts(prev => ({
      ...prev,
      [roundType]: count
    }));
  };

  const handleStart = async (e) => {
    e.preventDefault();
    if (!roleProfileId) {
      setError('Please select a role');
      return;
    }

    setStarting(true);
    setError('');

    try {
      // Build enabled rounds array
      const roundsToEnable = Object.keys(enabledRounds).filter(rt => enabledRounds[rt]);
      if (roundsToEnable.length === 0) {
        setError('Please select at least one interview round');
        setStarting(false);
        return;
      }

      const data = {
        mode,
        roleProfileId,
        enabledRounds: roundsToEnable,
        questionCounts,
        difficulty,
        proctored: proctored === 'proctored'
      };
      if (mode === 'resume' || mode === 'mixed') {
        if (user?.resumeId) {
          data.resumeId = user.resumeId;
        } else {
          setError('Please upload a resume first');
          setStarting(false);
          return;
        }
      }

      const response = await interviewAPI.start(data);
      if (response.success) {
        router.push(`/interview/session/${response.data.sessionId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start interview');
    } finally {
      setStarting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Start Interview</h1>

        <Card>
          {loading ? (
            <Loader />
          ) : (
            <form onSubmit={handleStart}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Interview Mode
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="proctor-mode"
                      value="proctored"
                      checked={proctored === 'proctored'}
                      onChange={(e) => setProctored(e.target.value)}
                      className="mr-2"
                    />
                    <span className="font-medium">Proctored (fullscreen enforced, no tab switching)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="proctor-mode"
                      value="non-proctored"
                      checked={proctored === 'non-proctored'}
                      onChange={(e) => setProctored(e.target.value)}
                      className="mr-2"
                    />
                    <span className="font-medium">Non-proctored (standard experience)</span>
                  </label>
                </div>
                {proctored === 'proctored' ? (
                  <p className="mt-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                    You will be asked to stay in fullscreen and cannot switch tabs during the interview.
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">
                    You can switch tabs or exit fullscreen when proctoring is disabled.
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Mode
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mode"
                      value="role"
                      checked={mode === 'role'}
                      onChange={(e) => setMode(e.target.value)}
                      className="mr-2"
                    />
                    Role-based (Questions based on selected role)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mode"
                      value="resume"
                      checked={mode === 'resume'}
                      onChange={(e) => setMode(e.target.value)}
                      className="mr-2"
                    />
                    Resume-based (Questions based on your resume)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mode"
                      value="mixed"
                      checked={mode === 'mixed'}
                      onChange={(e) => setMode(e.target.value)}
                      className="mr-2"
                    />
                    Mixed (Both role and resume)
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Role Profile
                </label>
                <select
                  value={roleProfileId}
                  onChange={handleRoleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select a role...</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.roleName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Interview Customization
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomization(!showCustomization)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {showCustomization ? 'Hide' : 'Show'} Options
                  </button>
                </div>

                {showCustomization && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                    {/* Difficulty Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Technical Round Difficulty
                      </label>
                      <select
                        value={difficulty}
                        onChange={handleDifficultyChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="2-month-summer-intern">2 Month Summer Intern</option>
                        <option value="6-month-intern">6 Month Intern</option>
                        <option value="full-time-fresher">Full Time Fresher</option>
                        <option value="experience-1-year">Experience 1 Year</option>
                        <option value="experience-2-years">Experience 2 Years</option>
                        <option value="experience-3-years">Experience 3 Years</option>
                        <option value="experience-4-years">Experience 4 Years</option>
                        <option value="experience-5-plus-years">Experience 5+ Years</option>
                      </select>
                    </div>

                    {/* Round Selection and Question Counts */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Select Rounds & Question Counts
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const defaultStructs = getDefaultStructures(difficulty);
                            setQuestionCounts(defaultStructs);
                            const enabled = {};
                            Object.keys(defaultStructs).forEach(roundType => {
                              enabled[roundType] = defaultStructs[roundType] > 0;
                            });
                            setEnabledRounds(enabled);
                          }}
                          className="text-xs text-primary-600 hover:text-primary-700 underline"
                        >
                          Reset to Defaults
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Default structure for {difficulty.replace(/-/g, ' ')} is pre-selected. You can customize below.
                      </p>
                      <div className="space-y-3">
                        {['technical', 'hr', 'manager', 'cto', 'case'].map((roundType) => {
                          const roundLabels = {
                            technical: 'Technical Round',
                            hr: 'HR Round',
                            manager: 'Manager Round',
                            cto: 'CTO Round',
                            case: 'Case Study Round'
                          };
                          const defaultStructs = getDefaultStructures(difficulty);
                          const defaultCount = defaultStructs[roundType] || 0;
                          const count = questionCounts[roundType] || defaultCount;

                          return (
                            <div key={roundType} className="flex items-center justify-between p-2 bg-white rounded border">
                              <label className="flex items-center flex-1">
                                <input
                                  type="checkbox"
                                  checked={enabledRounds[roundType]}
                                  onChange={() => handleRoundToggle(roundType)}
                                  className="mr-2"
                                />
                                <span className="text-sm font-medium">{roundLabels[roundType]}</span>
                                {defaultCount > 0 && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    (Default: {defaultCount})
                                  </span>
                                )}
                              </label>
                              {enabledRounds[roundType] && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600">Questions:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={count}
                                    onChange={(e) => handleQuestionCountChange(roundType, e.target.value)}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {mode === 'resume' || mode === 'mixed' ? (
                <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  {user?.resumeId ? (
                    <p className="text-sm text-yellow-800">
                      ✓ Resume found. It will be used for question generation.
                    </p>
                  ) : (
                    <p className="text-sm text-yellow-800">
                      ⚠ No resume uploaded. Please{' '}
                      <a href="/resume/upload" className="underline">
                        upload a resume
                      </a>{' '}
                      first.
                    </p>
                  )}
                </div>
              ) : null}

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={starting || !roleProfileId}
                className="w-full"
              >
                {starting ? <Loader size="sm" /> : 'Start Interview'}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
}


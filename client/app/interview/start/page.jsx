"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Loader from "@/components/Loader";
import { rolesAPI, interviewAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function StartInterviewPage() {
  const [mode, setMode] = useState("role");
  const [roleProfileId, setRoleProfileId] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [showCustomization, setShowCustomization] = useState(false);
  const [proctored, setProctored] = useState("proctored");

  const [enabledRounds, setEnabledRounds] = useState({
    technical: true,
    hr: true,
    manager: true,
    cto: true,
    case: true,
  });

  const [questionCounts, setQuestionCounts] = useState({});
  const [difficulty, setDifficulty] = useState("full-time-fresher");

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchRoles();
  }, []);

  const getDefaultStructures = (selectedDifficulty) => {
    const defaults = {
      "2-month-summer-intern": {
        technical: 3,
        hr: 2,
        manager: 0,
        cto: 0,
        case: 1,
      },
      "6-month-intern": { technical: 4, hr: 3, manager: 1, cto: 0, case: 2 },
      "full-time-fresher": { technical: 5, hr: 4, manager: 2, cto: 0, case: 2 },
      "experience-1-year": { technical: 6, hr: 4, manager: 3, cto: 1, case: 3 },
      "experience-2-years": {
        technical: 7,
        hr: 4,
        manager: 3,
        cto: 2,
        case: 3,
      },
      "experience-3-years": {
        technical: 8,
        hr: 4,
        manager: 4,
        cto: 2,
        case: 4,
      },
      "experience-4-years": {
        technical: 8,
        hr: 4,
        manager: 4,
        cto: 3,
        case: 4,
      },
      "experience-5-plus-years": {
        technical: 8,
        hr: 4,
        manager: 4,
        cto: 4,
        case: 5,
      },
    };
    return defaults[selectedDifficulty] || defaults["full-time-fresher"];
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

          const defaultStructs = getDefaultStructures(difficulty);
          setQuestionCounts(defaultStructs);

          const enabled = {};
          Object.keys(defaultStructs).forEach((rt) => {
            enabled[rt] = defaultStructs[rt] > 0;
          });
          setEnabledRounds(enabled);
        }
      }
    } catch (err) {
      setError("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (e) => {
    e.preventDefault();

    const roundsToEnable = Object.keys(enabledRounds).filter(
      (rt) => enabledRounds[rt],
    );

    // ✅ FIX: MAP DIFFICULTY
    const difficultyMap = {
      "2-month-summer-intern": "easy",
      "6-month-intern": "easy",
      "full-time-fresher": "medium",
      "experience-1-year": "medium",
      "experience-2-years": "medium",
      "experience-3-years": "hard",
      "experience-4-years": "hard",
      "experience-5-plus-years": "hard",
    };

    try {
      setStarting(true);

      // ✅ Filter questionCounts based on enabled rounds
      const filteredQuestionCounts = {};

      roundsToEnable.forEach((rt) => {
        filteredQuestionCounts[rt] = questionCounts[rt] || 1;
      });

      const data = {
        mode,
        roleProfileId,
        enabledRounds: roundsToEnable,
        questionCounts: filteredQuestionCounts, // ✅ FIX HERE
        difficulty: difficultyMap[difficulty] || "medium",
        proctored: proctored === "proctored",
      };

      if (mode === "resume" || mode === "mixed") {
        if (user?.resumeId) {
          data.resumeId = user.resumeId;
        } else {
          setError("Upload resume first");
          setStarting(false);
          return;
        }
      }
      console.log("FINAL DATA:", data);
      const response = await interviewAPI.start(data);

      if (response.success) {
        router.push(`/interview/session/${response.data.sessionId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start interview");
    } finally {
      setStarting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <form onSubmit={handleStart}>
            <Button type="submit" className="w-full">
              {starting ? <Loader size="sm" /> : "Start Interview"}
            </Button>
          </form>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

/**
 * Local resume parsing using heuristics and regex
 * Extracts: ATS score, target fields, strengths, detailed sections
 */

const SECTION_KEYWORDS = {
  summary: ['summary', 'career objective', 'profile'],
  experience: ['experience', 'work history', 'professional experience', 'employment'],
  education: ['education', 'academic', 'qualification', 'academics'],
  projects: ['projects', 'project experience', 'selected projects'],
  achievements: ['achievements', 'awards', 'honors', 'recognition'],
  certifications: ['certifications', 'courses', 'training'],
  skills: ['skills', 'technical skills', 'core skills', 'competencies']
};

const STOP_SECTION_MARKERS = Object.values(SECTION_KEYWORDS).flat();

// Common technical skills keywords
const SKILL_KEYWORDS = [
  // Programming Languages
  'javascript', 'java', 'python', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'kotlin', 'swift',
  'typescript', 'scala', 'r', 'matlab', 'perl', 'shell', 'bash',
  // Web Technologies
  'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'laravel',
  'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind', 'jquery',
  // Databases
  'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite', 'dynamodb',
  // Cloud & DevOps
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'terraform',
  // Mobile
  'android', 'ios', 'react native', 'flutter', 'xamarin',
  // Data & Analytics
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy',
  'data analysis', 'data science', 'tableau', 'power bi',
  // Other
  'git', 'agile', 'scrum', 'rest api', 'graphql', 'microservices', 'linux'
];

const FIELD_CATEGORIES = {
  'Frontend Engineering': ['react', 'angular', 'vue', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'redux'],
  'Backend Engineering': ['node', 'express', 'java', 'spring', 'python', 'django', 'flask', 'graphql', 'microservices'],
  'Mobile Engineering': ['android', 'ios', 'swift', 'kotlin', 'flutter', 'react native', 'xamarin'],
  'Data Science & ML': ['python', 'r', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'machine learning', 'data analysis'],
  'DevOps & Cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'terraform', 'jenkins'],
  'Product & Leadership': ['product', 'roadmap', 'stakeholder', 'agile', 'scrum', 'leadership', 'strategy']
};

const EDUCATION_KEYWORDS = [
  'bachelor', 'master', 'phd', 'degree', 'diploma', 'certification',
  'b.tech', 'm.tech', 'b.e', 'm.e', 'b.sc', 'm.sc', 'mba', 'b.com', 'm.com'
];

const PROJECT_INDICATORS = [
  'project', 'developed', 'built', 'created', 'implemented', 'designed',
  'application', 'system', 'website', 'app', 'platform', 'tool'
];

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const splitLines = (text) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const detectSection = (line, keywords) =>
  keywords.some((keyword) => line.toLowerCase().includes(keyword));

const extractSectionItems = (text, sectionKeywords) => {
  const lines = splitLines(text);
  const items = [];
  let collecting = false;
  let buffer = [];

  for (const rawLine of lines) {
    const line = rawLine.toLowerCase();

    if (!collecting && detectSection(line, sectionKeywords)) {
      collecting = true;
      continue;
    }

    if (collecting) {
      if (detectSection(line, STOP_SECTION_MARKERS) && !detectSection(line, sectionKeywords)) {
        break;
      }

      if (!rawLine.trim()) {
        if (buffer.length) {
          items.push(buffer.join(' ').trim());
          buffer = [];
        }
        continue;
      }

      buffer.push(rawLine.trim());
    }
  }

  if (buffer.length) {
    items.push(buffer.join(' ').trim());
  }

  return items;
};

const extractSummary = (text) => {
  const lines = splitLines(text);
  const summarySection = extractSectionItems(text, SECTION_KEYWORDS.summary);

  if (summarySection.length) {
    return summarySection.slice(0, 2).join(' ');
  }

  return lines.slice(0, 3).join(' ').slice(0, 400);
};

const extractContactInfo = (text) => {
  const emailMatch = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  const phoneMatch = text.match(/(\+\d{1,3}[- ]?)?\d{10}/);
  const locationMatch = text.match(/(?:based in|location|lives in|city)[:\- ]+([A-Za-z\s,]+)/i);

  return {
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
    location: locationMatch ? locationMatch[1]?.trim() : ''
  };
};

const extractSkills = (text) => {
  const foundSkills = [];
  const lowerText = text.toLowerCase();

  SKILL_KEYWORDS.forEach((skill) => {
    try {
      const escapedSkill = escapeRegex(skill);
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'gi');
      if (regex.test(lowerText)) {
        foundSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    } catch (error) {
      console.warn(`Skipping skill "${skill}" due to regex error:`, error.message);
    }
  });

  return [...new Set(foundSkills)];
};

const categorizeSkills = (skills) => {
  const categories = Object.keys(FIELD_CATEGORIES).map((name) => ({
    name,
    matchedSkills: [],
    score: 0
  }));

  skills.forEach((skill) => {
    const lowerSkill = skill.toLowerCase();
    categories.forEach((category) => {
      if (FIELD_CATEGORIES[category.name].some((keyword) => lowerSkill.includes(keyword))) {
        category.matchedSkills.push(skill);
      }
    });
  });

  categories.forEach((category) => {
    category.matchedSkills = [...new Set(category.matchedSkills)];
    category.score = Math.min(category.matchedSkills.length * 12, 100);
  });

  return categories.filter((category) => category.matchedSkills.length > 0);
};

const extractEducation = (text) => {
  const lines = extractSectionItems(text, SECTION_KEYWORDS.education);

  if (lines.length) {
    return lines;
  }

  const fallback = [];
  const rawLines = splitLines(text);

  rawLines.forEach((line) => {
    EDUCATION_KEYWORDS.forEach((keyword) => {
      if (line.toLowerCase().includes(keyword)) {
        fallback.push(line.trim());
      }
    });
  });

  return [...new Set(fallback)];
};

const extractProjects = (text) => {
  const sectionProjects = extractSectionItems(text, SECTION_KEYWORDS.projects);
  if (sectionProjects.length) {
    return sectionProjects.slice(0, 5);
  }

  const projects = [];
  const lines = text.split('\n');
  let currentProject = [];

  for (const rawLine of lines) {
    const line = rawLine.toLowerCase().trim();

    if (PROJECT_INDICATORS.some((indicator) => line.includes(indicator))) {
      if (currentProject.length) {
        projects.push(currentProject.join(' '));
        currentProject = [];
      }
      currentProject.push(rawLine.trim());
    } else if (currentProject.length && line.length > 10) {
      currentProject.push(rawLine.trim());
    }
  }

  if (currentProject.length) {
    projects.push(currentProject.join(' '));
  }

  return projects.slice(0, 5);
};

const extractExperienceEntries = (text) => {
  const entries = extractSectionItems(text, SECTION_KEYWORDS.experience);

  if (entries.length) {
    return entries.slice(0, 6);
  }

  const fallback = [];
  const lines = splitLines(text);
  const datePattern = /(20\d{2}|19\d{2})/;

  lines.forEach((line) => {
    if (datePattern.test(line) || line.toLowerCase().includes('experience')) {
      fallback.push(line);
    }
  });

  return fallback.slice(0, 6);
};

const extractAchievements = (text) =>
  extractSectionItems(text, SECTION_KEYWORDS.achievements).slice(0, 5);

const extractCertifications = (text) =>
  extractSectionItems(text, SECTION_KEYWORDS.certifications).slice(0, 5);

const extractExperienceYears = (text) => {
  const experiencePatterns = [
    /(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi,
    /experience[:\s]+(\d+)\s*(?:years?|yrs?)/gi,
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:in|of)/gi
  ];

  let maxYears = 0;

  experiencePatterns.forEach((pattern) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const years = parseInt(match[1], 10);
      if (years > maxYears) {
        maxYears = years;
      }
    }
  });

  return maxYears;
};

const extractKeywords = (text) => {
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq = {};
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'is',
    'was',
    'are',
    'were',
    'be',
    'been',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'should',
    'could',
    'may',
    'might',
    'must',
    'can',
    'this',
    'that',
    'these',
    'those',
    'i',
    'you',
    'he',
    'she',
    'it',
    'we',
    'they'
  ]);

  words.forEach((word) => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 4 && !stopWords.has(cleanWord)) {
      wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
    }
  });

  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([word]) => word);
};

const calculateAtsScore = (parsedData) => {
  const breakdown = {
    sections: 0,
    skills: 0,
    keywords: 0,
    experience: 0,
    achievements: 0
  };

  const presentSections = [
    parsedData.skills.length > 0,
    parsedData.education.length > 0,
    parsedData.projects.length > 0,
    parsedData.experience.entries.length > 0,
    parsedData.achievements.length > 0
  ].filter(Boolean).length;

  breakdown.sections = Math.min((presentSections / 5) * 30, 30);
  breakdown.skills = Math.min(parsedData.skills.length * 1.5, 25);
  breakdown.keywords = Math.min(parsedData.keywords.length, 20);
  breakdown.experience = Math.min(parsedData.experience.totalYears * 4, 15);
  breakdown.achievements = Math.min(parsedData.achievements.length * 5, 10);

  const overall = Math.round(
    breakdown.sections +
      breakdown.skills +
      breakdown.keywords +
      breakdown.experience +
      breakdown.achievements
  );

  const strengths = [];
  const improvements = [];

  if (parsedData.skills.length >= 8) strengths.push('Great skill coverage and keyword density');
  if (parsedData.education.length) strengths.push('Education section detected and structured');
  if (parsedData.projects.length) strengths.push('Projects highlighted with tangible impact');
  if (parsedData.experience.entries.length >= 3) strengths.push('Multiple experience entries present');

  if (parsedData.experience.totalYears < 2) {
    improvements.push('Highlight measurable impact for each experience entry');
  }
  if (!parsedData.achievements.length) {
    improvements.push('Add achievements or awards to stand out in ATS ranking');
  }
  if (parsedData.skills.length < 5) {
    improvements.push('List at least 8 relevant technical and soft skills');
  }
  if (parsedData.projects.length < 2) {
    improvements.push('Document at least two notable projects with outcomes');
  }

  return {
    overall,
    breakdown,
    strengths,
    improvements
  };
};

const detectTargetFields = (categorizedSkills) => {
  return categorizedSkills
    .map((category) => ({
      field: category.name,
      score: Math.min(category.matchedSkills.length * 15, 100),
      matchedSkills: category.matchedSkills.slice(0, 8)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

const parseResume = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      summary: '',
      contact: {},
      skills: [],
      categorizedSkills: [],
      education: [],
      projects: [],
      experience: {
        entries: [],
        totalYears: 0
      },
      achievements: [],
      certifications: [],
      keywords: [],
      targetFields: [],
      atsScore: {
        overall: 0,
        breakdown: {},
        strengths: [],
        improvements: []
      }
    };
  }

  const skills = extractSkills(text);
  const categorizedSkills = categorizeSkills(skills);
  const targetFields = detectTargetFields(categorizedSkills);
  const experienceYears = extractExperienceYears(text);

  const parsedData = {
    summary: extractSummary(text),
    contact: extractContactInfo(text),
    skills,
    categorizedSkills,
    education: extractEducation(text),
    projects: extractProjects(text),
    experience: {
      entries: extractExperienceEntries(text),
      totalYears: experienceYears
    },
    achievements: extractAchievements(text),
    certifications: extractCertifications(text),
    keywords: extractKeywords(text),
    targetFields
  };

  parsedData.atsScore = calculateAtsScore(parsedData);

  return parsedData;
};

module.exports = {
  parseResume,
  extractSkills,
  extractEducation,
  extractProjects,
  extractExperienceYears,
  extractKeywords
};


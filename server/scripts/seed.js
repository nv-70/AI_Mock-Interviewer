require('dotenv').config();
const mongoose = require('mongoose');
const RoleProfile = require('../src/models/RoleProfile');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mock_interviewer';

const roleProfiles = [
  {
    roleName: 'Software Developer',
    domainTags: ['Software Development', 'General Programming'],
    skillExpectations: ['Problem Solving', 'Data Structures', 'Algorithms', 'OOP', 'Version Control'],
    interviewStructures: {
      technical: { questionCount: 6, difficulty: 'full-time-fresher' },
      hr: { questionCount: 5 },
      manager: { questionCount: 4 },
      cto: { questionCount: 3 },
      case: { questionCount: 2 }
    }
  },
  {
    roleName: 'Java Developer',
    domainTags: ['Java', 'Backend', 'Enterprise'],
    skillExpectations: ['Java', 'Spring Boot', 'Hibernate', 'Maven', 'REST APIs', 'Microservices'],
    interviewStructures: {
      technical: { questionCount: 7, difficulty: 'full-time-fresher' },
      hr: { questionCount: 5 },
      manager: { questionCount: 3 },
      cto: { questionCount: 3 },
      case: { questionCount: 2 }
    }
  },
  {
    roleName: 'MERN Stack Developer',
    domainTags: ['MongoDB', 'Express', 'React', 'Node.js', 'Full Stack'],
    skillExpectations: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'State Management'],
    interviewStructures: {
      technical: { questionCount: 8, difficulty: 'full-time-fresher' },
      hr: { questionCount: 5 },
      manager: { questionCount: 4 },
      cto: { questionCount: 3 },
      case: { questionCount: 2 }
    }
  },
  {
    roleName: 'Android Developer',
    domainTags: ['Android', 'Mobile', 'Kotlin', 'Java'],
    skillExpectations: ['Android SDK', 'Kotlin/Java', 'Material Design', 'REST APIs', 'MVVM', 'Room Database'],
    interviewStructures: {
      technical: { questionCount: 7, difficulty: 'full-time-fresher' },
      hr: { questionCount: 5 },
      manager: { questionCount: 3 },
      cto: { questionCount: 3 },
      case: { questionCount: 2 }
    }
  },
  {
    roleName: 'Kotlin Developer',
    domainTags: ['Kotlin', 'Android', 'Backend'],
    skillExpectations: ['Kotlin', 'Coroutines', 'Ktor', 'Spring Boot', 'Functional Programming'],
    interviewStructures: {
      technical: { questionCount: 7, difficulty: 'full-time-fresher' },
      hr: { questionCount: 5 },
      manager: { questionCount: 3 },
      cto: { questionCount: 3 },
      case: { questionCount: 2 }
    }
  },
  {
    roleName: 'Web Frontend Developer',
    domainTags: ['Frontend', 'JavaScript', 'React', 'Vue', 'Angular'],
    skillExpectations: ['HTML', 'CSS', 'JavaScript', 'React/Vue/Angular', 'Responsive Design', 'State Management'],
    interviewStructures: {
      technical: { questionCount: 7, difficulty: 'full-time-fresher' },
      hr: { questionCount: 5 },
      manager: { questionCount: 3 },
      cto: { questionCount: 3 },
      case: { questionCount: 2 }
    }
  },
  {
    roleName: 'Backend Developer',
    domainTags: ['Backend', 'API', 'Server', 'Database'],
    skillExpectations: ['Node.js', 'Python', 'REST APIs', 'Database Design', 'Caching', 'Microservices'],
    interviewStructures: {
      technical: { questionCount: 7, difficulty: 'full-time-fresher' },
      hr: { questionCount: 5 },
      manager: { questionCount: 4 },
      cto: { questionCount: 4 },
      case: { questionCount: 2 }
    }
  },
  {
    roleName: 'Full Stack Developer',
    domainTags: ['Full Stack', 'Frontend', 'Backend', 'Full Cycle'],
    skillExpectations: ['Frontend Frameworks', 'Backend Technologies', 'Database', 'DevOps Basics', 'API Design'],
    interviewStructures: {
      technical: { questionCount: 8, difficulty: 'full-time-fresher' },
      hr: { questionCount: 5 },
      manager: { questionCount: 4 },
      cto: { questionCount: 4 },
      case: { questionCount: 3 }
    }
  },
  {
    roleName: 'Data Analyst',
    domainTags: ['Data Analysis', 'Analytics', 'SQL', 'Excel'],
    skillExpectations: ['SQL', 'Python/R', 'Excel', 'Data Visualization', 'Statistical Analysis', 'Tableau/Power BI'],
    interviewStructures: {
      technical: { questionCount: 6, difficulty: 'full-time-fresher' },
      hr: { questionCount: 5 },
      manager: { questionCount: 4 },
      cto: { questionCount: 2 },
      case: { questionCount: 5 }
    }
  },
  {
    roleName: 'Quantitative Analyst',
    domainTags: ['Quantitative', 'Finance', 'Mathematics', 'Statistics'],
    skillExpectations: ['Python', 'R', 'Mathematical Modeling', 'Statistics', 'Financial Markets', 'Risk Analysis'],
    interviewStructures: {
      technical: { questionCount: 7, difficulty: 'experience-3-years' },
      hr: { questionCount: 5 },
      manager: { questionCount: 4 },
      cto: { questionCount: 3 },
      case: { questionCount: 6 }
    }
  },
  {
    roleName: 'Business Analyst',
    domainTags: ['Business Analysis', 'Consulting', 'Requirements'],
    skillExpectations: ['Requirements Gathering', 'Process Analysis', 'SQL', 'Documentation', 'Stakeholder Management'],
    interviewStructures: {
      technical: { questionCount: 4, difficulty: 'full-time-fresher' },
      hr: { questionCount: 6 },
      manager: { questionCount: 5 },
      cto: { questionCount: 2 },
      case: { questionCount: 7 }
    }
  },
  {
    roleName: 'Consulting Analyst',
    domainTags: ['Consulting', 'Strategy', 'Problem Solving'],
    skillExpectations: ['Problem Solving', 'Analytical Thinking', 'Communication', 'Business Acumen', 'Case Analysis'],
    interviewStructures: {
      technical: { questionCount: 3, difficulty: 'full-time-fresher' },
      hr: { questionCount: 6 },
      manager: { questionCount: 5 },
      cto: { questionCount: 2 },
      case: { questionCount: 8 }
    }
  }
];

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing existing role profiles...');
    await RoleProfile.deleteMany({});
    console.log('✅ Cleared existing role profiles');

    console.log('🌱 Seeding role profiles...');
    for (const roleData of roleProfiles) {
      const existing = await RoleProfile.findOne({ roleName: roleData.roleName });
      if (!existing) {
        const role = new RoleProfile(roleData);
        await role.save();
        console.log(`  ✓ Created: ${roleData.roleName}`);
      } else {
        console.log(`  ⊙ Skipped (exists): ${roleData.roleName}`);
      }
    }

    const count = await RoleProfile.countDocuments();
    console.log(`\n✅ Seeding completed! Created ${count} role profiles.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();


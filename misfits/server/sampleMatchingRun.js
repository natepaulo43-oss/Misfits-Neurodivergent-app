const { matchMentors } = require('./matchingEngine');

const studentProfile = {
  fullName: 'Jordan Lee',
  age: 17,
  gradeLevel: 'high_school',
  timezone: 'America/Los_Angeles',
  supportGoals: ['academic_support', 'career_guidance'],
  learningStyles: ['visual'],
  communicationMethods: ['text', 'video'],
  meetingFrequency: 'weekly',
  mentorTraits: ['patient', 'structured'],
  guidanceStyle: 'step_by_step',
  neurodivergence: 'adhd',
  availabilitySlots: ['tue_evening', 'thu_evening'],
};

const mentorProfiles = [
  {
    id: 'mentor-123',
    fullName: 'Dr. Aisha Smith',
    timezone: 'America/Los_Angeles',
    focusAreas: ['academic_support', 'executive_functioning'],
    communicationMethods: ['text', 'video'],
    availabilitySlots: ['tue_evening'],
    mentoringApproach: ['structured_guidance'],
    menteeAgeRange: ['high_school', 'college'],
    neurodivergenceExperience: 'experienced',
    maxMentees: 4,
    currentMentees: 2,
    isActive: true,
  },
  {
    id: 'mentor-456',
    fullName: 'Marcus Williams',
    timezone: 'America/New_York',
    focusAreas: ['career_guidance', 'social_emotional'],
    communicationMethods: ['video', 'audio'],
    availabilitySlots: ['wed_evening'],
    mentoringApproach: ['open_discussion'],
    menteeAgeRange: ['high_school'],
    neurodivergenceExperience: 'some_experience',
    maxMentees: 3,
    currentMentees: 3,
    isActive: true,
  },
];

const { matches, metadata } = matchMentors(studentProfile, mentorProfiles);

console.log(JSON.stringify({ matches, metadata }, null, 2));

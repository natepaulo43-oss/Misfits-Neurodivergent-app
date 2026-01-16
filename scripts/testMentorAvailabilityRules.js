const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');

(async () => {
  const projectId = 'demo-test-' + Date.now();
  const rulesPath = path.join(__dirname, '..', 'firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');

  const testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules,
    },
  });

  const mentorId = 'mentorTestUser';

  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await db.collection('users').doc(mentorId).set({
      role: 'mentor',
      accountSuspended: false,
    });
  });

  const mentorContext = testEnv.authenticatedContext(mentorId);
  const mentorDb = mentorContext.firestore();

  const availabilityDoc = mentorDb.collection('mentorAvailability').doc(mentorId);

  await assertSucceeds(
    availabilityDoc.set({
      mentorId,
      timezone: 'America/New_York',
      sessionDurations: [30, 60],
      bufferMinutes: 15,
      maxSessionsPerDay: 3,
      weeklyBlocks: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
      ],
      exceptions: [],
      updatedAt: new Date().toISOString(),
    }),
  );

  console.log('Rule test passed: mentor can save availability.');

  await testEnv.cleanup();
})();

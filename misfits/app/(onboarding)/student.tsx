import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { router } from 'expo-router';

import { Screen, Input, Button } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import {
  GradeLevel,
  MeetingFrequency,
  MentorTrait,
  GuidanceStyle,
  LearningStyle,
  CommunicationMethod,
  SupportGoal,
  NeurodivergenceOption,
} from '../../types';

const gradeOptions: { label: string; value: GradeLevel }[] = [
  { label: 'Middle School', value: 'middle_school' },
  { label: 'High School', value: 'high_school' },
  { label: 'College', value: 'college' },
  { label: 'Other', value: 'other' },
];

const supportGoalOptions: { label: string; value: SupportGoal }[] = [
  { label: 'Academic Support', value: 'academic_support' },
  { label: 'Social / Emotional Support', value: 'social_emotional' },
  { label: 'Career / Future Guidance', value: 'career_guidance' },
  { label: 'Other', value: 'other' },
];

const learningStyleOptions: { label: string; value: LearningStyle }[] = [
  { label: 'Visual', value: 'visual' },
  { label: 'Auditory', value: 'auditory' },
  { label: 'Reading / Writing', value: 'reading_writing' },
  { label: 'Hands-On', value: 'hands_on' },
];

const communicationOptions: { label: string; value: CommunicationMethod }[] = [
  { label: 'Text', value: 'text' },
  { label: 'Video Call', value: 'video' },
  { label: 'Audio Call', value: 'audio' },
  { label: 'Email', value: 'email' },
];

const meetingFrequencyOptions: { label: string; value: MeetingFrequency }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Biweekly', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
];

const mentorTraitOptions: { label: string; value: MentorTrait }[] = [
  { label: 'Patient', value: 'patient' },
  { label: 'Structured', value: 'structured' },
  { label: 'Creative', value: 'creative' },
  { label: 'Empathetic', value: 'empathetic' },
  { label: 'Goal-Oriented', value: 'goal_oriented' },
  { label: 'Experienced', value: 'experienced' },
];

const guidanceStyleOptions: { label: string; value: GuidanceStyle }[] = [
  { label: 'Step-by-step', value: 'step_by_step' },
  { label: 'Open Discussion', value: 'open_discussion' },
  { label: 'Visual Examples', value: 'visual_examples' },
  { label: 'Trial & Error', value: 'trial_error' },
];

const neurodivergenceOptions: { label: string; value: NeurodivergenceOption }[] = [
  { label: 'ADHD', value: 'adhd' },
  { label: 'Autism', value: 'autism' },
  { label: 'Dyslexia', value: 'dyslexia' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    }
    return;
  }
  Alert.alert(title, message);
};

const Chip: React.FC<{ label: string; selected: boolean; onPress: () => void }> = ({
  label,
  selected,
  onPress,
}) => (
  <TouchableOpacity
    accessibilityRole="button"
    onPress={onPress}
    style={[styles.chip, selected && styles.chipSelected]}
    activeOpacity={0.8}
  >
    <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
  </TouchableOpacity>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const toggleValue = <T,>(value: T, list: T[], setter: (next: T[]) => void) => {
  setter(list.includes(value) ? list.filter(item => item !== value) : [...list, value]);
};

const detectTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

export default function StudentOnboardingScreen() {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.studentProfile?.fullName || user?.name || '');
  const [age, setAge] = useState(user?.studentProfile?.age?.toString() || '');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(
    user?.studentProfile?.gradeLevel || 'middle_school',
  );
  const [locationCity, setLocationCity] = useState(user?.studentProfile?.locationCity || '');
  const [locationState, setLocationState] = useState(user?.studentProfile?.locationState || '');
  const [supportGoals, setSupportGoals] = useState<SupportGoal[]>(
    user?.studentProfile?.supportGoals || [],
  );
  const [supportGoalsOther, setSupportGoalsOther] = useState(
    user?.studentProfile?.supportGoalsOther || '',
  );
  const [learningStyles, setLearningStyles] = useState<LearningStyle[]>(
    user?.studentProfile?.learningStyles || [],
  );
  const [communicationMethods, setCommunicationMethods] = useState<CommunicationMethod[]>(
    user?.studentProfile?.communicationMethods || [],
  );
  const [meetingFrequency, setMeetingFrequency] = useState<MeetingFrequency>(
    user?.studentProfile?.meetingFrequency || 'weekly',
  );
  const [mentorTraits, setMentorTraits] = useState<MentorTrait[]>(
    user?.studentProfile?.mentorTraits || [],
  );
  const [guidanceStyle, setGuidanceStyle] = useState<GuidanceStyle | undefined>(
    user?.studentProfile?.guidanceStyle,
  );
  const [preferredCommunicationNotes, setPreferredCommunicationNotes] = useState(
    user?.studentProfile?.preferredCommunicationNotes || '',
  );
  const [neurodivergence, setNeurodivergence] = useState<NeurodivergenceOption | undefined>(
    user?.studentProfile?.neurodivergence,
  );
  const [strengthsText, setStrengthsText] = useState(user?.studentProfile?.strengthsText || '');
  const [challengesText, setChallengesText] = useState(user?.studentProfile?.challengesText || '');
  const [submitting, setSubmitting] = useState(false);
  const detectedTimezone = useMemo(() => detectTimezone(), []);

  const mentorTraitLimitReached = useMemo(() => mentorTraits.length >= 3, [mentorTraits.length]);

  const requiredValidations = [
    [fullName.trim().length > 0, 'Full name'],
    [age.trim().length > 0 && !Number.isNaN(Number(age)), 'Age'],
    [locationCity.trim().length > 0, 'City'],
    [locationState.trim().length > 0, 'State'],
    [supportGoals.length > 0, 'At least one support goal'],
    [learningStyles.length > 0, 'Learning style'],
    [communicationMethods.length > 0, 'Communication preference'],
    [mentorTraits.length > 0, 'Mentor traits'],
  ] as const;

  const handleSubmit = async () => {
    const missingFields = requiredValidations
      .filter(([valid]) => !valid)
      .map(([, label]) => label);

    if (missingFields.length > 0) {
      showAlert('Almost there', `Please complete: ${missingFields.join(', ')}`);
      return;
    }

    if (!user) {
      showAlert('Error', 'You must be logged in to continue.');
      return;
    }

    const ageNumber = Number(age);

    setSubmitting(true);
    try {
      await updateProfile({
        name: fullName.trim(),
        studentProfile: {
          fullName: fullName.trim(),
          age: Number.isNaN(ageNumber) ? undefined : ageNumber,
          gradeLevel,
          locationCity: locationCity.trim(),
          locationState: locationState.trim(),
          timezone: user?.studentProfile?.timezone || detectedTimezone,
          supportGoals,
          supportGoalsOther: supportGoals.includes('other')
            ? supportGoalsOther.trim() || undefined
            : undefined,
          learningStyles,
          communicationMethods,
          meetingFrequency,
          mentorTraits,
          guidanceStyle,
          preferredCommunicationNotes: preferredCommunicationNotes.trim() || undefined,
          neurodivergence,
          strengthsText: strengthsText.trim() || undefined,
          challengesText: challengesText.trim() || undefined,
        },
        onboardingCompleted: true,
      });

      router.replace('/(tabs)/home');
    } catch (error) {
      showAlert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll align="left" keyboardShouldPersistTaps="always">
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Step 2 of 2</Text>
        <Text style={styles.title}>Tell us about you</Text>
        <Text style={styles.subtitle}>
          We’ll use this information to match you with mentors who understand your needs.
        </Text>
      </View>

      <Section title="Basic Info">
        <Input
          label="Full name *"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Alex Johnson"
        />
        <Input
          label="Age *"
          value={age}
          onChangeText={setAge}
          placeholder="16"
          keyboardType="number-pad"
        />
        <Text style={styles.label}>Grade / Level *</Text>
        <View style={styles.chipRow}>
          {gradeOptions.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              selected={gradeLevel === option.value}
              onPress={() => setGradeLevel(option.value)}
            />
          ))}
        </View>
        <Input
          label="City *"
          value={locationCity}
          onChangeText={setLocationCity}
          placeholder="e.g., Los Angeles"
        />
        <Input
          label="State / Region *"
          value={locationState}
          onChangeText={setLocationState}
          placeholder="e.g., CA"
        />
      </Section>

      <Section title="Support Goals *">
        <View style={styles.chipRow}>
          {supportGoalOptions.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              selected={supportGoals.includes(option.value)}
              onPress={() => toggleValue(option.value, supportGoals, setSupportGoals)}
            />
          ))}
        </View>
        {supportGoals.includes('other') && (
          <Input
            label="Tell us more"
            value={supportGoalsOther}
            onChangeText={setSupportGoalsOther}
            placeholder="Describe the support you're looking for"
            multiline
          />
        )}
      </Section>

      <Section title="Learning Style Preferences *">
        <View style={styles.chipRow}>
          {learningStyleOptions.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              selected={learningStyles.includes(option.value)}
              onPress={() => toggleValue(option.value, learningStyles, setLearningStyles)}
            />
          ))}
        </View>
      </Section>

      <Section title="Communication Preferences *">
        <Text style={styles.subsectionTitle}>Preferred methods</Text>
        <View style={styles.chipRow}>
          {communicationOptions.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              selected={communicationMethods.includes(option.value)}
              onPress={() => toggleValue(option.value, communicationMethods, setCommunicationMethods)}
            />
          ))}
        </View>

        <Text style={styles.subsectionTitle}>Ideal meeting frequency *</Text>
        <View style={styles.chipRow}>
          {meetingFrequencyOptions.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              selected={meetingFrequency === option.value}
              onPress={() => setMeetingFrequency(option.value)}
            />
          ))}
        </View>

        <Input
          label="Anything else we should know?"
          value={preferredCommunicationNotes}
          onChangeText={setPreferredCommunicationNotes}
          placeholder="e.g., Prefer afternoons, short check-ins..."
          multiline
        />
      </Section>

      <Section title="Mentor Traits & Guidance">
        <Text style={styles.helperText}>Pick up to 3 mentor qualities *</Text>
        <View style={styles.chipRow}>
          {mentorTraitOptions.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              selected={mentorTraits.includes(option.value)}
              onPress={() => {
                if (mentorTraits.includes(option.value)) {
                  toggleValue(option.value, mentorTraits, setMentorTraits);
                  return;
                }
                if (mentorTraitLimitReached) {
                  showAlert('Limit reached', 'Please deselect one trait before adding another.');
                  return;
                }
                toggleValue(option.value, mentorTraits, setMentorTraits);
              }}
            />
          ))}
        </View>

        <Text style={styles.subsectionTitle}>How do you prefer to receive guidance?</Text>
        <View style={styles.chipRow}>
          {guidanceStyleOptions.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              selected={guidanceStyle === option.value}
              onPress={() => setGuidanceStyle(option.value)}
            />
          ))}
        </View>
      </Section>

      <Section title="Neurodivergence & Strengths (Optional)">
        <Text style={styles.subsectionTitle}>Self-identification</Text>
        <View style={styles.chipRow}>
          {neurodivergenceOptions.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              selected={neurodivergence === option.value}
              onPress={() =>
                setNeurodivergence(neurodivergence === option.value ? undefined : option.value)
              }
            />
          ))}
        </View>
        <Input
          label="Areas of strength"
          value={strengthsText}
          onChangeText={setStrengthsText}
          placeholder="e.g., Creative problem solving"
          multiline
        />
        <Input
          label="Areas of challenge"
          value={challengesText}
          onChangeText={setChallengesText}
          placeholder="e.g., Staying organized before exams"
          multiline
        />
      </Section>

      <Button
        title="Complete Setup"
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  eyebrow: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  subsectionTitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  helperText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chipLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

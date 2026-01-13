import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { router } from 'expo-router';

import { Screen, Input, Button } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import {
  User,
  CommunicationMethod,
  MentoringApproach,
  MenteeAgeRange,
  MenteeTrait,
  NeurodivergenceExperience,
} from '../../types';

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

const communicationOptions: { label: string; value: CommunicationMethod }[] = [
  { label: 'Text', value: 'text' },
  { label: 'Video Call', value: 'video' },
  { label: 'Audio Call', value: 'audio' },
  { label: 'Email', value: 'email' },
];

const menteeAgeOptions: { label: string; value: MenteeAgeRange }[] = [
  { label: 'Middle School', value: 'middle_school' },
  { label: 'High School', value: 'high_school' },
  { label: 'College', value: 'college' },
  { label: 'Adult', value: 'adult' },
];

const expertiseOptions = [
  'Academic Subjects',
  'Career Guidance',
  'Social Skills',
  'Emotional Support',
  'Executive Function',
  'Life Skills',
  'Other',
];

const focusAreaOptions = [
  'Study Skills',
  'Executive Function',
  'Transitions',
  'Confidence Building',
  'Self-Advocacy',
  'College Planning',
  'Workplace Readiness',
];

const neuroExperienceOptions: { label: string; value: NeurodivergenceExperience }[] = [
  { label: 'Experienced', value: 'experienced' },
  { label: 'Some Experience', value: 'some_experience' },
  { label: 'No Experience', value: 'no_experience' },
  { label: 'Self-Identified ND', value: 'self_identified' },
];

const mentoringApproachOptions: { label: string; value: MentoringApproach }[] = [
  { label: 'Structured Guidance', value: 'structured_guidance' },
  { label: 'Open Discussion', value: 'open_discussion' },
  { label: 'Collaborative Problem Solving', value: 'collaborative_problem_solving' },
  { label: 'Hands-On Learning', value: 'hands_on' },
];

const menteeTraitOptions: { label: string; value: MenteeTrait }[] = [
  { label: 'Motivated', value: 'motivated' },
  { label: 'Curious', value: 'curious' },
  { label: 'Communicative', value: 'communicative' },
  { label: 'Self-Directed', value: 'self_directed' },
];

const availabilityOptions = [
  'Weekday mornings',
  'Weekday afternoons',
  'Weekday evenings',
  'Weekend mornings',
  'Weekend afternoons',
  'Weekend evenings',
];

export default function MentorOnboardingScreen() {
  const { user, updateProfile } = useAuth();
  const isApprovedMentor = user?.mentorApplicationStatus === 'approved' || user?.role === 'mentor';

  const [fullName, setFullName] = useState(user?.mentorProfile?.fullName || user?.name || '');
  const [age, setAge] = useState(user?.mentorProfile?.age?.toString() || '');
  const [locationCity, setLocationCity] = useState(user?.mentorProfile?.locationCity || '');
  const [locationState, setLocationState] = useState(user?.mentorProfile?.locationState || '');
  const [currentRole, setCurrentRole] = useState(user?.mentorProfile?.currentRole || '');
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>(
    user?.mentorProfile?.expertiseAreas || [],
  );
  const [expertiseOther, setExpertiseOther] = useState('');
  const [menteeAgeRange, setMenteeAgeRange] = useState<MenteeAgeRange[]>(
    user?.mentorProfile?.menteeAgeRange || [],
  );
  const [focusAreas, setFocusAreas] = useState<string[]>(user?.mentorProfile?.focusAreas || []);
  const [neuroExperience, setNeuroExperience] = useState<NeurodivergenceExperience>(
    user?.mentorProfile?.neurodivergenceExperience || 'experienced',
  );
  const [communicationMethods, setCommunicationMethods] = useState<CommunicationMethod[]>(
    user?.mentorProfile?.communicationMethods || [],
  );
  const [availabilitySlots, setAvailabilitySlots] = useState<string[]>(
    user?.mentorProfile?.availabilitySlots || [],
  );
  const [mentoringApproach, setMentoringApproach] = useState<MentoringApproach[]>(
    user?.mentorProfile?.mentoringApproach || [],
  );
  const [valuedMenteeTraits, setValuedMenteeTraits] = useState<MenteeTrait[]>(
    user?.mentorProfile?.valuedMenteeTraits || [],
  );
  const [shortBio, setShortBio] = useState(user?.mentorProfile?.shortBio || '');
  const [funFact, setFunFact] = useState(user?.mentorProfile?.funFact || '');
  const [submitting, setSubmitting] = useState(false);
  const detectedTimezone = useMemo(() => detectTimezone(), []);

  const requiredValidations = [
    [fullName.trim().length > 0, 'Full name'],
    [locationCity.trim().length > 0, 'City'],
    [locationState.trim().length > 0, 'State'],
    [currentRole.trim().length > 0, 'Current role'],
    [expertiseAreas.length > 0, 'Expertise areas'],
    [menteeAgeRange.length > 0, 'Mentee age range'],
    [focusAreas.length > 0, 'Focus areas'],
    [communicationMethods.length > 0, 'Communication methods'],
    [availabilitySlots.length > 0, 'Availability'],
    [mentoringApproach.length > 0, 'Mentoring approach'],
    [Boolean(neuroExperience), 'Neurodivergence experience'],
  ] as const;

  const handleSubmit = async () => {
    const missing = requiredValidations.filter(([valid]) => !valid).map(([, label]) => label);

    if (missing.length > 0) {
      showAlert('Almost there', `Please complete: ${missing.join(', ')}`);
      return;
    }

    if (!user) {
      showAlert('Error', 'You must be logged in to continue.');
      return;
    }

    const ageNumber = Number(age);
    const submissionTimestamp = isApprovedMentor ? undefined : new Date().toISOString();
    setSubmitting(true);
    try {
      const profilePayload: Partial<User> = {
        name: fullName.trim(),
        mentorProfile: {
          fullName: fullName.trim(),
          age: age.trim() ? (Number.isNaN(ageNumber) ? undefined : ageNumber) : undefined,
          locationCity: locationCity.trim(),
          locationState: locationState.trim(),
          timezone: user?.mentorProfile?.timezone || detectedTimezone,
          currentRole: currentRole.trim(),
          expertiseAreas:
            expertiseOther.trim().length > 0
              ? [...expertiseAreas.filter(area => area !== 'Other'), expertiseOther.trim()]
              : expertiseAreas,
          menteeAgeRange,
          focusAreas,
          neurodivergenceExperience: neuroExperience,
          communicationMethods,
          availabilitySlots,
          mentoringApproach,
          valuedMenteeTraits: valuedMenteeTraits.length ? valuedMenteeTraits : undefined,
          shortBio: shortBio.trim() || undefined,
          funFact: funFact.trim() || undefined,
        },
        onboardingCompleted: true,
      };

      if (!isApprovedMentor) {
        profilePayload.pendingRole = 'mentor';
        profilePayload.mentorApplicationStatus = 'submitted';
        profilePayload.mentorApplicationSubmittedAt = submissionTimestamp;
      }

      await updateProfile(profilePayload);

      if (isApprovedMentor) {
        router.replace('/(tabs)/profile');
      } else {
        router.replace('/(onboarding)/mentor-submitted');
      }
    } catch (error) {
      showAlert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = requiredValidations.every(([valid]) => valid);

  return (
    <Screen scroll align="left" keyboardShouldPersistTaps="always">
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Step 2 of 2</Text>
        <Text style={styles.title}>Share your expertise</Text>
        <Text style={styles.subtitle}>
          Students will see this info when looking for mentors who fit their needs.
        </Text>
      </View>

      <Section title="Basic Info">
        <Input
          label="Full name *"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Dr. Sarah Chen"
        />
        <Input
          label="Age"
          value={age}
          onChangeText={setAge}
          placeholder="Optional"
          keyboardType="number-pad"
        />
        <Input
          label="City *"
          value={locationCity}
          onChangeText={setLocationCity}
          placeholder="e.g., Austin"
        />
        <Input
          label="State / Region *"
          value={locationState}
          onChangeText={setLocationState}
          placeholder="e.g., TX"
        />
        <Input
          label="Current role / experience *"
          value={currentRole}
          onChangeText={setCurrentRole}
          placeholder="Educational psychologist, 10+ years"
          multiline
        />
      </Section>

      <Section title="Professional Background *">
        <Text style={styles.subsectionTitle}>Areas of expertise</Text>
        <View style={styles.chipRow}>
          {expertiseOptions.map(option => (
            <Chip
              key={option}
              label={option}
              selected={expertiseAreas.includes(option)}
              onPress={() => toggleValue(option, expertiseAreas, setExpertiseAreas)}
            />
          ))}
        </View>
        {expertiseAreas.includes('Other') && (
          <Input
            label="Describe your expertise"
            value={expertiseOther}
            onChangeText={setExpertiseOther}
            placeholder="e.g., Sensory integration, Workplace coaching"
            multiline
          />
        )}

        <Text style={styles.subsectionTitle}>Age range of mentees</Text>
        <View style={styles.chipRow}>
          {menteeAgeOptions.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              selected={menteeAgeRange.includes(option.value)}
              onPress={() => toggleValue(option.value, menteeAgeRange, setMenteeAgeRange)}
            />
          ))}
        </View>

        <Text style={styles.subsectionTitle}>Focus areas</Text>
        <View style={styles.chipRow}>
          {focusAreaOptions.map(option => (
            <Chip
              key={option}
              label={option}
              selected={focusAreas.includes(option)}
              onPress={() => toggleValue(option, focusAreas, setFocusAreas)}
            />
          ))}
        </View>
      </Section>

      <Section title="Neurodivergence Familiarity *">
        <View style={styles.chipRow}>
          {neuroExperienceOptions.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              selected={neuroExperience === option.value}
              onPress={() => setNeuroExperience(option.value)}
            />
          ))}
        </View>
      </Section>

      <Section title="Communication & Availability *">
        <Text style={styles.subsectionTitle}>Preferred communication methods</Text>
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

        <Text style={styles.subsectionTitle}>Availability</Text>
        <View style={styles.chipRow}>
          {availabilityOptions.map(option => (
            <Chip
              key={option}
              label={option}
              selected={availabilitySlots.includes(option)}
              onPress={() => toggleValue(option, availabilitySlots, setAvailabilitySlots)}
            />
          ))}
        </View>
      </Section>

      <Section title="Mentoring Style *">
        <Text style={styles.subsectionTitle}>Approach to mentoring</Text>
        <View style={styles.chipRow}>
          {mentoringApproachOptions.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              selected={mentoringApproach.includes(option.value)}
              onPress={() => toggleValue(option.value, mentoringApproach, setMentoringApproach)}
            />
          ))}
        </View>

        <Text style={styles.subsectionTitle}>Traits you value in mentees (optional)</Text>
        <View style={styles.chipRow}>
          {menteeTraitOptions.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              selected={valuedMenteeTraits.includes(option.value)}
              onPress={() => toggleValue(option.value, valuedMenteeTraits, setValuedMenteeTraits)}
            />
          ))}
        </View>
      </Section>

      <Section title="Bio (Optional)">
        <Input
          label="Short bio"
          value={shortBio}
          onChangeText={setShortBio}
          placeholder="What should students know about you?"
          multiline
        />
        <Input
          label="Fun fact or icebreaker"
          value={funFact}
          onChangeText={setFunFact}
          placeholder="Something to help mentees connect with you"
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

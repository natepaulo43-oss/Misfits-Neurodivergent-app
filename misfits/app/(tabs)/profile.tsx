import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Button, Screen } from '../../components';
import { colors, spacing, typography } from '../../constants/theme';
import { StudentProfile, MentorProfile, GradeLevel, MeetingFrequency } from '../../types';

const formatToken = (value?: string | null) => {
  if (!value) return 'Not set';
  return value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatList = (value?: string[] | null) => {
  if (!value || value.length === 0) return 'Not set';
  return value.map(item => formatToken(item)).join(', ');
};

const InfoRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value ?? 'Not set'}</Text>
  </View>
);

const getGradeLabel = (grade: GradeLevel | undefined) => (grade ? formatToken(grade) : 'Not set');
const getMeetingFrequencyLabel = (value: MeetingFrequency | undefined) =>
  value ? formatToken(value) : 'Not set';

const StudentSection: React.FC<{ profile?: StudentProfile }> = ({ profile }) => {
  if (!profile) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Student Profile</Text>
      <InfoRow label="Full name" value={profile.fullName} />
      <InfoRow label="Age" value={profile.age ? profile.age.toString() : 'Not set'} />
      <InfoRow label="Grade / Level" value={getGradeLabel(profile.gradeLevel)} />
      <InfoRow label="Time zone" value={profile.timezone || 'Not set'} />
      <InfoRow label="Support goals" value={formatList(profile.supportGoals)} />
      {profile.supportGoals?.includes('other') && (
        <InfoRow label="Other support needs" value={profile.supportGoalsOther || 'Not set'} />
      )}
      <InfoRow label="Learning styles" value={formatList(profile.learningStyles)} />
      <InfoRow label="Communication methods" value={formatList(profile.communicationMethods)} />
      <InfoRow
        label="Meeting frequency"
        value={getMeetingFrequencyLabel(profile.meetingFrequency)}
      />
      <InfoRow label="Preferred mentor traits" value={formatList(profile.mentorTraits)} />
      <InfoRow label="Guidance style" value={formatToken(profile.guidanceStyle)} />
      <InfoRow
        label="Communication notes"
        value={profile.preferredCommunicationNotes || 'Not set'}
      />
      <InfoRow label="Neurodivergence" value={formatToken(profile.neurodivergence)} />
      <InfoRow label="Areas of strength" value={profile.strengthsText || 'Not set'} />
      <InfoRow label="Areas of challenge" value={profile.challengesText || 'Not set'} />
    </View>
  );
};

const MentorSection: React.FC<{ profile?: MentorProfile }> = ({ profile }) => {
  if (!profile) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Mentor Profile</Text>
      <InfoRow label="Full name" value={profile.fullName} />
      <InfoRow label="Age" value={profile.age ? profile.age.toString() : 'Not set'} />
      <InfoRow label="Time zone" value={profile.timezone || 'Not set'} />
      <InfoRow label="Current role" value={profile.currentRole} />
      <InfoRow label="Expertise areas" value={formatList(profile.expertiseAreas)} />
      <InfoRow label="Mentee age range" value={formatList(profile.menteeAgeRange)} />
      <InfoRow label="Focus areas" value={formatList(profile.focusAreas)} />
      <InfoRow
        label="Neurodivergence experience"
        value={formatToken(profile.neurodivergenceExperience)}
      />
      <InfoRow label="Communication methods" value={formatList(profile.communicationMethods)} />
      <InfoRow label="Availability" value={formatList(profile.availabilitySlots)} />
      <InfoRow label="Mentoring approach" value={formatList(profile.mentoringApproach)} />
      <InfoRow label="Valued mentee traits" value={formatList(profile.valuedMenteeTraits)} />
      <InfoRow label="Short bio" value={profile.shortBio || 'Not set'} />
      <InfoRow label="Fun fact" value={profile.funFact || 'Not set'} />
    </View>
  );
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const role = user?.role;

  const performLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' ? window.confirm('Are you sure you want to log out?') : true;
      if (confirmed) performLogout();
      return;
    }

    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: performLogout },
    ]);
  };

  const handleEditOnboarding = () => {
    if (role === 'mentor') {
      router.push('/(onboarding)/mentor');
      return;
    }
    if (role === 'student') {
      router.push('/(onboarding)/student');
      return;
    }
    router.push('/(auth)/role-selection');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Avatar name={user?.name} size="large" />
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.role}>{role ? role.charAt(0).toUpperCase() + role.slice(1) : ''}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <InfoRow label="Role" value={role ? role : 'Not set'} />
          <InfoRow label="Onboarding status" value={user?.onboardingCompleted ? 'Complete' : 'Pending'} />
        </View>

        {role === 'student' && <StudentSection profile={user?.studentProfile} />}
        {role === 'mentor' && <MentorSection profile={user?.mentorProfile} />}

        <Button
          title={user?.onboardingCompleted ? 'Update onboarding profile' : 'Complete onboarding setup'}
          onPress={handleEditOnboarding}
          style={styles.actionButton}
        />

        <Button
          title="Log Out"
          variant="outline"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
  },
  role: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  email: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  field: {
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fieldValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  actionButton: {
    marginTop: spacing.md,
  },
  logoutButton: {
    marginTop: spacing.md,
  },
});

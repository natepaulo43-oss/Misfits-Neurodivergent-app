import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen, Card, Avatar, Tag, Button, LoadingSpinner } from '../../../components';
import { colors, spacing, typography, borderRadius } from '../../../constants/theme';
import { Mentor, MentorMatchBreakdown } from '../../../types';
import { fetchMentorById } from '../../../services/mentors';
import { startNewThread } from '../../../services/messages';
import { useAuth } from '../../../context/AuthContext';

const FIT_INDICATORS: { key: keyof MentorMatchBreakdown; label: string }[] = [
  { key: 'supportGoals', label: 'Matches support goals' },
  { key: 'communication', label: 'Compatible communication style' },
  { key: 'availability', label: 'Overlapping availability' },
  { key: 'mentoringStyle', label: 'Mentoring style fit' },
  { key: 'neuroExperience', label: 'Understands neurodivergent needs' },
];

const thresholdMet = (value?: number) => (typeof value === 'number' ? value >= 60 : false);

export default function MatchDetailsScreen() {
  const { mentorId, fitLabel, matchReasons, matchBreakdown } = useLocalSearchParams();
  const { user } = useAuth();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestingIntro, setRequestingIntro] = useState(false);
  const [saving, setSaving] = useState(false);

  const decodedReasons = useMemo(() => {
    try {
      return matchReasons ? (JSON.parse(decodeURIComponent(matchReasons as string)) as string[]) : [];
    } catch {
      return [];
    }
  }, [matchReasons]);

  const decodedBreakdown = useMemo(() => {
    try {
      return matchBreakdown
        ? (JSON.parse(decodeURIComponent(matchBreakdown as string)) as MentorMatchBreakdown)
        : undefined;
    } catch {
      return undefined;
    }
  }, [matchBreakdown]);

  useEffect(() => {
    const loadMentor = async () => {
      if (!mentorId) return;
      try {
        const data = await fetchMentorById(mentorId as string);
        setMentor(data);
      } catch (error) {
        console.error('Failed to load mentor', error);
      } finally {
        setLoading(false);
      }
    };

    loadMentor();
  }, [mentorId]);

  const handleRequestIntro = async () => {
    if (!mentor || !user) {
      Alert.alert('Please sign in', 'Log in to request an introduction.');
      return;
    }

    setRequestingIntro(true);
    try {
      await startNewThread(
        user.id,
        user.name,
        mentor.id,
        mentor.name,
        `Hi ${mentor.name}, I’d love to connect with you.`,
      );
      Alert.alert('Request sent', 'We let the mentor know you’d like an introduction.');
    } catch (error) {
      Alert.alert('Something went wrong', 'Unable to send your request. Please try again.');
    } finally {
      setRequestingIntro(false);
    }
  };

  const handleSaveForLater = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Saved', 'We’ll keep this mentor pinned in your matches.');
    }, 600);
  };

  const handleGetNewMatches = () => {
    router.replace('/(tabs)/mentors');
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!mentor) {
    return (
      <Screen>
        <Card>
          <Text style={styles.errorTitle}>Mentor not available</Text>
          <Text style={styles.errorCopy}>This mentor may no longer be accepting new students.</Text>
          <Button title="View other matches" onPress={() => router.replace('/(tabs)/mentors')} />
        </Card>
      </Screen>
    );
  }

  const mentorProfile = mentor.mentorProfile;
  const tags = mentorProfile?.focusAreas || mentor.expertise;
  const experienceBadge = mentorProfile?.neurodivergenceExperience
    ? `${mentorProfile.neurodivergenceExperience.replace('_', ' ')} neuro experience`
    : null;

  return (
    <Screen scroll align="left">
      <View style={styles.header}>
        <Avatar name={mentor.name} uri={mentor.profileImage} size="large" />
        <Text style={styles.name}>{mentor.name}</Text>
        <Text style={styles.role}>{mentorProfile?.currentRole || mentor.bio}</Text>
        {fitLabel ? <Text style={styles.fitLabel}>{fitLabel}</Text> : null}
      </View>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Why this match?</Text>
        {decodedReasons.length === 0 ? (
          <Text style={styles.bodyText}>We considered your goals, communication style, and schedule.</Text>
        ) : (
          decodedReasons.map(reason => (
            <View key={reason} style={styles.reasonRow}>
              <View style={styles.checkDot} />
              <Text style={styles.bodyText}>{reason}</Text>
            </View>
          ))
        )}
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Fit snapshot</Text>
        <View style={styles.indicatorList}>
          {FIT_INDICATORS.map(({ key, label }) => (
            <View key={key} style={styles.indicatorRow}>
              <View style={[styles.indicatorIcon, thresholdMet(decodedBreakdown?.[key]) && styles.indicatorIconActive]}>
                {thresholdMet(decodedBreakdown?.[key]) ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.bodyText}>{label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Support focus</Text>
        <View style={styles.tags}>
          {tags.slice(0, 6).map(tag => (
            <Tag key={tag} label={tag} />
          ))}
        </View>
        {experienceBadge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{experienceBadge}</Text>
          </View>
        ) : null}
      </Card>

      <View style={styles.actions}>
        <Button title="Request Intro" onPress={handleRequestIntro} loading={requestingIntro} />
        <Button
          title="Save for later"
          variant="secondary"
          onPress={handleSaveForLater}
          loading={saving}
        />
        <Button title="Not a fit? Get new matches" variant="outline" onPress={handleGetNewMatches} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
  },
  role: {
    ...typography.body,
    color: colors.textSecondary,
  },
  fitLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  sectionCard: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  reasonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  bodyText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  indicatorList: {
    gap: spacing.sm,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  indicatorIcon: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorIconActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  checkmark: {
    color: colors.primary,
    fontWeight: '700',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  actions: {
    gap: spacing.sm,
  },
  errorTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  errorCopy: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
});

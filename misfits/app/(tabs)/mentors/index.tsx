import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Tag, Button, Card, EmptyState, LoadingSpinner, Screen } from '../../../components';
import { colors, spacing, typography, borderRadius } from '../../../constants/theme';
import { Mentor, MentorMatchResult, MentorMatchMetadata } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { fetchMentors } from '../../../services/mentors';
import { fetchMentorMatches } from '../../../services/matching';
import { startNewThread } from '../../../services/messages';

const MATCH_THRESHOLD_STRONG = 4;
const MATCH_THRESHOLD_GOOD = 2;

const determineFitLabel = (match: MentorMatchResult): 'Strong Fit' | 'Good Fit' | 'Potential Fit' => {
  const strongSignals = match.match_reasons.length;
  if (strongSignals >= MATCH_THRESHOLD_STRONG) return 'Strong Fit';
  if (strongSignals >= MATCH_THRESHOLD_GOOD) return 'Good Fit';
  return 'Potential Fit';
};

export default function MentorMatchesScreen() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [matches, setMatches] = useState<MentorMatchResult[]>([]);
  const [metadata, setMetadata] = useState<MentorMatchMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestingIntroId, setRequestingIntroId] = useState<string | null>(null);

  const hasStudentProfile = Boolean(user?.studentProfile);

  const mentorLookup = useMemo(() => {
    return mentors.reduce<Record<string, Mentor>>((acc, mentor) => {
      acc[mentor.id] = mentor;
      return acc;
    }, {});
  }, [mentors]);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    if (!user || !user.studentProfile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mentorData = await fetchMentors();
      setMentors(mentorData);

      const mentorsWithProfiles = mentorData.filter(m => m.mentorProfile);
      const result = await fetchMentorMatches(user.studentProfile, mentorsWithProfiles);
      setMatches(result.matches);
      setMetadata(result.metadata);
    } catch (err) {
      console.error('Failed to load matches', err);
      setError('We could not load your matches right now. Please try again soon.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const handleViewDetails = (match: MentorMatchResult) => {
    router.push({
      pathname: '/(tabs)/mentors/match-details',
      params: {
        mentorId: match.mentor_id,
        fitLabel: determineFitLabel(match),
        matchReasons: encodeURIComponent(JSON.stringify(match.match_reasons)),
        matchBreakdown: encodeURIComponent(JSON.stringify(match.breakdown)),
      },
    });
  };

  const handleRequestIntro = async (mentorId: string) => {
    if (!user) {
      Alert.alert('Please sign in', 'Log in to request an introduction.');
      return;
    }

    const mentor = mentorLookup[mentorId];
    if (!mentor) return;

    setRequestingIntroId(mentorId);
    try {
      await startNewThread(
        user.id,
        user.name,
        mentor.id,
        mentor.name,
        `Hi ${mentor.name}, I’d love to connect with you.`,
      );
      Alert.alert('Request sent', 'We let the mentor know you’d like an introduction.');
    } catch (err) {
      Alert.alert('Something went wrong', 'Unable to send your introduction request. Please retry.');
    } finally {
      setRequestingIntroId(null);
    }
  };

  const renderMatchCard = (match: MentorMatchResult) => {
    const mentor = mentorLookup[match.mentor_id];
    if (!mentor) return null;

    const fitLabel = determineFitLabel(match);
    const mentorDetails = mentor.mentorProfile;
    const tags =
      mentorDetails?.focusAreas?.slice(0, 3) ||
      mentorDetails?.expertiseAreas?.slice(0, 3) ||
      mentor.expertise.slice(0, 3);
    const neuroBadge = mentorDetails?.neurodivergenceExperience
      ? `${mentorDetails.neurodivergenceExperience.replace('_', ' ')} neuro experience`
      : null;

    return (
      <Card key={match.mentor_id} style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <Avatar name={mentor.name} uri={mentor.profileImage} size="medium" />
          <View style={styles.matchHeaderText}>
            <Text style={styles.mentorName}>{mentor.name}</Text>
            <Text style={styles.mentorRole} numberOfLines={1}>
              {mentorDetails?.currentRole || mentor.bio}
            </Text>
            <Text style={styles.fitLabel}>{fitLabel}</Text>
          </View>
        </View>

        {neuroBadge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{neuroBadge}</Text>
          </View>
        ) : null}

        <View style={styles.tagRow}>
          {tags.map(tag => (
            <Tag key={tag} label={tag} />
          ))}
        </View>

        <View style={styles.matchReasons}>
          {match.match_reasons.slice(0, 3).map(reason => (
            <View key={reason} style={styles.reasonRow}>
              <View style={styles.reasonIndicator} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>

        <View style={styles.cardActions}>
          <Button
            title="View Match Details"
            variant="secondary"
            onPress={() => handleViewDetails(match)}
            style={styles.cardButton}
          />
          <Button
            title="Request Intro"
            onPress={() => handleRequestIntro(match.mentor_id)}
            loading={requestingIntroId === match.mentor_id}
            style={styles.cardButton}
          />
        </View>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen />;
  }

  if (!hasStudentProfile) {
    return (
      <Screen>
        <EmptyState
          title="Tell us about you"
          message="Complete onboarding so we can tailor mentor matches to your goals."
        />
        <Button
          title="Finish onboarding"
          style={styles.primaryButton}
          onPress={() => router.push('/(onboarding)/student')}
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      align="left"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageEyebrow}>Mentor Matches</Text>
        <Text style={styles.pageTitle}>We found mentors who fit how you learn and communicate.</Text>
        <Text style={styles.pageSubtitle}>
          Choose who feels right for you. We’ll never rank you or rush your decision.
        </Text>
      </View>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Try again" variant="outline" onPress={loadMatches} style={styles.errorBtn} />
        </Card>
      ) : null}

      {metadata?.disclaimer ? (
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>{metadata.disclaimer}</Text>
        </View>
      ) : null}

      <View style={styles.matchesSection}>
        {matches.length === 0 ? (
          <Card>
            <Text style={styles.noMatchesTitle}>We’re still searching</Text>
            <Text style={styles.noMatchesCopy}>
              We’ll notify you as soon as mentors with compatible availability join. Try refreshing later.
            </Text>
            <Button title="Refresh" variant="outline" onPress={loadMatches} style={styles.primaryButton} />
          </Card>
        ) : (
          matches.slice(0, 5).map(renderMatchCard)
        )}
      </View>

      <View style={styles.secondarySection}>
        <Text style={styles.sectionTitle}>Want to explore more mentors?</Text>
        <Button
          title="Browse all mentors"
          variant="outline"
          onPress={() => router.push('/(tabs)/mentors/browse')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  pageEyebrow: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textMuted,
  },
  pageTitle: {
    ...typography.title,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  matchesSection: {
    gap: spacing.md,
  },
  matchCard: {
    gap: spacing.md,
  },
  matchHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  matchHeaderText: {
    flex: 1,
    gap: 4,
  },
  mentorName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  mentorRole: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  fitLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  matchReasons: {
    gap: spacing.xs,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reasonIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  reasonText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
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
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardButton: {
    flex: 1,
  },
  disclaimer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  disclaimerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  noMatchesTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  noMatchesCopy: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  secondarySection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  errorCard: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  errorBtn: {
    alignSelf: 'flex-start',
  },
  primaryButton: {
    marginTop: spacing.md,
  },
});

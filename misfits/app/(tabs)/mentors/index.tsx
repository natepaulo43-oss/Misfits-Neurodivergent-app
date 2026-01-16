import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Tag, Button, Card, EmptyState, LoadingSpinner, Screen } from '../../../components';
import { colors, spacing, typography, borderRadius } from '../../../constants/theme';
import { Mentor, MentorMatchResult, MentorMatchMetadata, MessageThread } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { fetchMentors } from '../../../services/mentors';
import { fetchMentorMatches } from '../../../services/matching';
import { computeLocalMatches, LocalMatchResult } from '../../../services/matchingLocal';
import { batchCheckMentorAvailability } from '../../../services/availabilityCheck';
import { fetchThreads, startNewThread } from '../../../services/messages';
import { getOtherParticipantName } from '../../../data/mockMessages';

const MATCH_THRESHOLD_STRONG = 4;
const MATCH_THRESHOLD_GOOD = 2;

const determineFitLabel = (match: MentorMatchResult): 'Strong Fit' | 'Good Fit' | 'Potential Fit' => {
  const strongSignals = match.match_reasons.length;
  if (strongSignals >= MATCH_THRESHOLD_STRONG) return 'Strong Fit';
  if (strongSignals >= MATCH_THRESHOLD_GOOD) return 'Good Fit';
  return 'Potential Fit';
};

export default function MentorMatchesScreen() {
  const { user, updateProfile } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [matches, setMatches] = useState<MentorMatchResult[]>([]);
  const [localMatches, setLocalMatches] = useState<LocalMatchResult[]>([]);
  const [metadata, setMetadata] = useState<MentorMatchMetadata | null>(null);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [requestingIntroId, setRequestingIntroId] = useState<string | null>(null);
  const [introThreads, setIntroThreads] = useState<MessageThread[]>([]);
  const [introLoading, setIntroLoading] = useState(true);
  const [introRefreshing, setIntroRefreshing] = useState(false);
  const [introError, setIntroError] = useState<string | null>(null);
  const [updatingIntroStatus, setUpdatingIntroStatus] = useState(false);

  const hasStudentProfile = Boolean(user?.studentProfile);
  const isMentor = user?.role === 'mentor';
  const acceptingIntroRequests = user?.mentorProfile?.acceptingIntroRequests !== false;

  const mentorLookup = useMemo(() => {
    return mentors.reduce<Record<string, Mentor>>((acc, mentor) => {
      acc[mentor.id] = mentor;
      return acc;
    }, {});
  }, [mentors]);

  useEffect(() => {
    if (!user) return;
    if (isMentor) {
      loadIntroRequests();
    } else {
      loadMatches();
    }
  }, [isMentor, user?.studentProfile]);

  const loadMatches = async () => {
    if (!user || !user.studentProfile) {
      setMatchesLoading(false);
      return;
    }

    setMatchesLoading(true);
    setMatchesError(null);

    try {
      const mentorData = await fetchMentors();
      setMentors(mentorData);

      const mentorsWithProfiles = mentorData.filter(m => m.mentorProfile);
      
      const mentorIds = mentorsWithProfiles.map(m => m.id);
      const availabilityMap = await batchCheckMentorAvailability(mentorIds);
      
      const localResult = await computeLocalMatches(
        user.studentProfile,
        mentorsWithProfiles,
        availabilityMap
      );
      setLocalMatches(localResult.matches);
      
      try {
        const result = await fetchMentorMatches(user.studentProfile, mentorsWithProfiles);
        setMatches(result.matches);
        setMetadata(result.metadata);
      } catch (apiErr) {
        console.warn('External matching API unavailable, using local matching only', apiErr);
      }
    } catch (err) {
      console.error('Failed to load matches', err);
      setMatchesError('We could not load your matches right now. Please try again soon.');
    } finally {
      setMatchesLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const loadIntroRequests = async () => {
    if (!user) return;
    setIntroLoading(true);
    setIntroError(null);
    try {
      const threads = await fetchThreads(user.id);
      setIntroThreads(threads);
    } catch (err) {
      console.error('Failed to load intro requests', err);
      setIntroError('We could not load intro requests right now. Please try again soon.');
    } finally {
      setIntroLoading(false);
      setIntroRefreshing(false);
    }
  };

  const handleRefreshIntro = () => {
    setIntroRefreshing(true);
    loadIntroRequests();
  };

  const handleToggleIntroStatus = async () => {
    if (!user?.mentorProfile) {
      Alert.alert('Complete your profile', 'Please finish mentor onboarding to manage intro requests.');
      return;
    }

    setUpdatingIntroStatus(true);
    try {
      await updateProfile({
        mentorProfile: {
          ...user.mentorProfile,
          acceptingIntroRequests: !acceptingIntroRequests,
        },
      });
    } catch (err) {
      Alert.alert('Something went wrong', 'Unable to update your intro preferences right now.');
    } finally {
      setUpdatingIntroStatus(false);
    }
  };

  const renderIntroCard = (thread: MessageThread) => {
    if (!user) return null;
    const studentName = getOtherParticipantName(thread, user.id);
    return (
      <Card key={thread.id} style={styles.introCard}>
        <View style={styles.introHeader}>
          <Avatar name={studentName} size="medium" />
          <View style={styles.introHeaderText}>
            <Text style={styles.mentorName}>{studentName}</Text>
            <Text style={styles.introTimestamp}>{new Date(thread.lastMessageTime).toLocaleString()}</Text>
          </View>
        </View>
        <Text style={styles.introMessage} numberOfLines={2}>
          {thread.lastMessage}
        </Text>
        <View style={styles.cardActions}>
          <Button
            title="Open conversation"
            onPress={() => router.push(`/(tabs)/messages/${thread.id}`)}
            style={styles.cardButton}
          />
        </View>
      </Card>
    );
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

  const renderLocalMatchCard = (match: LocalMatchResult) => {
    const mentor = mentorLookup[match.mentorId];
    if (!mentor) return null;

    const mentorDetails = mentor.mentorProfile;
    const tags =
      mentorDetails?.focusAreas?.slice(0, 3) ||
      mentorDetails?.expertiseAreas?.slice(0, 3) ||
      mentor.expertise.slice(0, 3);

    return (
      <Card key={match.mentorId} style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <Avatar name={mentor.name} uri={mentor.profileImage} size="medium" />
          <View style={styles.matchHeaderText}>
            <Text style={styles.mentorName}>{mentor.name}</Text>
            <Text style={styles.mentorRole} numberOfLines={1}>
              {mentorDetails?.currentRole || mentor.bio}
            </Text>
            <View style={styles.availabilityBadge}>
              <View style={[
                styles.availabilityDot,
                match.isCurrentlyAvailable ? styles.availableDot : styles.unavailableDot
              ]} />
              <Text style={[
                styles.availabilityText,
                match.isCurrentlyAvailable ? styles.availableText : styles.unavailableText
              ]}>
                {match.isCurrentlyAvailable ? 'Available this week' : 'No slots this week'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tagRow}>
          {tags.map(tag => (
            <Tag key={tag} label={tag} />
          ))}
        </View>

        <View style={styles.matchReasons}>
          {match.reasons.slice(0, 3).map((reason, idx) => (
            <View key={`${match.mentorId}-${idx}`} style={styles.reasonRow}>
              <View style={styles.reasonIndicator} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>

        <View style={styles.cardActions}>
          <Button
            title="View Profile"
            variant="secondary"
            onPress={() => router.push(`/(tabs)/mentors/${match.mentorId}`)}
            style={styles.cardButton}
          />
          <Button
            title="Request Intro"
            onPress={() => handleRequestIntro(match.mentorId)}
            loading={requestingIntroId === match.mentorId}
            style={styles.cardButton}
          />
        </View>
      </Card>
    );
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

  if (isMentor) {
    if (introLoading && !introRefreshing) {
      return <LoadingSpinner fullScreen />;
    }

    return (
      <Screen
        scroll
        align="left"
        refreshControl={<RefreshControl refreshing={introRefreshing} onRefresh={handleRefreshIntro} />}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageEyebrow}>Mentor console</Text>
          <Text style={styles.pageTitle}>Stay in control of introductions.</Text>
          <Text style={styles.pageSubtitle}>
            Review new requests from students and pause intros whenever you need a break.
          </Text>
        </View>

        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>
              {acceptingIntroRequests ? 'Accepting new intro requests' : 'Intro requests paused'}
            </Text>
            <View style={[styles.statusPill, acceptingIntroRequests ? styles.statusPillActive : styles.statusPillPaused]}>
              <Text
                style={[
                  styles.statusPillText,
                  acceptingIntroRequests ? styles.statusPillTextActive : styles.statusPillTextPaused,
                ]}
              >
                {acceptingIntroRequests ? 'Open' : 'Paused'}
              </Text>
            </View>
          </View>
          <Text style={styles.statusCopy}>
            {acceptingIntroRequests
              ? 'Students who match with you can request an introduction.'
              : 'Students cannot request introductions while paused.'}
          </Text>
          <Button
            title={acceptingIntroRequests ? 'Pause intro requests' : 'Resume intro requests'}
            variant="outline"
            onPress={handleToggleIntroStatus}
            loading={updatingIntroStatus}
            style={styles.primaryButton}
          />
        </Card>

        {introError ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{introError}</Text>
            <Button
              title="Try again"
              variant="outline"
              onPress={loadIntroRequests}
              style={styles.errorBtn}
            />
          </Card>
        ) : null}

        <View style={styles.matchesSection}>
          {introThreads.length === 0 ? (
            <Card>
              <Text style={styles.noMatchesTitle}>No intro requests yet</Text>
              <Text style={styles.noMatchesCopy}>
                When students request an introduction, you’ll see them here.
              </Text>
            </Card>
          ) : (
            introThreads.map(renderIntroCard)
          )}
        </View>
      </Screen>
    );
  }

  if (matchesLoading && !refreshing) {
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

  const bestFits = localMatches.slice(0, 5);
  const bestFitIds = new Set(bestFits.map(m => m.mentorId));
  const remainingMentors = mentors.filter(m => !bestFitIds.has(m.id));

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
          Choose who feels right for you. We'll never rank you or rush your decision.
        </Text>
      </View>

      {matchesError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{matchesError}</Text>
          <Button title="Try again" variant="outline" onPress={loadMatches} style={styles.errorBtn} />
        </Card>
      ) : null}

      {bestFits.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Best Fits for You</Text>
            <Text style={styles.sectionSubtitle}>
              Mentors who match your goals and preferences, sorted by availability
            </Text>
          </View>
          <View style={styles.matchesSection}>
            {bestFits.map(renderLocalMatchCard)}
          </View>
        </>
      ) : (
        <Card>
          <Text style={styles.noMatchesTitle}>We're still searching</Text>
          <Text style={styles.noMatchesCopy}>
            We'll notify you as soon as mentors with compatible availability join. Try refreshing later.
          </Text>
          <Button title="Refresh" variant="outline" onPress={loadMatches} style={styles.primaryButton} />
        </Card>
      )}

      <View style={styles.secondarySection}>
        <Text style={styles.sectionTitle}>Want to explore more mentors?</Text>
        <Text style={styles.sectionSubtitle}>
          Browse all {remainingMentors.length} other approved mentors
        </Text>
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
  introCard: {
    gap: spacing.sm,
  },
  matchHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  introHeaderText: {
    flex: 1,
    gap: spacing.xs,
  },
  introTimestamp: {
    ...typography.caption,
    color: colors.textMuted,
  },
  introMessage: {
    ...typography.body,
    color: colors.textSecondary,
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
  statusCard: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statusTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusPillActive: {
    backgroundColor: colors.primaryLight,
  },
  statusPillPaused: {
    backgroundColor: colors.border,
  },
  statusPillText: {
    ...typography.caption,
    fontWeight: '600',
  },
  statusPillTextActive: {
    color: colors.primary,
  },
  statusPillTextPaused: {
    color: colors.textSecondary,
  },
  statusCopy: {
    ...typography.body,
    color: colors.textSecondary,
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
  sectionHeader: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availableDot: {
    backgroundColor: colors.success || '#10b981',
  },
  unavailableDot: {
    backgroundColor: colors.textMuted,
  },
  availabilityText: {
    ...typography.caption,
    fontWeight: '600',
  },
  availableText: {
    color: colors.success || '#10b981',
  },
  unavailableText: {
    color: colors.textMuted,
  },
});

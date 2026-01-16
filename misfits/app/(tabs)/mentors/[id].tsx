import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Avatar, Tag, Button, LoadingSpinner, Screen } from '../../../components';
import { colors, spacing, typography } from '../../../constants/theme';
import { Mentor, MentorAvailability } from '../../../types';
import { fetchMentorById } from '../../../services/mentors';
import { startNewThread } from '../../../services/messages';
import { getMentorAvailability } from '../../../services/scheduling';
import { useAuth } from '../../../context/AuthContext';

export default function MentorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [availability, setAvailability] = useState<MentorAvailability | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    loadMentor();
  }, [id]);

  const loadMentor = async () => {
    if (!id) return;
    try {
      const data = await fetchMentorById(id);
      setMentor(data);
      await checkMentorAvailability(id);
    } catch (error) {
      console.error('Failed to load mentor:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMentorAvailability = async (mentorId: string) => {
    setCheckingAvailability(true);
    try {
      const data = await getMentorAvailability(mentorId);
      setAvailability(data);
    } catch (error) {
      console.error('Failed to check availability:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleMessageMentor = async () => {
    if (!mentor) return;

    if (!user) {
      Alert.alert(
        'Login Required',
        'Please log in or create an account to message mentors.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Login', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    setMessaging(true);
    try {
      // TODO: Check if thread already exists before creating new one
      const thread = await startNewThread(
        user.id,
        user.name,
        mentor.id,
        mentor.name,
        `Hi ${mentor.name}, I'd like to connect with you!`
      );
      router.push(`/(tabs)/messages/${thread.id}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to start conversation');
    } finally {
      setMessaging(false);
    }
  };

  const handleBookSession = () => {
    if (!mentor) return;

    if (!user) {
      Alert.alert(
        'Login Required',
        'Please log in or create an account to book sessions.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Login', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    if (user.role !== 'student') {
      Alert.alert('Students Only', 'Only students can book sessions with mentors.');
      return;
    }

    if (!availability || !availability.weeklyBlocks || availability.weeklyBlocks.length === 0) {
      Alert.alert(
        'Availability Not Set',
        'This mentor hasn\'t set up their availability yet. Try messaging them instead!'
      );
      return;
    }

    router.push({
      pathname: '/(tabs)/book-session',
      params: { mentorId: mentor.id, mentorName: mentor.name },
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!mentor) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Mentor not found</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Avatar name={mentor.name} uri={mentor.profileImage} size="large" />
        <Text style={styles.name}>{mentor.name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bio}>{mentor.bio}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expertise</Text>
        <View style={styles.tags}>
          {mentor.expertise.map((tag, index) => (
            <Tag key={index} label={tag} />
          ))}
        </View>
      </View>

      {user?.role === 'student' && (
        <>
          <Button
            title={availability && availability.weeklyBlocks?.length > 0 ? "Book Session" : "Book Session (Unavailable)"}
            onPress={handleBookSession}
            disabled={!availability || !availability.weeklyBlocks || availability.weeklyBlocks.length === 0}
            style={styles.button}
          />
          {availability && availability.weeklyBlocks?.length > 0 && (
            <Text style={styles.availabilityHint}>
              ✓ Available for {availability.sessionDurations.join(', ')} min sessions
            </Text>
          )}
          {(!availability || !availability.weeklyBlocks || availability.weeklyBlocks.length === 0) && (
            <Text style={styles.unavailableHint}>
              This mentor hasn't set availability yet
            </Text>
          )}
        </>
      )}

      <Button
        title="Message Mentor"
        onPress={handleMessageMentor}
        loading={messaging}
        variant={user?.role === 'student' ? 'secondary' : 'primary'}
        style={styles.button}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  bio: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    marginTop: spacing.md,
  },
  availabilityHint: {
    ...typography.caption,
    color: colors.success,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  unavailableHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

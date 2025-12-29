import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Avatar, Tag, Button, LoadingSpinner } from '../../../components';
import { colors, spacing, typography } from '../../../constants/theme';
import { Mentor } from '../../../types';
import { fetchMentorById } from '../../../services/mentors';
import { startNewThread } from '../../../services/messages';
import { useAuth } from '../../../context/AuthContext';

export default function MentorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    loadMentor();
  }, [id]);

  const loadMentor = async () => {
    if (!id) return;
    try {
      const data = await fetchMentorById(id);
      setMentor(data);
    } catch (error) {
      console.error('Failed to load mentor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageMentor = async () => {
    if (!mentor || !user) return;

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

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!mentor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Mentor not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
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

        <Button
          title="Message Mentor"
          onPress={handleMessageMentor}
          loading={messaging}
          style={styles.button}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
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
});

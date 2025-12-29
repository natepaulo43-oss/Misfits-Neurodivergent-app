import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Card, Avatar, Tag, LoadingSpinner, EmptyState } from '../../../components';
import { colors, spacing, typography } from '../../../constants/theme';
import { Mentor } from '../../../types';
import { fetchMentors } from '../../../services/mentors';

export default function MentorsListScreen() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    try {
      const data = await fetchMentors();
      setMentors(data);
    } catch (error) {
      console.error('Failed to load mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMentor = ({ item }: { item: Mentor }) => (
    <Card 
      style={styles.card}
      onPress={() => router.push(`/(tabs)/mentors/${item.id}`)}
    >
      <View style={styles.cardContent}>
        <Avatar name={item.name} uri={item.profileImage} size="medium" />
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.bio} numberOfLines={2}>
            {item.bio}
          </Text>
          <View style={styles.tags}>
            {item.expertise.slice(0, 2).map((tag, index) => (
              <Tag key={index} label={tag} />
            ))}
          </View>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (mentors.length === 0) {
    return (
      <EmptyState
        title="No Mentors Available"
        message="Check back soon for new mentors joining our community."
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={mentors}
        renderItem={renderMentor}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardContent: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  bio: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

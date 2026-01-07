import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card, Avatar, Tag, LoadingSpinner, EmptyState, Button } from '../../../components';
import { colors, spacing, typography } from '../../../constants/theme';
import { Mentor } from '../../../types';
import { fetchMentors } from '../../../services/mentors';

export default function BrowseMentorsScreen() {
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
    <Card style={styles.card}>
      <View style={styles.cardContent}>
        <Avatar name={item.name} uri={item.profileImage} size="medium" />
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.bio} numberOfLines={2}>
            {item.bio}
          </Text>
          <View style={styles.tags}>
            {item.expertise.slice(0, 3).map(tag => (
              <Tag key={tag} label={tag} />
            ))}
          </View>
          <Button
            title="View Profile"
            variant="secondary"
            size="small"
            style={styles.viewButton}
            onPress={() => router.push(`/(tabs)/mentors/${item.id}`)}
          />
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (mentors.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="No Mentors Available"
          message="Check back soon for new mentors joining our community."
        />
      </Screen>
    );
  }

  return (
    <Screen padding="none" contentContainerStyle={styles.screenContent}>
      <FlatList
        data={mentors}
        renderItem={renderMentor}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  screenContent: {
    paddingTop: spacing.md,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  cardContent: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cardInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bio: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  viewButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Card, Tag, LoadingSpinner, EmptyState, Screen } from '../../../components';
import { colors, spacing, typography, borderRadius } from '../../../constants/theme';
import { Book } from '../../../types';
import { fetchBooks } from '../../../services/books';

export default function BooksListScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const data = await fetchBooks();
      setBooks(data);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderBook = ({ item }: { item: Book }) => (
    <Card 
      style={styles.card}
      onPress={() => router.push(`/(tabs)/books/${item.id}`)}
    >
      <View style={styles.cardContent}>
        <Image source={item.coverImage} style={styles.coverImage} />
        <View style={styles.cardInfo}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.author}>{item.author}</Text>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          <View style={styles.tags}>
            {item.tags.slice(0, 2).map((tag, index) => (
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

  if (books.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="No Books Available"
          message="Check back soon for new books in our collection."
        />
      </Screen>
    );
  }

  return (
    <Screen padding="none" contentContainerStyle={styles.screenContent}>
      <FlatList
        data={books}
        renderItem={renderBook}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardContent: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  coverImage: {
    width: 80,
    height: 120,
    borderRadius: borderRadius.sm,
    resizeMode: 'cover',
  },
  cardInfo: {
    flex: 1,
  },
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  author: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  price: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

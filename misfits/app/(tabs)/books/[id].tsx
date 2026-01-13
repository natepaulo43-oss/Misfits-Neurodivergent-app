import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Tag, Button, LoadingSpinner, Screen } from '../../../components';
import { colors, spacing, typography, borderRadius } from '../../../constants/theme';
import { Book } from '../../../types';
import { fetchBookById } from '../../../services/books';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBook();
  }, [id]);

  const loadBook = async () => {
    if (!id) return;
    try {
      const data = await fetchBookById(id);
      setBook(data);
    } catch (error) {
      console.error('Failed to load book:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!book) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Book not found</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.coverContainer}>
        <Image source={book.coverImage} style={styles.coverImage} resizeMode="cover" />
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>by {book.author}</Text>
        <Text style={styles.price}>${book.price.toFixed(2)}</Text>
        <Text style={styles.meta}>Publisher: {book.publisher}</Text>
        <Text style={styles.meta}>Published: {book.publicationDate}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{book.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tags</Text>
        <View style={styles.tags}>
          {book.tags.map((tag, index) => (
            <Tag key={index} label={tag} />
          ))}
        </View>
      </View>

      <Button
        title="View on Amazon"
        onPress={() => Linking.openURL(book.amazonUrl)}
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
  coverContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  coverImage: {
    width: 200,
    height: 300,
    borderRadius: borderRadius.md,
  },
  info: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  author: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  price: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '600',
  },
  meta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
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

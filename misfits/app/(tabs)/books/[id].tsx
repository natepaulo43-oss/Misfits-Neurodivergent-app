import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Tag, Button, LoadingSpinner } from '../../../components';
import { colors, spacing, typography, borderRadius } from '../../../constants/theme';
import { Book } from '../../../types';
import { fetchBookById, purchaseBook } from '../../../services/books';
import { useAuth } from '../../../context/AuthContext';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

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

  const handlePurchase = async () => {
    if (!book || !user) return;

    setPurchasing(true);
    try {
      // Mock purchase flow per PRD - no actual payment processing
      await purchaseBook(book.id, user.id);
      Alert.alert(
        'Purchase Successful',
        `Thank you for purchasing "${book.title}"! This is a mock purchase for the MVP.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to complete purchase');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!book) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Book not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.coverContainer}>
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverText}>📚</Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>by {book.author}</Text>
          <Text style={styles.price}>${book.price.toFixed(2)}</Text>
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
          title={`Buy Book - $${book.price.toFixed(2)}`}
          onPress={handlePurchase}
          loading={purchasing}
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
  coverContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  coverPlaceholder: {
    width: 150,
    height: 220,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: {
    fontSize: 64,
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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  FlatList,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
} from 'react-native';

import { Screen, Card, Tag, Button, LoadingSpinner, EmptyState, Input } from '../../../components';
import { useAuth } from '../../../context/AuthContext';
import {
  CuratedContent,
  CuratedContentAudience,
  CuratedContentCategory,
  CuratedContentFormat,
} from '../../../types';
import { fetchPublishedCuratedContent } from '../../../services/curatedContent';
import { colors, spacing, typography, borderRadius } from '../../../constants/theme';

type FormatFilter = CuratedContentFormat | 'all';

const categoryFilters: { label: string; value: CuratedContentCategory }[] = [
  { label: 'Stories', value: 'stories' },
  { label: 'Academic', value: 'academic_tips' },
  { label: 'Organization', value: 'organization' },
  { label: 'Confidence', value: 'confidence' },
  { label: 'Mentor spotlight', value: 'mentor_spotlight' },
  { label: 'Marketplace', value: 'marketplace' },
];

const formatFilters: { label: string; value: FormatFilter }[] = [
  { label: 'All formats', value: 'all' },
  { label: 'Articles', value: 'article' },
  { label: 'Videos', value: 'video' },
  { label: 'Visuals', value: 'image' },
  { label: 'Resources', value: 'resource' },
];

export default function CuratedContentScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 400;
  const audience: CuratedContentAudience | 'all' =
    user?.role === 'mentor' ? 'mentor' : user?.role === 'student' ? 'student' : 'all';

  const [items, setItems] = useState<CuratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState<CuratedContentCategory[]>([]);
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPublishedCuratedContent(audience);
      setItems(data);
    } catch (error) {
      console.error('[curated] Failed to load curated content', error);
    } finally {
      setLoading(false);
    }
  }, [audience]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchPublishedCuratedContent(audience);
      setItems(data);
    } finally {
      setRefreshing(false);
    }
  }, [audience]);

  const featured = useMemo(() => items.filter(item => item.featured), [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory =
        activeCategories.length === 0 ||
        activeCategories.some(category => item.categories.includes(category));
      const matchesFormat = formatFilter === 'all' || item.format === formatFilter;
      const matchesFeatured = !featuredOnly || item.featured;
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesFormat && matchesFeatured && matchesSearch;
    });
  }, [items, activeCategories, formatFilter, featuredOnly, searchQuery]);

  const heroItem = featured[0] ?? items[0];

  const toggleCategory = (category: CuratedContentCategory) => {
    setActiveCategories(prev =>
      prev.includes(category) ? prev.filter(cat => cat !== category) : [...prev, category],
    );
  };

  const openLink = async (url?: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open URL', error);
    }
  };

  const renderCategoryFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterScroller}
    >
      {categoryFilters.map(option => {
        const active = activeCategories.includes(option.value);
        return (
          <Pressable
            key={option.value}
            style={[styles.filterChip, active && styles.filterChipActive]}
            onPress={() => toggleCategory(option.value)}
          >
            <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const renderFormatFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterScroller}
    >
      {formatFilters.map(option => {
        const active = option.value === formatFilter;
        return (
          <Pressable
            key={option.value}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => setFormatFilter(option.value)}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
      <Pressable
        style={[styles.pill, featuredOnly && styles.pillActive]}
        onPress={() => setFeaturedOnly(prev => !prev)}
      >
        <Text style={[styles.pillText, featuredOnly && styles.pillTextActive]}>Featured</Text>
      </Pressable>
    </ScrollView>
  );

  const renderContentCard = ({ item }: { item: CuratedContent }) => {
    const expanded = expandedId === item.id;
    return (
      <Card style={styles.contentCard}>
        <Pressable onPress={() => setExpandedId(expanded ? null : item.id)}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardEyebrow}>
                {item.audience === 'all'
                  ? 'For students & mentors'
                  : item.audience === 'student'
                    ? 'Student focus'
                    : 'Mentor focus'}{' '}
                • {item.format.toUpperCase()}
              </Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSummary}>{item.summary}</Text>
            </View>
            <View style={styles.metaRight}>
              {item.featured ? <Tag label="Featured" /> : null}
              <Text style={styles.metaTime}>
                {item.publishedAt
                  ? new Date(item.publishedAt).toLocaleDateString()
                  : 'Unscheduled'}
              </Text>
            </View>
          </View>
        </Pressable>
        <View style={styles.tagList}>
          {item.categories.map(category => (
            <Tag key={category} label={category.replace('_', ' ')} />
          ))}
          {item.tags?.map(tag => (
            <Tag key={tag} label={tag} />
          ))}
        </View>
        {expanded ? (
          <View style={styles.expandedBody}>
            <Text style={styles.bodyText}>{item.body}</Text>
            {item.mentorRecommendationNote ? (
              <View style={styles.callout}>
                <Text style={styles.calloutLabel}>Mentorship pairing</Text>
                <Text style={styles.calloutBody}>{item.mentorRecommendationNote}</Text>
              </View>
            ) : null}
            {item.marketplaceRecommendationUrl ? (
              <Button
                title="Open marketplace resource"
                variant="outline"
                onPress={() => openLink(item.marketplaceRecommendationUrl)}
              />
            ) : null}
            {item.mediaUrl ? (
              <Button
                title="View media"
                onPress={() => openLink(item.mediaUrl)}
                style={styles.mediaButton}
              />
            ) : null}
            {item.relatedMentorIds && item.relatedMentorIds.length > 0 ? (
              <View style={styles.callout}>
                <Text style={styles.calloutLabel}>Suggested mentors</Text>
                <Text style={styles.calloutBody}>{item.relatedMentorIds.join(', ')}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Card>
    );
  };

  const renderContentList = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    if (filteredItems.length === 0) {
      return (
        <EmptyState
          title="No matching content"
          message="Adjust filters or check back later for new drops from the Misfits team."
        />
      );
    }

    return (
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={renderContentCard}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        scrollEnabled={false}
      />
    );
  };

  return (
    <Screen scroll align="left">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {audience === 'mentor'
            ? 'Mentor enablement library'
            : 'Curated neurodivergent success library'}
        </Text>
        <Text style={styles.headerSubtitle}>
          Hand-picked stories, tactics, and mentor spotlights published by the Misfits team. Filter
          and send resources directly to mentees or personal notebooks.
        </Text>
      </View>

      {heroItem ? (
        <Card style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Featured drop</Text>
          <Text style={styles.heroTitle}>{heroItem.title}</Text>
          <Text style={styles.heroSummary}>{heroItem.summary}</Text>
          <View style={styles.heroTags}>
            {heroItem.categories.map(category => (
              <Tag key={category} label={category.replace('_', ' ')} />
            ))}
          </View>
          <Button
            title="Read more"
            onPress={() => setExpandedId(heroItem.id)}
            variant="primary"
          />
        </Card>
      ) : null}

      <Card style={[styles.filtersCard, isCompact && styles.filtersCardCompact]}>
        <Text style={styles.filtersTitle}>Filter and personalize</Text>
        {renderCategoryFilters()}
        {renderFormatFilters()}
        <Input
          label="Search keywords"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="e.g. focus, mentor spotlight, sensory"
        />
      </Card>

      <View style={[styles.listWrapper, isCompact && styles.listWrapperCompact]}>
        {renderContentList()}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.title,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  heroCard: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  heroEyebrow: {
    ...typography.caption,
    letterSpacing: 1,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  heroTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  heroSummary: {
    ...typography.body,
    color: colors.textSecondary,
  },
  heroTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filtersCard: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  filtersCardCompact: {
    padding: spacing.md,
  },
  filtersTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  filterScroller: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  pillText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  searchRow: {
    gap: spacing.xs,
  },
  searchLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  searchInput: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchPlaceholder: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  listWrapper: {
    width: '100%',
  },
  listWrapperCompact: {
    marginHorizontal: -spacing.sm,
  },
  list: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  contentCard: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardEyebrow: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSummary: {
    ...typography.body,
    color: colors.textSecondary,
  },
  metaRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  metaTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  expandedBody: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bodyText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  callout: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: spacing.sm,
  },
  calloutLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calloutBody: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  mediaButton: {
    marginTop: spacing.xs,
  },
});

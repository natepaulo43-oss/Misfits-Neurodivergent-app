import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AdminLayout, Button, Card, Input, LoadingSpinner, Tag } from '../../components';
import {
  CuratedContent,
  CuratedContentAudience,
  CuratedContentCategory,
  CuratedContentFormat,
  CuratedContentPayload,
  CuratedContentStatus,
} from '../../types';
import {
  createCuratedContent,
  deleteCuratedContent,
  fetchAllCuratedContent,
  setCuratedContentStatus,
  toggleCuratedContentFeatured,
  updateCuratedContent,
} from '../../services/curatedContent';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

const categoryOptions: { label: string; value: CuratedContentCategory }[] = [
  { label: 'Stories', value: 'stories' },
  { label: 'Academic tips', value: 'academic_tips' },
  { label: 'Organization', value: 'organization' },
  { label: 'Confidence', value: 'confidence' },
  { label: 'Mentor spotlight', value: 'mentor_spotlight' },
  { label: 'Marketplace', value: 'marketplace' },
];

const formatOptions: { label: string; value: CuratedContentFormat }[] = [
  { label: 'Article', value: 'article' },
  { label: 'Video', value: 'video' },
  { label: 'Image', value: 'image' },
  { label: 'Resource', value: 'resource' },
];

const audienceOptions: { label: string; value: CuratedContentAudience }[] = [
  { label: 'All', value: 'all' },
  { label: 'Students', value: 'student' },
  { label: 'Mentors', value: 'mentor' },
];

const statusOptions: { label: string; value: CuratedContentStatus }[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
];

const defaultForm: CuratedContentPayload = {
  title: '',
  summary: '',
  body: '',
  categories: [],
  format: 'article',
  mediaUrl: '',
  thumbnailUrl: '',
  featured: false,
  status: 'draft',
  audience: 'student',
  authorName: '',
  mentorRecommendationNote: '',
  marketplaceRecommendationUrl: '',
  relatedMentorIds: [],
  tags: [],
  publishedAt: undefined,
};

export default function CuratedContentAdminScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 900;
  const [content, setContent] = useState<CuratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<CuratedContentPayload>(defaultForm);
  const [mentorIdsText, setMentorIdsText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CuratedContentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftExpanded, setDraftExpanded] = useState(true);
  const [publishedExpanded, setPublishedExpanded] = useState(true);
  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const [deleteInFlightId, setDeleteInFlightId] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchAllCuratedContent();
      setContent(items);
    } catch (error) {
      console.error('[admin] Failed to load curated content', error);
      Alert.alert('Unable to load content', 'Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleEdit = (item: CuratedContent) => {
    setSelectedId(item.id);
    setForm({
      title: item.title,
      summary: item.summary,
      body: item.body,
      categories: item.categories,
      format: item.format,
      mediaUrl: item.mediaUrl,
      thumbnailUrl: item.thumbnailUrl,
      featured: Boolean(item.featured),
      status: item.status,
      audience: item.audience,
      authorName: item.authorName,
      mentorRecommendationNote: item.mentorRecommendationNote,
      marketplaceRecommendationUrl: item.marketplaceRecommendationUrl,
      relatedMentorIds: item.relatedMentorIds ?? [],
      tags: item.tags ?? [],
      publishedAt: item.publishedAt,
    });
    setMentorIdsText((item.relatedMentorIds ?? []).join(', '));
    setTagsText((item.tags ?? []).join(', '));
  };

  const handleResetForm = () => {
    setSelectedId(null);
    setForm(defaultForm);
    setMentorIdsText('');
    setTagsText('');
  };

  const applyTextCollections = (payload: CuratedContentPayload): CuratedContentPayload => ({
    ...payload,
    relatedMentorIds: mentorIdsText
      .split(',')
      .map(id => id.trim())
      .filter(Boolean),
    tags: tagsText
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean),
  });

  const handleSave = async () => {
    if (!form.title || !form.summary) {
      Alert.alert('Missing fields', 'Title and summary are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = applyTextCollections(form);
      if (selectedId) {
        await updateCuratedContent(selectedId, payload);
      } else {
        await createCuratedContent(payload);
        handleResetForm();
      }
      await loadContent();
      Alert.alert('Saved', 'Content updated successfully.');
    } catch (error) {
      console.error('[admin] Failed to save curated content', error);
      Alert.alert('Save failed', 'Please retry once you have a stable connection.');
    } finally {
      setSaving(false);
    }
  };

  const performDelete = async (id: string) => {
    setDeleteInFlightId(id);
    try {
      await deleteCuratedContent(id);
      setContent(prev => prev.filter(item => item.id !== id));
      if (selectedId === id) {
        handleResetForm();
      }
      await loadContent();
    } catch (error) {
      console.error('[admin] Failed to delete curated content', error);
      Alert.alert('Delete failed', 'Please retry.');
    } finally {
      setDeleteInFlightId(null);
    }
  };

  const requestDelete = (id: string) => {
    const executeDelete = () => {
      void performDelete(id);
    };

    if (Platform.OS === 'web') {
      const confirmFn = (globalThis as typeof globalThis & {
        confirm?: (message?: string) => boolean;
      }).confirm;
      const confirmed =
        typeof confirmFn === 'function'
          ? confirmFn('Delete content?\nThis will remove the piece for all audiences.')
          : true;

      if (confirmed) {
        executeDelete();
      }
      return;
    }

    Alert.alert('Delete content?', 'This will remove the piece for all audiences.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: executeDelete },
    ]);
  };

  const handleStatusChange = async (id: string, status: CuratedContentStatus) => {
    try {
      await setCuratedContentStatus(id, status);
      await loadContent();
      if (selectedId === id) {
        setForm(prev => ({ ...prev, status }));
      }
    } catch (error) {
      console.error('[admin] Failed to update content status', error);
      Alert.alert('Update failed', 'Unable to change status. Please retry.');
    }
  };

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    try {
      await toggleCuratedContentFeatured(id, featured);
      await loadContent();
      if (selectedId === id) {
        setForm(prev => ({ ...prev, featured }));
      }
    } catch (error) {
      console.error('[admin] Failed to toggle featured flag', error);
      Alert.alert('Update failed', 'Unable to update featured flag.');
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredContent = useMemo(() => {
    return content.filter(item => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        (item.summary ?? '').toLowerCase().includes(normalizedSearch) ||
        item.status.toLowerCase().includes(normalizedSearch) ||
        item.categories.some(category => category.toLowerCase().includes(normalizedSearch)) ||
        (item.tags ?? []).some(tag => tag.toLowerCase().includes(normalizedSearch));
      return matchesStatus && matchesSearch;
    });
  }, [content, statusFilter, normalizedSearch]);

  const draftContent = useMemo(
    () => filteredContent.filter(item => item.status === 'draft'),
    [filteredContent],
  );

  const publishedContent = useMemo(
    () => filteredContent.filter(item => item.status === 'published'),
    [filteredContent],
  );

  const archivedContent = useMemo(
    () => filteredContent.filter(item => item.status === 'archived'),
    [filteredContent],
  );

  const renderFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterScroller}
    >
      {['all', ...statusOptions.map(option => option.value)].map(value => {
        const active = statusFilter === value;
        return (
          <Pressable
            key={value}
            style={[styles.filterChip, active && styles.filterChipActive]}
            onPress={() => setStatusFilter(value as typeof statusFilter)}
          >
            <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
              {value === 'all' ? 'All statuses' : value}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const renderContentCard = (item: CuratedContent) => (
    <Card key={item.id} style={styles.contentCard}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>
            {item.status.toUpperCase()} • {item.audience.toUpperCase()} •{' '}
            {item.categories.join(', ')}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <Button
            title="Edit"
            size="small"
            variant="secondary"
            onPress={() => handleEdit(item)}
          />
          <Button
            title={item.featured ? 'Unfeature' : 'Feature'}
            size="small"
            variant="outline"
            onPress={() => handleToggleFeatured(item.id, !item.featured)}
          />
        </View>
      </View>
      <Text style={styles.cardSummary}>{item.summary}</Text>
      <View style={styles.tagRow}>
        {item.tags?.map(tag => (
          <Tag key={tag} label={tag} />
        ))}
      </View>
      <View style={styles.inlineActions}>
        <Button
          title={item.status === 'published' ? 'Unpublish' : 'Publish'}
          size="small"
          onPress={() =>
            handleStatusChange(item.id, item.status === 'published' ? 'draft' : 'published')
          }
        />
        {item.status !== 'archived' ? (
          <Button
            title="Archive"
            size="small"
            variant="outline"
            onPress={() => handleStatusChange(item.id, 'archived')}
          />
        ) : null}
        <Button
          title="Delete"
          size="small"
          variant="danger"
          onPress={() => requestDelete(item.id)}
          loading={deleteInFlightId === item.id}
          disabled={deleteInFlightId === item.id}
        />
      </View>
    </Card>
  );

  const renderPublishedShelf = () => (
    <Card style={styles.draftCard}>
      <Pressable style={styles.sectionHeader} onPress={() => setPublishedExpanded(!publishedExpanded)}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>Published workspace</Text>
          <Text style={styles.sectionSubtitle}>
            {publishedContent.length === 0
              ? 'No published content yet'
              : `${publishedContent.length} live piece${publishedContent.length === 1 ? '' : 's'}`}
          </Text>
        </View>
        <Ionicons 
          name={publishedExpanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={colors.textSecondary} 
        />
      </Pressable>
      {publishedExpanded && (
        <ScrollView
          style={styles.workspaceScroller}
          contentContainerStyle={styles.draftList}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {publishedContent.length === 0 ? (
            <Text style={styles.emptyLabel}>
              {statusFilter === 'all'
                ? 'Once you publish content it will show up here.'
                : 'No published content matches the current filters.'}
            </Text>
          ) : (
            publishedContent.map(renderContentCard)
          )}
        </ScrollView>
      )}
    </Card>
  );

  const renderCategoryPicker = () => (
    <View style={styles.pillGroup}>
      {categoryOptions.map(option => {
        const active = form.categories.includes(option.value);
        return (
          <Pressable
            key={option.value}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() =>
              setForm(prev => ({
                ...prev,
                categories: active
                  ? prev.categories.filter(cat => cat !== option.value)
                  : [...prev.categories, option.value],
              }))
            }
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderSelectRow = (
    label: string,
    options: { label: string; value: string }[],
    value: string,
    onChange: (val: string) => void,
  ) => (
    <View style={styles.selectRow}>
      <Text style={styles.selectLabel}>{label}</Text>
      <View style={styles.pillGroup}>
        {options.map(option => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onChange(option.value)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderDraftShelf = () => (
    <Card style={styles.draftCard}>
      <Pressable style={styles.sectionHeader} onPress={() => setDraftExpanded(!draftExpanded)}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>Draft workspace</Text>
          <Text style={styles.sectionSubtitle}>
            {draftContent.length === 0
              ? 'No drafts yet'
              : `${draftContent.length} draft${draftContent.length === 1 ? '' : 's'}`}
          </Text>
        </View>
        <Ionicons 
          name={draftExpanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={colors.textSecondary} 
        />
      </Pressable>
      {draftExpanded && (
        <ScrollView
          style={styles.workspaceScroller}
          contentContainerStyle={styles.draftList}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {draftContent.length === 0 ? (
            <Text style={styles.emptyLabel}>
              {statusFilter === 'all'
                ? 'Drafts you save will appear here for review.'
                : 'No drafts match the current filters.'}
            </Text>
          ) : (
            draftContent.map(renderContentCard)
          )}
        </ScrollView>
      )}
    </Card>
  );

  const renderArchivedShelf = () => (
    <Card style={styles.draftCard}>
      <Pressable style={styles.sectionHeader} onPress={() => setArchivedExpanded(!archivedExpanded)}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>Archived content</Text>
          <Text style={styles.sectionSubtitle}>
            {archivedContent.length === 0
              ? 'No archived content yet'
              : `${archivedContent.length} archived piece${archivedContent.length === 1 ? '' : 's'}`}
          </Text>
        </View>
        <Ionicons 
          name={archivedExpanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={colors.textSecondary} 
        />
      </Pressable>
      {archivedExpanded && (
        <ScrollView
          style={styles.workspaceScroller}
          contentContainerStyle={styles.draftList}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {archivedContent.length === 0 ? (
            <Text style={styles.emptyLabel}>
              {statusFilter === 'all'
                ? 'Once you archive content it will show up here.'
                : 'No archived content matches the current filters.'}
            </Text>
          ) : (
            archivedContent.map(renderContentCard)
          )}
        </ScrollView>
      )}
    </Card>
  );

  const renderForm = () => (
    <Card style={[styles.formCard, isCompact && styles.formCardCompact]}>
      <View style={[styles.formHeader, isCompact && styles.formHeaderStack]}>
        <View style={styles.formHeaderText}>
          <Text style={styles.formTitle}>{selectedId ? 'Edit content' : 'Create content'}</Text>
          <Text style={styles.formSubtitle}>
            Craft stories, tips, mentor spotlights, and more. Published content instantly appears in
            the student & mentor hub.
          </Text>
        </View>
        <View style={[styles.formHeaderActions, isCompact && styles.formHeaderActionsStack]}>
          <Button title="New draft" variant="secondary" size="small" onPress={handleResetForm} />
        </View>
      </View>
      <Input label="Title" value={form.title} onChangeText={text => setForm(prev => ({ ...prev, title: text }))} />
      <Input
        label="Summary"
        value={form.summary}
        onChangeText={text => setForm(prev => ({ ...prev, summary: text }))}
        multiline
        numberOfLines={3}
      />
      <Input
        label="Body"
        value={form.body}
        onChangeText={text => setForm(prev => ({ ...prev, body: text }))}
        multiline
        numberOfLines={5}
      />
      {renderSelectRow('Format', formatOptions, form.format, value =>
        setForm(prev => ({ ...prev, format: value as CuratedContentFormat })),
      )}
      {renderSelectRow('Audience', audienceOptions, form.audience, value =>
        setForm(prev => ({ ...prev, audience: value as CuratedContentAudience })),
      )}
      {renderSelectRow('Status', statusOptions, form.status, value =>
        setForm(prev => ({ ...prev, status: value as CuratedContentStatus })),
      )}
      <Text style={styles.selectLabel}>Categories</Text>
      {renderCategoryPicker()}
      <Input
        label="Media or resource URL"
        value={form.mediaUrl ?? ''}
        onChangeText={text => setForm(prev => ({ ...prev, mediaUrl: text }))}
      />
      <Input
        label="Thumbnail URL"
        value={form.thumbnailUrl ?? ''}
        onChangeText={text => setForm(prev => ({ ...prev, thumbnailUrl: text }))}
      />
      <Input
        label="Author name"
        value={form.authorName ?? ''}
        onChangeText={text => setForm(prev => ({ ...prev, authorName: text }))}
      />
      <Input
        label="Mentor recommendation note"
        value={form.mentorRecommendationNote ?? ''}
        onChangeText={text => setForm(prev => ({ ...prev, mentorRecommendationNote: text }))}
        multiline
        numberOfLines={3}
      />
      <Input
        label="Marketplace recommendation URL"
        value={form.marketplaceRecommendationUrl ?? ''}
        onChangeText={text => setForm(prev => ({ ...prev, marketplaceRecommendationUrl: text }))}
      />
      <Input
        label="Related mentor IDs (comma separated)"
        value={mentorIdsText}
        onChangeText={setMentorIdsText}
      />
      <Input label="Tags (comma separated)" value={tagsText} onChangeText={setTagsText} />
      <View style={styles.formActions}>
        <Button
          title="Save draft"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
        />
        <Button
          title={form.featured ? 'Unmark as featured' : 'Mark as featured'}
          variant="outline"
          onPress={() => setForm(prev => ({ ...prev, featured: !prev.featured }))}
        />
      </View>
    </Card>
  );

  return (
    <AdminLayout
      title="Curated content studio"
      subtitle="Publish admin-controlled stories, spotlights, and resources for student and mentor hubs."
    >
      <View style={[styles.page, isCompact && styles.pageCompact]}>
        <ScrollView
          style={[
            styles.leftColumn,
            isCompact ? styles.leftColumnCompactSpacing : undefined,
            isCompact && styles.columnStack,
          ]}
          contentContainerStyle={styles.leftColumnContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={[styles.searchCard, isCompact && styles.searchCardCompact]}>
            <Input
              label="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by title or summary"
            />
            {renderFilters()}
          </Card>
          {loading ? (
            <View style={styles.spinnerWrap}>
              <LoadingSpinner />
            </View>
          ) : (
            <>
              {renderDraftShelf()}
              {renderPublishedShelf()}
              {renderArchivedShelf()}
            </>
          )}
        </ScrollView>
        {isCompact ? (
          <ScrollView
            style={[styles.columnStack, styles.rightColumnCompact]}
            contentContainerStyle={styles.rightColumnCompactContent}
            showsVerticalScrollIndicator={false}
          >
            {renderForm()}
          </ScrollView>
        ) : (
          <View style={styles.rightColumn}>{renderForm()}</View>
        )}
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    gap: spacing.xl,
    paddingVertical: spacing.lg,
    paddingBottom: 0,
  },
  pageCompact: {
    flexDirection: 'column',
    gap: spacing.xl,
  },
  leftColumn: {
    flex: 1,
    maxWidth: '50%',
  },
  leftColumnContent: {
    gap: spacing.xl,
    paddingBottom: 0,
  },
  leftColumnCompactSpacing: {
    gap: spacing.xl,
    maxWidth: '100%',
  },
  columnStack: {
    width: '100%',
    maxWidth: '100%',
    gap: spacing.xxl,
  },
  rightColumn: {
    flex: 1,
    maxWidth: '50%',
  },
  rightColumnCompact: {
    width: '100%',
    maxWidth: '100%',
  },
  rightColumnCompactContent: {
    paddingBottom: 0,
  },
  searchCard: {
    gap: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  searchCardCompact: {
    padding: spacing.lg,
  },
  filterScroller: {
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
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
  list: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  draftCard: {
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  workspaceScroller: {
    maxHeight: 320,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  sectionHeaderLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  draftList: {
    gap: spacing.sm,
  },
  listShell: {
    padding: 0,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  listShellCompact: {
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  spinnerWrap: {
    paddingVertical: spacing.lg,
  },
  listScrollerCompact: {
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  contentCard: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cardTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardSummary: {
    ...typography.body,
    color: colors.textSecondary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  formCard: {
    gap: spacing.sm,
    marginTop: 0,
    marginBottom: 0,
    paddingBottom: spacing.sm,
  },
  formCardCompact: {
    marginTop: 0,
    marginBottom: 0,
    paddingBottom: spacing.sm,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  formHeaderStack: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  formHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  formHeaderActions: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  formHeaderActionsStack: {
    alignSelf: 'stretch',
    marginTop: 0,
  },
  formTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  formSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flexShrink: 1,
    width: '100%',
  },
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
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
  selectRow: {
    gap: spacing.xs,
  },
  selectLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginBottom: 0,
  },
  emptyLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

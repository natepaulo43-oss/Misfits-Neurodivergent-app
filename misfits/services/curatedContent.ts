import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from './firebase';
import {
  CuratedContent,
  CuratedContentAudience,
  CuratedContentPayload,
  CuratedContentStatus,
} from '../types';
import { getMockCuratedContent, getMockPublishedCuratedContent } from '../data/mockCuratedContent';
import {
  MAX_LENGTHS,
  sanitizeId,
  sanitizeMultiline,
  sanitizeOptional,
  sanitizeTagList,
  sanitizeText,
  sanitizeUrl,
} from '../utils/sanitize';

const sanitizeCuratedPayload = <T extends Partial<CuratedContentPayload>>(payload: T): T => {
  const result: any = { ...payload };
  if (typeof payload.title === 'string') {
    result.title = sanitizeText(payload.title, MAX_LENGTHS.shortLine);
  }
  if (typeof payload.summary === 'string') {
    result.summary = sanitizeMultiline(payload.summary, MAX_LENGTHS.bio);
  }
  if (typeof payload.body === 'string') {
    result.body = sanitizeMultiline(payload.body, MAX_LENGTHS.body);
  }
  if (typeof payload.authorName !== 'undefined') {
    result.authorName = sanitizeOptional(payload.authorName, MAX_LENGTHS.name);
  }
  if (typeof payload.mentorRecommendationNote !== 'undefined') {
    result.mentorRecommendationNote = sanitizeOptional(
      payload.mentorRecommendationNote,
      MAX_LENGTHS.bio,
      true,
    );
  }
  if (typeof payload.mediaUrl !== 'undefined') {
    result.mediaUrl = payload.mediaUrl ? sanitizeUrl(payload.mediaUrl) || undefined : undefined;
  }
  if (typeof payload.thumbnailUrl !== 'undefined') {
    result.thumbnailUrl = payload.thumbnailUrl
      ? sanitizeUrl(payload.thumbnailUrl) || undefined
      : undefined;
  }
  if (typeof payload.marketplaceRecommendationUrl !== 'undefined') {
    result.marketplaceRecommendationUrl = payload.marketplaceRecommendationUrl
      ? sanitizeUrl(payload.marketplaceRecommendationUrl) || undefined
      : undefined;
  }
  if (Array.isArray(payload.tags)) {
    result.tags = sanitizeTagList(payload.tags, 40, MAX_LENGTHS.tag);
  }
  if (Array.isArray(payload.relatedMentorIds)) {
    const ids: string[] = [];
    for (const raw of payload.relatedMentorIds) {
      const id = sanitizeId(raw);
      if (id) ids.push(id);
      if (ids.length >= 50) break;
    }
    result.relatedMentorIds = ids;
  }
  if (Array.isArray(payload.categories)) {
    // Categories are a fixed enum; still enforce tag-list safety on strings.
    result.categories = sanitizeTagList(payload.categories, 20, MAX_LENGTHS.shortLine);
  }
  return result as T;
};

const curatedContentCollection = collection(db, 'curatedContent');

type CuratedContentDocument = CuratedContentPayload & {
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
};

const mapDocToCuratedContent = (docId: string, data: CuratedContentDocument): CuratedContent => {
  const safeNow = new Date().toISOString();
  return {
    id: docId,
    title: data.title,
    summary: data.summary,
    body: data.body,
    categories: data.categories || [],
    format: data.format,
    mediaUrl: data.mediaUrl,
    thumbnailUrl: data.thumbnailUrl,
    featured: Boolean(data.featured),
    status: data.status || 'draft',
    audience: data.audience || 'all',
    authorName: data.authorName,
    mentorRecommendationNote: data.mentorRecommendationNote,
    marketplaceRecommendationUrl: data.marketplaceRecommendationUrl,
    relatedMentorIds: data.relatedMentorIds || [],
    tags: data.tags || [],
    publishedAt: data.publishedAt,
    createdAt: data.createdAt || safeNow,
    updatedAt: data.updatedAt || safeNow,
  };
};

const filterByAudience = (
  items: CuratedContent[],
  audience: CuratedContentAudience | 'all',
): CuratedContent[] => {
  if (audience === 'all') return items;
  return items.filter(item => item.audience === 'all' || item.audience === audience);
};

export const fetchPublishedCuratedContent = async (
  audience: CuratedContentAudience | 'all',
): Promise<CuratedContent[]> => {
  try {
    const snapshot = await getDocs(query(curatedContentCollection, where('status', '==', 'published')));
    const items = snapshot.docs.map(docSnap => mapDocToCuratedContent(docSnap.id, docSnap.data() as CuratedContentDocument));
    return filterByAudience(items, audience).sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.publishedAt || b.updatedAt).getTime() - new Date(a.publishedAt || a.updatedAt).getTime();
    });
  } catch (error) {
    console.error('[curatedContent] Failed to fetch published content from Firestore. Falling back to mock data.', error);
    return getMockPublishedCuratedContent(audience);
  }
};

export const fetchAllCuratedContent = async (): Promise<CuratedContent[]> => {
  try {
    const snapshot = await getDocs(query(curatedContentCollection, orderBy('updatedAt', 'desc')));
    return snapshot.docs.map(docSnap => mapDocToCuratedContent(docSnap.id, docSnap.data() as CuratedContentDocument));
  } catch (error) {
    console.error('[curatedContent] Failed to fetch content. Falling back to mock data.', error);
    return getMockCuratedContent();
  }
};

export const createCuratedContent = async (payload: CuratedContentPayload): Promise<string> => {
  const timestamp = new Date().toISOString();
  const safePayload = sanitizeCuratedPayload(payload);
  const docRef = await addDoc(curatedContentCollection, {
    ...safePayload,
    publishedAt: safePayload.status === 'published' ? safePayload.publishedAt ?? timestamp : null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return docRef.id;
};

export const updateCuratedContent = async (
  id: string,
  updates: Partial<CuratedContentPayload>,
): Promise<void> => {
  const docRef = doc(curatedContentCollection, id);
  const timestamp = new Date().toISOString();
  const safeUpdates = sanitizeCuratedPayload(updates);
  await updateDoc(docRef, {
    ...safeUpdates,
    updatedAt: timestamp,
    ...(updates.status === 'published' ? { publishedAt: updates.publishedAt ?? timestamp } : {}),
    ...(updates.status && updates.status !== 'published' ? { publishedAt: null } : {}),
  });
};

export const deleteCuratedContent = async (id: string): Promise<void> => {
  const docRef = doc(curatedContentCollection, id);
  await deleteDoc(docRef);
};

export const setCuratedContentStatus = async (
  id: string,
  status: CuratedContentStatus,
): Promise<void> => {
  const docRef = doc(curatedContentCollection, id);
  const timestamp = new Date().toISOString();
  await updateDoc(docRef, {
    status,
    updatedAt: timestamp,
    publishedAt: status === 'published' ? timestamp : null,
  });
};

export const toggleCuratedContentFeatured = async (
  id: string,
  featured: boolean,
): Promise<void> => {
  const docRef = doc(curatedContentCollection, id);
  await updateDoc(docRef, {
    featured,
    updatedAt: new Date().toISOString(),
  });
};

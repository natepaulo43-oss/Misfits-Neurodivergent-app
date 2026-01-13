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
  const docRef = await addDoc(curatedContentCollection, {
    ...payload,
    publishedAt: payload.status === 'published' ? payload.publishedAt ?? timestamp : null,
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
  await updateDoc(docRef, {
    ...updates,
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

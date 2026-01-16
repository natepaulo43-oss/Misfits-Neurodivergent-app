import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { MentorAvailability, Session } from '../types';
import { generateTimeSlots, getNextNDays, getDateString } from '../utils/scheduling';

const availabilityCollection = collection(db, 'mentorAvailability');
const sessionsCollection = collection(db, 'sessions');

export const checkMentorAvailabilityNext7Days = async (
  mentorId: string,
): Promise<boolean> => {
  try {
    const availRef = doc(availabilityCollection, mentorId);
    const snapshot = await getDoc(availRef);
    
    if (!snapshot.exists()) {
      return false;
    }
    
    const availability = {
      ...snapshot.data(),
      id: snapshot.id,
    } as MentorAvailability;
    
    if (!availability.weeklyBlocks || availability.weeklyBlocks.length === 0) {
      return false;
    }
    
    const today = new Date();
    const next7Days = getNextNDays(today, 7);
    
    const sessionsQuery = query(
      sessionsCollection,
      where('mentorId', '==', mentorId),
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    
    const allSessions = sessionsSnapshot.docs.map(docSnap => ({
      ...docSnap.data(),
      id: docSnap.id,
    } as Session));
    
    for (const date of next7Days) {
      const dateStr = getDateString(date);
      
      const relevantSessions = allSessions.filter(session => {
        const sessionDate = getDateString(new Date(session.requestedStart));
        return sessionDate === dateStr;
      });
      
      const defaultDuration = availability.sessionDurations?.[0] || 60;
      const slots = generateTimeSlots(availability, date, defaultDuration, relevantSessions);
      
      if (slots.length > 0) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`[availabilityCheck] Failed to check availability for mentor ${mentorId}`, error);
    return false;
  }
};

export const batchCheckMentorAvailability = async (
  mentorIds: string[],
): Promise<Map<string, boolean>> => {
  const availabilityMap = new Map<string, boolean>();
  
  const checks = mentorIds.map(async (mentorId) => {
    const isAvailable = await checkMentorAvailabilityNext7Days(mentorId);
    availabilityMap.set(mentorId, isAvailable);
  });
  
  await Promise.all(checks);
  
  return availabilityMap;
};

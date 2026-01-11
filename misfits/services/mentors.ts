import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Mentor, MentorProfile } from '../types';
import { getApprovedMentors, getMentorById } from '../data/mockMentors';

type MentorDocument = {
  name?: string;
  bio?: string;
  expertise?: string[];
  approved?: boolean;
  profileImage?: string;
  mentorProfile?: MentorProfile;
  mentorMatchingDisabled?: boolean;
};

const mentorsCollection = collection(db, 'users');

const mapDocToMentor = (docId: string, data: MentorDocument): Mentor | null => {
  if (!data?.mentorProfile) {
    return null;
  }

  const approved = data.approved !== false;
  const acceptingIntroRequests = data.mentorProfile.acceptingIntroRequests !== false;
  const matchingDisabled = data.mentorMatchingDisabled === true;

  if (!approved || matchingDisabled) {
    return null;
  }

  return {
    id: docId,
    name: data.name || data.mentorProfile.fullName,
    bio: data.bio || data.mentorProfile.shortBio || data.mentorProfile.currentRole || '',
    expertise: data.expertise || data.mentorProfile.expertiseAreas || [],
    approved,
    profileImage: data.profileImage,
    mentorProfile: data.mentorProfile,
    acceptingIntroRequests,
  };
};

export const fetchMentors = async (): Promise<Mentor[]> => {
  try {
    const q = query(mentorsCollection, where('role', '==', 'mentor'));
    const snapshot = await getDocs(q);

    const mentors = snapshot.docs
      .map(docSnap => mapDocToMentor(docSnap.id, docSnap.data() as MentorDocument))
      .filter((mentor): mentor is Mentor => mentor !== null);

    if (mentors.length === 0) {
      console.warn('No mentor profiles found in Firestore; falling back to mock data.');
      return getApprovedMentors();
    }

    return mentors;
  } catch (error) {
    console.error('Failed to fetch mentors from Firestore. Falling back to mock data.', error);
    return getApprovedMentors();
  }
};

export const fetchMentorById = async (id: string): Promise<Mentor | null> => {
  try {
    const mentorRef = doc(mentorsCollection, id);
    const snapshot = await getDoc(mentorRef);

    if (!snapshot.exists()) {
      return null;
    }

    return mapDocToMentor(snapshot.id, snapshot.data() as MentorDocument);
  } catch (error) {
    console.error(`Failed to fetch mentor ${id} from Firestore. Falling back to mock data.`, error);
    return getMentorById(id) || null;
  }
};

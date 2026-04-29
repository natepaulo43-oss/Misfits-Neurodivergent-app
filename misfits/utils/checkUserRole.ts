/**
 * Quick diagnostic utility to check user role and permissions
 * Run this in the browser console to debug permission issues
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getCurrentUser } from '../services/auth';

export async function checkUserRole() {
  const currentUser = getCurrentUser();
  
  const maskEmail = (email?: string | null) => {
    if (!email) return '[none]';
    const [, domain] = email.split('@');
    return `[redacted]@${domain ?? 'unknown'}`;
  };

  console.log('=== USER ROLE DIAGNOSTIC ===');
  console.log('1. Current User from Auth Context:');
  console.log('   - ID:', currentUser?.id);
  console.log('   - Email:', maskEmail(currentUser?.email));
  console.log('   - Role:', currentUser?.role);
  console.log('   - Account Suspended:', currentUser?.accountSuspended);
  
  if (!currentUser) {
    console.error('❌ No current user found - you may not be logged in');
    return;
  }
  
  try {
    const userDocRef = doc(db, 'users', currentUser.id);
    const userDoc = await getDoc(userDocRef);
    
    console.log('2. Firestore User Document:');
    console.log('   - Exists:', userDoc.exists());
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('   - Role field:', data.role);
      console.log('   - Account Suspended:', data.accountSuspended);
      console.log('   - Document fields:', Object.keys(data));
      
      if (data.role === 'mentor') {
        console.log('✅ User has mentor role in Firestore');
      } else {
        console.error('❌ User role is NOT mentor:', data.role);
        console.log('💡 Fix: Update Firestore users/' + currentUser.id + ' to have role: "mentor"');
      }
    } else {
      console.error('❌ User document does not exist in Firestore');
      console.log('💡 Fix: Create document at users/' + currentUser.id);
    }
  } catch (error) {
    console.error('❌ Error reading user document:', error);
  }
  
  console.log('=== END DIAGNOSTIC ===');
}

// Auto-run if imported
if (typeof window !== 'undefined') {
  (window as any).checkUserRole = checkUserRole;
  console.log('💡 Run checkUserRole() in console to diagnose permission issues');
}

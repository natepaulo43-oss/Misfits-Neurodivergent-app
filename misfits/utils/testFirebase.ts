/**
 * Firebase Connection Test Utility
 * 
 * Use this to verify Firebase is properly configured and connected.
 * Import and call testFirebaseConnection() from any component to test.
 */

import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  console.log('=== Firebase Connection Test ===');
  
  try {
    // Test 1: Check if Firebase is initialized
    console.log('✓ Firebase app initialized');
    console.log('  Auth instance:', auth ? 'OK' : 'MISSING');
    console.log('  Firestore instance:', db ? 'OK' : 'MISSING');
    
    // Test 2: Check current user
    const currentUser = auth.currentUser;
    console.log('✓ Current user:', currentUser ? currentUser.uid : 'Not logged in');
    
    if (!currentUser) {
      console.warn('⚠ No user logged in - cannot test Firestore operations');
      return {
        success: false,
        error: 'No user logged in',
      };
    }
    
    // Test 3: Try to read user document
    console.log('Testing Firestore read...');
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      console.log('✓ User document exists');
      console.log('  Data:', userDoc.data());
    } else {
      console.log('⚠ User document does not exist (will be created on first write)');
    }
    
    // Test 4: Try to write to user document
    console.log('Testing Firestore write...');
    const testData = {
      lastConnectionTest: new Date().toISOString(),
    };
    
    await setDoc(userDocRef, testData, { merge: true });
    console.log('✓ Successfully wrote to Firestore');
    
    // Test 5: Verify write
    const verifyDoc = await getDoc(userDocRef);
    if (verifyDoc.exists() && verifyDoc.data()?.lastConnectionTest) {
      console.log('✓ Write verified - Firestore is working correctly');
      return {
        success: true,
        userId: currentUser.uid,
        userData: verifyDoc.data(),
      };
    } else {
      console.error('✗ Write verification failed');
      return {
        success: false,
        error: 'Write verification failed',
      };
    }
  } catch (error) {
    console.error('✗ Firebase connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

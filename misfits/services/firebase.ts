import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAiHXOrZR4NSQP_7OJOMYERyZk14fhsScU',
  authDomain: 'misfits-fe486.firebaseapp.com',
  projectId: 'misfits-fe486',
  storageBucket: 'misfits-fe486.firebasestorage.app',
  messagingSenderId: '845863899218',
  appId: '1:845863899218:web:1fb1d06aedad404b44cf8b',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app, firebaseConfig };
export default app;

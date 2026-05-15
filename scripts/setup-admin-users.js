/**
 * One-time script: sets emailVerified + admin role for internal accounts.
 *
 * Run from the repo root:
 *   node scripts/setup-admin-users.js
 *
 * Credentials — use ONE of:
 *   A) Set GOOGLE_APPLICATION_CREDENTIALS env var to a service account key JSON path:
 *      $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\serviceAccountKey.json"
 *      node scripts/setup-admin-users.js
 *
 *   B) Pass the key path as first argument:
 *      node scripts/setup-admin-users.js C:\path\to\serviceAccountKey.json
 *
 * Download a service account key from:
 *   Firebase Console → Project Settings → Service accounts → Generate new private key
 */

const path = require('path');
const admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));

const keyPath = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!keyPath) {
  console.error(
    '\nNo credentials found.\n\n' +
    'Option A — pass the service account key path as an argument:\n' +
    '  node scripts/setup-admin-users.js "C:\\path\\to\\serviceAccountKey.json"\n\n' +
    'Option B — set the env var first:\n' +
    '  $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\path\\to\\serviceAccountKey.json"\n' +
    '  node scripts/setup-admin-users.js\n\n' +
    'Download a key: Firebase Console → Project Settings → Service accounts → Generate new private key\n'
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(keyPath),
  projectId: 'misfits-fe486',
});

const auth = admin.auth();
const db = admin.firestore();

const ACCOUNTS = [
  {
    email: 'admin@misfits.com',
    setEmailVerified: true,
    firestoreRole: 'admin',
  },
  {
    email: 'REDACTED',
    setEmailVerified: true,
    firestoreRole: null, // don't touch Firestore role — just verify email
  },
];

async function run() {
  for (const account of ACCOUNTS) {
    console.log(`\n--- ${account.email} ---`);

    let user;
    try {
      user = await auth.getUserByEmail(account.email);
      console.log(`  Auth UID: ${user.uid}`);
      console.log(`  Current emailVerified: ${user.emailVerified}`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.log(`  !! User not found in Firebase Auth. Skipping.`);
        continue;
      }
      throw err;
    }

    // Update Auth record
    if (account.setEmailVerified && !user.emailVerified) {
      await auth.updateUser(user.uid, { emailVerified: true });
      console.log(`  emailVerified set to true`);
    } else {
      console.log(`  emailVerified already true — no change`);
    }

    // Update Firestore role if requested
    if (account.firestoreRole) {
      const userRef = db.collection('users').doc(user.uid);
      const snap = await userRef.get();

      if (snap.exists) {
        const current = snap.data().role;
        if (current !== account.firestoreRole) {
          await userRef.update({ role: account.firestoreRole });
          console.log(`  Firestore role: ${current ?? '(none)'} → ${account.firestoreRole}`);
        } else {
          console.log(`  Firestore role already '${current}' — no change`);
        }
      } else {
        // Create minimal user doc with role so isAdmin() resolves correctly
        await userRef.set({ role: account.firestoreRole }, { merge: true });
        console.log(`  Firestore user doc created with role: ${account.firestoreRole}`);
      }
    }
  }

  console.log('\nDone.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

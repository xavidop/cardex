
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, type FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import firebaseConfig from '@/config/firebase';

// Define which keys from firebaseConfig are considered essential for initialization.
// These correspond to the keys in the firebaseConfig object in src/config/firebase.ts
const essentialConfigKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId'];

// Map these camelCase keys to their corresponding uppercase_snake_case environment variable names
// as they should appear in the .env file.
const configKeyToEnvVar: Record<keyof typeof firebaseConfig, string> = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
};

const missingEnvVars: string[] = [];

for (const key of essentialConfigKeys) {
  // Check if the value for the key in firebaseConfig (which comes from process.env) is falsy.
  if (!firebaseConfig[key]) {
    missingEnvVars.push(configKeyToEnvVar[key]); // Add the correctly formatted environment variable name.
  }
}

if (missingEnvVars.length > 0) {
  const errorMessage = `Firebase configuration is incomplete. Please check your .env file for the following missing or invalid keys: ${missingEnvVars.join(', ')}. Ensure the Next.js development server was restarted after any .env changes.`;
  console.error(errorMessage);
  // Log the state of firebaseConfig to help debug what values are actually being received.
  // This shows what process.env is providing to the firebaseConfig object.
  console.error("Current firebaseConfig values (derived from process.env, API key masked if present):", {
    apiKey: firebaseConfig.apiKey ? "********" : (process.env.NEXT_PUBLIC_FIREBASE_API_KEY === undefined ? "NOT_FOUND_IN_PROCESS_ENV" : "EMPTY_IN_PROCESS_ENV"),
    authDomain: firebaseConfig.authDomain || (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN === undefined ? "NOT_FOUND_IN_PROCESS_ENV" : "EMPTY_IN_PROCESS_ENV"),
    projectId: firebaseConfig.projectId || (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === undefined ? "NOT_FOUND_IN_PROCESS_ENV" : "EMPTY_IN_PROCESS_ENV"),
    storageBucket: firebaseConfig.storageBucket || (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET === undefined ? "NOT_ESSENTIAL_BUT_NOT_FOUND" : "NOT_ESSENTIAL_BUT_EMPTY"),
    messagingSenderId: firebaseConfig.messagingSenderId || (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID === undefined ? "NOT_ESSENTIAL_BUT_NOT_FOUND" : "NOT_ESSENTIAL_BUT_EMPTY"),
    appId: firebaseConfig.appId || (process.env.NEXT_PUBLIC_FIREBASE_APP_ID === undefined ? "NOT_ESSENTIAL_BUT_NOT_FOUND" : "NOT_ESSENTIAL_BUT_EMPTY"),
  });
  throw new Error(errorMessage);
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Track if emulators have been connected to avoid multiple connections
let emulatorsConnected = false;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Connect to emulators in development - do this immediately after getting auth/db instances
  if (process.env.NODE_ENV === 'development' && !emulatorsConnected) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
      emulatorsConnected = true;
      console.log('Firebase emulators connected successfully');
    } catch (error) {
      console.log('Emulator connection attempt (might already be connected):', error);
    }
  }
} catch (error) {
  console.error("Firebase SDK Initialization Error (this occurred *after* the initial config check passed, possibly an issue with the values themselves being invalid for Firebase):", error);
  // Log config again, but mask API key, to show what was passed to initializeApp
  console.error("Firebase Config passed to initializeApp (API key masked):", {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey ? "********" : "MISSING_OR_EMPTY_AT_SDK_INIT_TIME",
  });
  throw error; // Re-throw the original Firebase error
}

export { app, auth, db, storage };

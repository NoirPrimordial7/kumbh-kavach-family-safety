import { initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';

export interface SyncAdapter { mode: 'firebase' | 'local-demo'; connect(): Promise<void>; saveFamily(id: string, value: unknown): Promise<void> }

class LocalDemoAdapter implements SyncAdapter {
  mode = 'local-demo' as const;
  async connect() { return; }
  async saveFamily(id: string, value: unknown) { localStorage.setItem(`kavach:family:${id}`, JSON.stringify(value)); }
}

class FirebaseAdapter implements SyncAdapter {
  mode = 'firebase' as const; private app: FirebaseApp; private db: Firestore; private auth: Auth;
  constructor() {
    this.app = initializeApp({ apiKey: import.meta.env.VITE_FIREBASE_API_KEY, authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, appId: import.meta.env.VITE_FIREBASE_APP_ID });
    this.db = initializeFirestore(this.app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
    this.auth = getAuth(this.app); void this.db;
  }
  async connect() { if (!this.auth.currentUser) await signInAnonymously(this.auth); }
  async saveFamily(_id: string, _value: unknown) { /* Firestore writes are enabled after deployment security rules are configured. */ }
}

export const syncAdapter: SyncAdapter = import.meta.env.VITE_FIREBASE_API_KEY ? new FirebaseAdapter() : new LocalDemoAdapter();

import { firebaseEnvironment } from '@/config/environment';

export interface SyncAdapter {
  mode: 'firebase' | 'local-demo';
  connect(): Promise<void>;
  saveFamily(id: string, value: unknown): Promise<void>;
}

class LocalDemoAdapter implements SyncAdapter {
  mode = 'local-demo' as const;
  async connect() { return; }
  async saveFamily(id: string, value: unknown) {
    localStorage.setItem(`kavach:family:${id}`, JSON.stringify(value));
  }
}

class LazyFirebaseAdapter implements SyncAdapter {
  mode = 'firebase' as const;
  private connected = false;

  async connect() {
    if (this.connected) return;
    const [{ initializeApp }, firestore, auth] = await Promise.all([
      import('firebase/app'),
      import('firebase/firestore'),
      import('firebase/auth'),
    ]);
    const app = initializeApp(firebaseEnvironment.config);
    firestore.initializeFirestore(app, {
      localCache: firestore.persistentLocalCache({
        tabManager: firestore.persistentMultipleTabManager(),
      }),
    });
    const authentication = auth.getAuth(app);
    if (!authentication.currentUser) await auth.signInAnonymously(authentication);
    this.connected = true;
  }

  async saveFamily(_id: string, _value: unknown) {
    await this.connect();
    // Writes remain disabled until the deployment has trusted invite redemption.
  }
}

export const syncAdapter: SyncAdapter = firebaseEnvironment.configured
  ? new LazyFirebaseAdapter()
  : new LocalDemoAdapter();

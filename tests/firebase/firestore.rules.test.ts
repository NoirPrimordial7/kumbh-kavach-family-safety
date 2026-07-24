import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from 'vitest';

const projectId = 'demo-kumbh-kavach-rules';
const familyId = 'family-private-1';
let environment: RulesTestEnvironment;

const validSafetyConfig = {
  safeRadiusMeters: 50,
  warningRatio: 0.8,
  separationGraceSeconds: 5,
  staleTimeoutSeconds: 30,
  reunionRadiusMeters: 15,
  gpsAccuracyBufferMeters: 8,
  reunionStableSeconds: 3,
};

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync('firebase.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    await setDoc(doc(database, `families/${familyId}`), {
      guardianUid: 'guardian',
      name: 'Kumbh Kavach Team',
    });
    await setDoc(doc(database, `families/${familyId}/members/guardian`), {
      role: 'guardian',
    });
    await setDoc(doc(database, `families/${familyId}/members/member`), {
      role: 'member',
    });
    await setDoc(doc(database, `families/${familyId}/sessions/current`), {
      safetyConfig: validSafetyConfig,
      revision: 1,
    });
  });
});

afterAll(async () => {
  await environment.cleanup();
});

describe('private family Firestore rules', () => {
  it('allows a member to read family-scoped state but denies outsiders', async () => {
    const memberDb = environment.authenticatedContext('member').firestore();
    const outsiderDb = environment.authenticatedContext('outsider').firestore();
    await assertSucceeds(getDoc(doc(memberDb, `families/${familyId}/sessions/current`)));
    await assertFails(getDoc(doc(outsiderDb, `families/${familyId}/sessions/current`)));
  });

  it('allows only the guardian to update validated safety configuration', async () => {
    const guardianDb = environment.authenticatedContext('guardian').firestore();
    const memberDb = environment.authenticatedContext('member').firestore();
    await assertFails(updateDoc(doc(memberDb, `families/${familyId}/sessions/current`), {
      'safetyConfig.safeRadiusMeters': 20,
    }));
    await assertSucceeds(updateDoc(doc(guardianDb, `families/${familyId}/sessions/current`), {
      safetyConfig: { ...validSafetyConfig, safeRadiusMeters: 20 },
      revision: 2,
    }));
  });

  it('rejects guardian settings outside the supported range', async () => {
    const guardianDb = environment.authenticatedContext('guardian').firestore();
    await assertFails(updateDoc(doc(guardianDb, `families/${familyId}/sessions/current`), {
      safetyConfig: { ...validSafetyConfig, safeRadiusMeters: 1001 },
      revision: 2,
    }));
  });

  it('prevents a member from writing another member location', async () => {
    const memberDb = environment.authenticatedContext('member').firestore();
    await assertSucceeds(setDoc(doc(memberDb, `families/${familyId}/locations/member`), {
      lat: 20.005,
      lng: 73.794,
      accuracy: 8,
    }));
    await assertFails(setDoc(doc(memberDb, `families/${familyId}/locations/guardian`), {
      lat: 20.005,
      lng: 73.794,
      accuracy: 8,
    }));
  });
});

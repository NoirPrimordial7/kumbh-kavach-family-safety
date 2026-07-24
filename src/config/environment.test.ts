import { describe, expect, it } from 'vitest';
import { deriveFirebaseEnvironment } from './environment';

describe('Firebase environment validation', () => {
  it('selects local Demo Mode when variables are missing', () => {
    expect(deriveFirebaseEnvironment({})).toMatchObject({
      configured: false,
      config: {},
    });
  });

  it('rejects incomplete configuration without exposing undefined initialization', () => {
    const result = deriveFirebaseEnvironment({ apiKey: 'present' });
    expect(result.configured).toBe(false);
    expect(result.message).toMatch(/incomplete/i);
  });

  it('accepts a complete public client configuration', () => {
    expect(deriveFirebaseEnvironment({
      apiKey: 'key',
      authDomain: 'example.firebaseapp.com',
      projectId: 'example',
      appId: '1:2:web:3',
    }).configured).toBe(true);
  });
});

import { z } from 'zod';

const optionalText = z.string().trim().optional().transform((value) => value || undefined);
const firebaseSchema = z.object({
  apiKey: optionalText,
  authDomain: optionalText,
  projectId: optionalText,
  appId: optionalText,
}).superRefine((value, context) => {
  const values = [value.apiKey, value.authDomain, value.projectId, value.appId];
  const supplied = values.filter(Boolean).length;
  if (supplied > 0 && supplied < values.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Firebase configuration is incomplete; local Demo Mode will be used.',
    });
  }
});

export function deriveFirebaseEnvironment(source: {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  appId?: string;
}) {
  const parsed = firebaseSchema.safeParse(source);
  const values = parsed.success
    ? [parsed.data.apiKey, parsed.data.authDomain, parsed.data.projectId, parsed.data.appId]
    : [];
  return {
    configured: parsed.success && values.length === 4 && values.every(Boolean),
    config: parsed.success ? parsed.data : {},
    message: parsed.success
      ? undefined
      : parsed.error.issues[0]?.message,
  } as const;
}

export const firebaseEnvironment = deriveFirebaseEnvironment({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { authInstance } from './firebase';

export async function signInWithGoogle(): Promise<User> {
  if (!authInstance) {
    throw new Error(
      'Firebase is not configured. Set VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID in web/.env.local, then restart the dev server.'
    );
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(authInstance, provider);
  return credential.user;
}

export async function signOutUser(): Promise<void> {
  if (!authInstance) {
    throw new Error(
      'Firebase is not configured. Set VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID in web/.env.local, then restart the dev server.'
    );
  }

  await signOut(authInstance);
}

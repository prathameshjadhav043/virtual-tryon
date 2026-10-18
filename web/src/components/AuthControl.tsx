import React, { useState } from 'react';
import { LogOut, UserRound } from 'lucide-react';
import type { User } from 'firebase/auth';

interface AuthControlProps {
  user: User | null;
  ready: boolean;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

const GoogleMark: React.FC = () => (
  <svg aria-hidden="true" viewBox="0 0 48 48" className="google-mark">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.92c-.58 2.96-2.26 5.48-4.75 7.18l7.73 6C44.41 38.01 46.98 31.88 46.98 24.55Z" />
    <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
  </svg>
);

export const AuthControl: React.FC<AuthControlProps> = ({ user, ready, onSignIn, onSignOut }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAction = async (action: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (authError) {
      const code = authError && typeof authError === 'object' && 'code' in authError
        ? String(authError.code)
        : '';
      setError(
        code === 'auth/popup-closed-by-user'
          ? 'Google sign-in was cancelled.'
          : authError instanceof Error
            ? authError.message
            : 'Google sign-in could not be completed.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-control">
      {user ? (
        <>
          <span className="auth-user-chip" title={user.email || undefined}>
            <UserRound size={14} aria-hidden="true" />
            <span>{user.displayName || user.email || 'Signed in'}</span>
          </span>
          <button
            type="button"
            className="text-link-btn auth-action-btn"
            onClick={() => void runAction(onSignOut)}
            disabled={!ready || busy}
          >
            <LogOut size={14} aria-hidden="true" />
            <span>{busy ? 'Signing out…' : 'Sign out'}</span>
          </button>
        </>
      ) : (
        <button
          type="button"
          className="google-signin-btn"
          onClick={() => void runAction(onSignIn)}
          disabled={!ready || busy}
        >
          <GoogleMark />
          <span>{busy ? 'Connecting…' : 'Continue with Google'}</span>
        </button>
      )}
      {error && <span className="auth-error" role="alert">{error}</span>}
    </div>
  );
};

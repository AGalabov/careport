import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAsyncAction } from '../hooks/use-async-action';

function formatSignInError(err: unknown): string {
  if (err instanceof Error) {
    if (
      err.message.includes('invalid-credential') ||
      err.message.includes('wrong-password') ||
      err.message.includes('user-not-found')
    ) {
      return 'Invalid email or password.';
    }
    return 'Sign-in failed. Please try again.';
  }
  return 'Sign-in failed. Please try again.';
}

export default function AuthPage() {
  const { user, signIn, signInWithEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { error: googleError, trigger: triggerGoogleSignIn } = useAsyncAction(async () => {
    await signIn();
  });

  const { loading: submitting, error: emailError, trigger: triggerEmailSignIn } = useAsyncAction(
    async (em: string, pw: string) => {
      await signInWithEmail(em, pw);
    },
  );

  const error = googleError
    ? (googleError instanceof Error ? googleError.message : 'Google sign-in failed.')
    : emailError
      ? formatSignInError(emailError)
      : '';

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  function handleGoogleSignIn() {
    triggerGoogleSignIn();
  }

  function handleEmailSignIn(e: FormEvent) {
    e.preventDefault();
    triggerEmailSignIn(email, password);
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="/icon.svg" alt="Careport" className="w-20 h-20 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Careport</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Track your car's fuel usage and maintenance reminders
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl px-4 py-3 shadow-sm transition-colors"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-50 px-3 text-gray-400">or</span>
          </div>
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in with Email'}
          </button>
        </form>
      </div>
    </div>
  );
}

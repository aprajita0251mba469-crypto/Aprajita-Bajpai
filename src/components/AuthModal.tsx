import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { AlertCircle, CheckCircle2, Lock, Mail, ShieldCheck, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { auth, googleProvider } from '../lib/firebase.ts';
import { syncUserProfile } from '../lib/storeService.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'admin'>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const mapAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/operation-not-allowed') {
      return 'Email/Password sign-in is not yet enabled in the Firebase Console for this project. Please use Google Sign-In below (instant & verified), or enable Email/Password under Firebase Console → Authentication → Sign-in method.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'Invalid email or password. Please check your credentials or use Forgot Password.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Switch to Sign In instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Password must be at least 6 characters long.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google Sign-In popup was closed before completion.';
    }
    return err instanceof Error ? err.message : 'Authentication failed. Please try again.';
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(cred.user, {
        adminRequested: selectedRole === 'admin',
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, trimmedEmail);
        setNotice(`Password reset link sent to ${trimmedEmail}. Check your inbox.`);
      } else if (mode === 'signup') {
        if (fullName.trim().length < 2) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        await updateProfile(cred.user, { displayName: fullName.trim() });
        await sendEmailVerification(cred.user);
        await syncUserProfile(cred.user, {
          displayName: fullName.trim(),
          phone: phone.trim(),
          adminRequested: selectedRole === 'admin',
        });
        setNotice(
          selectedRole === 'admin'
            ? 'Account created! Verification email sent. Note: Admin privileges require allowlist approval by an existing admin.'
            : 'Account created! Please check your inbox to verify your email address.'
        );
        onSuccess?.();
      } else {
        const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        await syncUserProfile(cred.user);
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white border border-[#E4E8E2] rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in dialog"
          className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-[#6E7C74] hover:bg-[#F3F5F2] hover:text-[#111814] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <p className="text-xs font-medium text-[#176B45] tracking-wide mb-1">REFILL+ Account</p>
          <h2 id="auth-modal-title" className="text-2xl font-bold text-[#111814]">
            {mode === 'signin'
              ? 'Welcome back'
              : mode === 'signup'
              ? 'Create your refill account'
              : 'Reset your password'}
          </h2>
          <p className="text-sm text-[#4A5850] mt-1">
            {mode === 'forgot'
              ? 'Enter your registered email to receive a password reset link.'
              : 'Order campus refills, track deliveries, and monitor plastic saved.'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#F3F5F2] rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
              setNotice(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'signin' ? 'bg-white text-[#111814] shadow-xs' : 'text-[#4A5850]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
              setNotice(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'signup' ? 'bg-white text-[#111814] shadow-xs' : 'text-[#4A5850]'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setError(null);
              setNotice(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'forgot' ? 'bg-white text-[#111814] shadow-xs' : 'text-[#4A5850]'
            }`}
          >
            Forgot
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#DDF3E4] border border-[#176B45]/25 flex items-start gap-2.5 text-xs text-[#111814]">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#176B45]" />
            <span>{notice}</span>
          </div>
        )}

        {/* Role Selector (Available on Sign Up & Google Sign In) */}
        {mode !== 'forgot' && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-[#4A5850] mb-1.5">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('customer')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border text-left transition-colors cursor-pointer ${
                  selectedRole === 'customer'
                    ? 'border-[#176B45] bg-[#DDF3E4]/60 text-[#176B45]'
                    : 'border-[#E4E8E2] bg-white text-[#4A5850]'
                }`}
              >
                Customer (Student / Home)
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border text-left transition-colors cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'border-[#176B45] bg-[#DDF3E4]/60 text-[#176B45]'
                    : 'border-[#E4E8E2] bg-white text-[#4A5850]'
                }`}
              >
                Admin (Requires Approval)
              </button>
            </div>
            {selectedRole === 'admin' && (
              <p className="mt-1.5 text-[11px] text-[#4A5850] flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#176B45] shrink-0 mt-0.5" />
                <span>
                  Admin access is protected by server rules and never granted automatically upon registration.
                </span>
              </p>
            )}
          </div>
        )}

        {/* Instant Google Sign-In */}
        {mode !== 'forgot' && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-white border border-[#D4DBD3] hover:bg-[#F3F5F2] text-[#111814] text-sm font-medium rounded-xl flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-5 flex items-center">
              <div className="grow border-t border-[#E4E8E2]" />
              <span className="mx-3 text-xs text-[#6E7C74]">or with email</span>
              <div className="grow border-t border-[#E4E8E2]" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#4A5850] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Ananya Bisht"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A5850] mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit WhatsApp / Mobile"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-[#4A5850] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6E7C74] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@dgu.ac.in"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-xs font-medium text-[#4A5850] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6E7C74] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#D4DBD3] rounded-xl focus:outline-none focus:border-[#176B45]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#176B45] hover:bg-[#125436] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-60"
          >
            {loading
              ? 'Please wait...'
              : mode === 'signin'
              ? 'Sign In with Email'
              : mode === 'signup'
              ? 'Create Account'
              : 'Send Password Reset Email'}
          </button>
        </form>
      </div>
    </div>
  );
}

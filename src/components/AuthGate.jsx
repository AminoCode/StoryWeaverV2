import React, { useState } from 'react';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '../services/auth';

export default function AuthGate({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') await signUpWithEmail(email.trim(), password, fullName.trim());
      else await signInWithEmail(email.trim(), password);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sw-modal-overlay" onClick={e => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className="sw-modal sw-auth-modal">
        <div className="sw-auth-modal__header">
          <div className="sw-auth-modal__logo">Story<span>Weaver</span></div>
          <p>Save stories to the cloud, open them from any device, and keep a durable project archive.</p>
        </div>

        <div className="sw-auth-tabs">
          <button className={mode === 'signup' ? 'is-active' : ''} onClick={() => setMode('signup')}>Create account</button>
          <button className={mode === 'signin' ? 'is-active' : ''} onClick={() => setMode('signin')}>Sign in</button>
        </div>

        <form className="sw-auth-form" onSubmit={handleEmail}>
          {mode === 'signup' && (
            <div className="sw-field">
              <label className="sw-field__label">Name</label>
              <input className="sw-field__input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" />
            </div>
          )}
          <div className="sw-field">
            <label className="sw-field__label">Email</label>
            <input className="sw-field__input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="sw-field">
            <label className="sw-field__label">Password</label>
            <input className="sw-field__input" type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required />
          </div>
          <button className="sw-btn sw-btn--primary" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Working...</> : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="sw-auth-divider"><span>or</span></div>

        <button
          className="sw-btn sw-btn--secondary"
          style={{ width: '100%', justifyContent: 'center', gap: 'var(--sp-3)', fontSize: 14, padding: '12px 20px' }}
          onClick={handleGoogle}
          disabled={loading}
        >
          {loading
            ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Redirecting...</>
            : <>
                <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.2 5.6c4.2-3.9 6.6-9.6 6.6-16.6z"/>
                  <path fill="#FBBC05" d="M10.5 28.6A14.7 14.7 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6.1z"/>
                  <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.2-5.6c-2 1.4-4.6 2.1-8 2.1-6.2 0-11.5-4.2-13.3-9.9l-7.8 6C6.7 42.6 14.7 48 24 48z"/>
                </svg>
                Continue with Google
              </>}
        </button>

        {error && <div className="sw-auth-error">{error}</div>}

        {onClose && (
          <button className="sw-btn sw-btn--ghost sw-btn--sm" style={{ marginTop: 'var(--sp-5)', width: '100%', justifyContent: 'center' }} onClick={onClose}>
            Continue without signing in
          </button>
        )}

        <div className="sw-auth-note">Projects are protected by Supabase row-level security and also saved locally as a fallback.</div>
      </div>
    </div>
  );
}

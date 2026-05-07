import React, { useState } from 'react';
import { signInWithGoogle } from '../services/auth';

export default function AuthGate({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try { await signInWithGoogle(); }
    catch (err) { setError(err.message); setLoading(false); }
  };

  return (
    <div className="sw-modal-overlay" onClick={e => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className="sw-modal" style={{ maxWidth: 420, textAlign: 'center' }}>
        <div style={{ marginBottom: 'var(--sp-7)' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 900, fontStyle: 'italic', color: 'var(--text-1)', marginBottom: 8 }}>
            Story<span style={{ color: 'var(--magenta)' }}>Weaver</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            Sign in to save your stories to the cloud, access them from any device, and never lose your work.
          </div>
        </div>

        <button
          className="sw-btn sw-btn--primary"
          style={{ width: '100%', justifyContent: 'center', gap: 'var(--sp-3)', fontSize: 14, padding: '12px 20px' }}
          onClick={handleGoogle}
          disabled={loading}
        >
          {loading
            ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Redirecting to Google…</>
            : <>
                <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.2 5.6c4.2-3.9 6.6-9.6 6.6-16.6z"/>
                  <path fill="#FBBC05" d="M10.5 28.6A14.7 14.7 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6.1z"/>
                  <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.2-5.6c-2 1.4-4.6 2.1-8 2.1-6.2 0-11.5-4.2-13.3-9.9l-7.8 6C6.7 42.6 14.7 48 24 48z"/>
                </svg>
                Continue with Google
              </>
          }
        </button>

        {error && (
          <div style={{ marginTop: 'var(--sp-4)', fontSize: 12, color: 'var(--red)', background: 'rgba(240,93,93,0.08)', borderRadius: 'var(--r-md)', padding: '8px 12px' }}>
            {error}
          </div>
        )}

        {onClose && (
          <button
            className="sw-btn sw-btn--ghost sw-btn--sm"
            style={{ marginTop: 'var(--sp-5)', width: '100%', justifyContent: 'center' }}
            onClick={onClose}
          >
            Continue without signing in
          </button>
        )}

        <div style={{ marginTop: 'var(--sp-5)', fontSize: 10, color: 'var(--text-4)', lineHeight: 1.5 }}>
          Your data is encrypted and stored securely. You can export your stories at any time.
        </div>
      </div>
    </div>
  );
}

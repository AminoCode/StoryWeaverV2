import React from 'react';

export default function WelcomeScreen({ onCreateAccount, onContinue }) {
  return (
    <div className="sw-welcome">
      <section className="sw-welcome__panel">
        <div className="sw-welcome__brand">
          <div className="sw-welcome__mark">SW</div>
          <div>
            <div className="sw-welcome__name">StoryWeaver</div>
            <div className="sw-welcome__eyebrow">AI Writing Studio</div>
          </div>
        </div>

        <div className="sw-welcome__content">
          <h1>Build the story, keep the world organized.</h1>
          <p>
            Draft chapters, track characters, map relationships, and sync your
            work securely when you create an account.
          </p>
        </div>

        <div className="sw-welcome__grid">
          <div>
            <span>01</span>
            <strong>Write</strong>
            <p>A focused editor with quick formatting and chapter structure.</p>
          </div>
          <div>
            <span>02</span>
            <strong>Extract</strong>
            <p>AI scans pull out characters, locations, events, and items.</p>
          </div>
          <div>
            <span>03</span>
            <strong>Sync</strong>
            <p>Signed-in projects save to Supabase with per-user access rules.</p>
          </div>
        </div>

        <div className="sw-welcome__actions">
          <button className="sw-btn sw-btn--primary" onClick={onCreateAccount}>Create Account</button>
          <button className="sw-btn sw-btn--ghost" onClick={onContinue}>Continue Locally</button>
        </div>
      </section>
    </div>
  );
}

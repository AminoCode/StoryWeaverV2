import React, { useEffect } from 'react';

export default function Modal({ title, subtitle, children, onClose, wide = false, footer }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="sw-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`sw-modal${wide ? ' sw-modal--wide' : ''}`}>
        <button className="sw-modal__close" onClick={onClose} title="Close">✕</button>
        {title && <div className="sw-modal__title">{title}</div>}
        {subtitle && <div className="sw-modal__subtitle">{subtitle}</div>}
        <div className="sw-modal__body">{children}</div>
        {footer && <div className="sw-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

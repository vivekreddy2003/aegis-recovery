import React, { useState } from 'react';
import { HelpCircle, Send, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function HelpModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [issue, setIssue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !issue) return;

    setIsSubmitting(true);
    // Simulate API request to send email to the owner
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Reset after a delay and close
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
        setIssue('');
        onClose();
      }, 3000);
    }, 1500);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <HelpCircle size={24} style={{ color: 'var(--neon-cyan)' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>Help & Support</h2>
        </div>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '30px 0', animation: 'fadeIn 0.3s ease' }}>
            <CheckCircle size={48} style={{ color: 'var(--neon-emerald)', margin: '0 auto 16px auto' }} />
            <h3 style={{ color: '#ffffff', fontSize: '1.1rem', marginBottom: '8px' }}>Report Submitted!</h3>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.4' }}>
              Thank you. Your issue has been successfully routed to the administrator. We will contact you at {email} shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: 0, marginBottom: '8px', lineHeight: '1.4' }}>
              Experiencing a problem? Describe your issue below and we'll get back to you.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Your Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="glass-input"
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Describe the Issue</label>
              <textarea
                required
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="What went wrong?"
                className="glass-input"
                style={{ 
                  minHeight: '100px', 
                  resize: 'vertical',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  padding: '12px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email || !issue}
              className="btn-cyber-primary haptic-tap"
              style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: '8px',
                opacity: (!email || !issue) ? 0.5 : 1
              }}
            >
              {isSubmitting ? (
                <span>Sending Report...</span>
              ) : (
                <>
                  <span>Submit Issue</span>
                  <Send size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

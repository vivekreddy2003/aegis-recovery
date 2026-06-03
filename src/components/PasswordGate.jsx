import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, Key } from 'lucide-react';
import { getConfig } from '../utils/db';

export default function PasswordGate({ onAuthorized, onPasswordSet }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShake, setIsShake] = useState(false);
  const [dbEmail, setDbEmail] = useState('');
  const [dbPassword, setDbPassword] = useState('');

  useEffect(() => {
    async function loadDbCredentials() {
      try {
        const savedEmail = await getConfig('profile_email');
        const savedPassword = await getConfig('profile_password');
        setDbEmail(savedEmail || '');
        setDbPassword(savedPassword || '');
      } catch (err) {
        console.error('Failed to load credential database:', err);
      }
    }
    loadDbCredentials();
  }, []);

  const triggerShake = (message) => {
    setError(message);
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
    setPassword('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      triggerShake('Please enter both Email and Password.');
      return;
    }

    // Verify against saved credentials
    if (email.trim().toLowerCase() === dbEmail.trim().toLowerCase() && password === dbPassword) {
      onPasswordSet(password);
      onAuthorized();
    } else {
      triggerShake('Authentication failed. Invalid Email or Password.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      width: '100%',
      padding: '20px',
      background: 'radial-gradient(circle at center, #1b163e 0%, #080710 100%)',
      position: 'relative',
      zIndex: 1000
    }}>
      <div className="hex-overlay"></div>
      
      {/* Glow BLOBS */}
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>
      
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        zIndex: 10
      }}>
        <div style={{
          position: 'relative',
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          marginBottom: '16px',
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.15)'
        }}>
          <Shield className="animate-pulse-cyan" size={40} color="#a855f7" />
        </div>
        
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #ffffff 0%, #9ca3af 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px'
        }}>
          AEGIS SECURE
        </h1>
        
        <p style={{
          fontSize: '0.9rem',
          color: '#9ca3af',
          maxWidth: '280px',
          margin: '0 auto',
          lineHeight: 1.4
        }}>
          Authentication required. Enter your local email credentials and recovery password.
        </p>
      </div>

      {/* Login Card */}
      <form 
        onSubmit={handleLogin}
        style={{
          width: '100%',
          maxWidth: '320px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          zIndex: 10,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          transform: isShake ? 'translateX(10px)' : 'none',
          transition: isShake ? 'none' : 'transform 0.1s ease'
        }}
      >
        {error && (
          <div style={{
            color: '#f43f5e',
            fontSize: '0.8rem',
            fontWeight: 600,
            padding: '8px 12px',
            borderRadius: '12px',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.15)',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Email Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Mail size={16} style={{ position: 'absolute', left: '12px', color: '#6b7280' }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@aegis.io"
              className="glass-input"
              style={{ paddingLeft: '38px', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Password Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Lock size={16} style={{ position: 'absolute', left: '12px', color: '#6b7280' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="glass-input"
              style={{ paddingLeft: '38px', paddingRight: '40px', fontSize: '0.85rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-neon"
          style={{
            background: 'linear-gradient(135deg, var(--neon-indigo), var(--neon-purple))',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)',
            width: '100%',
            marginTop: '8px',
            padding: '12px',
            fontSize: '0.9rem'
          }}
        >
          <Key size={16} />
          Decrypt & Access
        </button>
      </form>

      {/* Signature Footer */}
      <div style={{
        marginTop: '24px',
        fontSize: '0.7rem',
        color: 'rgba(255, 255, 255, 0.25)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        zIndex: 10
      }}>
        Aegis Secure Shield <span style={{ color: 'var(--neon-purple)', fontWeight: 700 }}>by ABBI REDDY</span>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .shake-animation {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Lock, Delete } from 'lucide-react';
import { hashPIN, arrayBufferToBase64 } from '../utils/crypto';
import { getConfig, setConfig } from '../utils/db';

export default function AuthGate({ onAuthorized, onPinSet }) {
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState('setup'); // 'setup' | 'confirm' | 'login'
  const [setupPin, setSetupPin] = useState('');
  const [error, setError] = useState('');
  const [isShake, setIsShake] = useState(false);
  const [pinHash, setPinHash] = useState(null);
  const [pinSalt, setPinSalt] = useState(null);

  useEffect(() => {
    // Check if a PIN is already registered in our secure IndexedDB config
    async function checkExistingPIN() {
      try {
        const existingHash = await getConfig('master_pin_hash');
        const existingSalt = await getConfig('master_pin_salt');
        
        if (existingHash && existingSalt) {
          setPinHash(existingHash);
          setPinSalt(existingSalt);
          setMode('login');
        } else {
          setMode('setup');
        }
      } catch (err) {
        console.error('Failed to load security config:', err);
      }
    }
    checkExistingPIN();
  }, []);

  const triggerShake = (message) => {
    setError(message);
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
    setPin('');
  };

  const handleKeyPress = async (num) => {
    if (pin.length >= 4) return;
    setError('');
    
    const newPin = pin + num;
    setPin(newPin);

    // If 4 digits are completed, process the passcode
    if (newPin.length === 4) {
      // Small visual delay so the user sees the last digit fill in
      setTimeout(() => processPasscode(newPin), 250);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const processPasscode = async (currentPin) => {
    if (mode === 'setup') {
      setSetupPin(currentPin);
      setPin('');
      setMode('confirm');
    } else if (mode === 'confirm') {
      if (currentPin !== setupPin) {
        triggerShake('PIN codes do not match. Restarting...');
        setMode('setup');
      } else {
        // Secure setup: PBKDF2 hashing
        try {
          const { hash, salt } = await hashPIN(currentPin);
          await setConfig('master_pin_hash', hash);
          await setConfig('master_pin_salt', salt);
          
          onPinSet(currentPin); // Pass raw PIN up to App so it can derive AES keys
          onAuthorized();
        } catch (err) {
          setError('Failed to securely register PIN.');
        }
      }
    } else if (mode === 'login') {
      try {
        // Verify PIN hash using the derived salt
        const { hash } = await hashPIN(currentPin, pinSalt);
        if (hash === pinHash) {
          onPinSet(currentPin);
          onAuthorized();
        } else {
          triggerShake('Access Denied. Invalid Secure PIN.');
        }
      } catch (err) {
        triggerShake('Verification failed. Try again.');
      }
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
      
      {/* Container Shield Graphics */}
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
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          marginBottom: '16px',
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.15)'
        }}>
          {mode === 'setup' || mode === 'confirm' ? (
            <Shield className="animate-pulse-cyan" size={40} color="#06b6d4" />
          ) : error ? (
            <ShieldAlert size={40} color="#f43f5e" />
          ) : (
            <Lock size={38} color="#6366f1" />
          )}
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
          {mode === 'setup' && 'Create a Master Security PIN to lock your recovered vaults and scan files.'}
          {mode === 'confirm' && 'Verify your 4-digit Master Security PIN.'}
          {mode === 'login' && 'Device requires authorized credentials to decrypt recovery vaults.'}
        </p>
      </div>

      {/* Dots Indicator */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '40px',
        zIndex: 10,
        transform: isShake ? 'translateX(10px)' : 'none',
        transition: isShake ? 'none' : 'transform 0.1s ease'
      }} className={isShake ? 'shake-animation' : ''}>
        {[0, 1, 2, 3].map((index) => {
          const filled = pin.length > index;
          return (
            <div
              key={index}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '2px solid rgba(99, 102, 241, 0.5)',
                background: filled ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'transparent',
                boxShadow: filled ? '0 0 12px #6366f1' : 'none',
                transform: filled ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            />
          );
        })}
      </div>

      {error && (
        <div style={{
          color: '#f43f5e',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '24px',
          zIndex: 10,
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.2)',
          textAlign: 'center',
          maxWidth: '300px'
        }}>
          {error}
        </div>
      )}

      {/* Grid Keypad */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px 24px',
        maxWidth: '280px',
        zIndex: 10,
        marginBottom: '20px'
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num)}
            className="haptic-tap"
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              fontSize: '1.6rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(5px)'
            }}
          >
            {num}
          </button>
        ))}
        
        {/* Placeholder / Lock Icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255, 255, 255, 0.2)'
        }}>
          <Lock size={20} />
        </div>
        
        {/* Zero */}
        <button
          onClick={() => handleKeyPress(0)}
          className="haptic-tap"
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            fontSize: '1.6rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(5px)'
          }}
        >
          0
        </button>

        {/* Backspace */}
        <button
          onClick={handleBackspace}
          className="haptic-tap"
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.05)',
            border: '1px solid rgba(244, 63, 94, 0.1)',
            color: '#f43f5e',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(5px)'
          }}
        >
          <Delete size={24} />
        </button>
      </div>

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
        Aegis Passcode Core <span style={{ color: 'var(--neon-purple)', fontWeight: 700 }}>by abhireddy</span>
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

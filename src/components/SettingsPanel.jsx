import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Lock, Unlock, Eye, Trash2, Key, RefreshCw, Database, FileText, AlertTriangle, EyeOff, User, Phone, Mail } from 'lucide-react';
import { hashPIN, arrayBufferToBase64 } from '../utils/crypto';
import { getConfig, setConfig, getVaultFiles, getLogs, addLog, initDB, clearDatabase } from '../utils/db';

export default function SettingsPanel({ onSecurityChange, currentPinState, onBackToScan }) {
  const [pinLockEnabled, setPinLockEnabled] = useState(false);
  const [hasPinConfigured, setHasPinConfigured] = useState(false);
  
  // Optional profile states
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  
  // Security action states: 'idle' | 'enabling' | 'disabling' | 'changing'
  const [securityAction, setSecurityAction] = useState('idle');
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinStep, setPinStep] = useState(1); // 1 = first input, 2 = confirm input (for setup)
  const [oldPinInput, setOldPinInput] = useState(''); // for changing pin
  const [error, setError] = useState('');
  const [isShake, setIsShake] = useState(false);
  
  // Database analytics state
  const [vaultStats, setVaultStats] = useState({
    fileCount: 0,
    totalBytes: 0,
    logCount: 0
  });

  // Haptic simulation
  const triggerShake = (message) => {
    setError(message);
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
    setPinInput('');
    setPinConfirm('');
  };

  const [authMethod, setAuthMethod] = useState('frictionless');

  // Load configs and database stats on mount
  useEffect(() => {
    loadSettingsAndStats();
  }, []);

  const loadSettingsAndStats = async () => {
    try {
      const enabled = await getConfig('pin_lock_enabled');
      const hash = await getConfig('master_pin_hash');
      
      let method = await getConfig('auth_method');
      if (!method) {
        method = enabled ? 'pin' : 'frictionless';
        await setConfig('auth_method', method);
      }
      setAuthMethod(method);
      setPinLockEnabled(method === 'pin');
      setHasPinConfigured(!!hash);

      // Load Profile fields
      const nameVal = await getConfig('profile_name') || '';
      const phoneVal = await getConfig('profile_phone') || '';
      const emailVal = await getConfig('profile_email') || '';
      const passwordVal = await getConfig('profile_password') || '';
      setProfileName(nameVal);
      setProfilePhone(phoneVal);
      setProfileEmail(emailVal);
      setProfilePassword(passwordVal);

      // Load analytics
      const files = await getVaultFiles();
      const logs = await getLogs();
      
      const fileCount = files.length;
      const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
      const logCount = logs.length;

      setVaultStats({ fileCount, totalBytes, logCount });
    } catch (err) {
      console.error('Failed to load settings or database stats:', err);
    }
  };

  const handleKeyPress = (num) => {
    if (pinInput.length >= 4) return;
    setError('');
    const newVal = pinInput + num;
    setPinInput(newVal);

    if (newVal.length === 4) {
      setTimeout(() => processPinInput(newVal), 250);
    }
  };

  const handleBackspace = () => {
    if (pinInput.length > 0) {
      setPinInput(pinInput.slice(0, -1));
    }
  };

  const processPinInput = async (currentVal) => {
    try {
      if (securityAction === 'enabling') {
        if (pinStep === 1) {
          setPinConfirm(currentVal);
          setPinInput('');
          setPinStep(2);
        } else {
          // Confirming setup
          if (currentVal !== pinConfirm) {
            triggerShake('PIN codes do not match. Try again.');
            setPinStep(1);
          } else {
            // Save to IndexedDB
            const { hash, salt } = await hashPIN(currentVal);
            await setConfig('master_pin_hash', hash);
            await setConfig('master_pin_salt', salt);
            await setConfig('pin_lock_enabled', true);
            await setConfig('auth_method', 'pin');
            
            await addLog('info', 'PIN Security Enabled', 'Passcode credentials created and saved securely.');
            setPinLockEnabled(true);
            setHasPinConfigured(true);
            setAuthMethod('pin');
            onSecurityChange(true, currentVal, 'pin'); // Propagate active session key to App
            resetSecurityState();
            loadSettingsAndStats();
            alert('Aegis secure startup PIN successfully activated!');
          }
        }
      } else if (securityAction === 'disabling') {
        // Verify current PIN to disable
        const masterHash = await getConfig('master_pin_hash');
        const masterSalt = await getConfig('master_pin_salt');
        const { hash } = await hashPIN(currentVal, masterSalt);

        if (hash === masterHash) {
          await setConfig('pin_lock_enabled', false);
          await setConfig('auth_method', 'frictionless');
          await addLog('info', 'PIN Security Disabled', 'Startup passcode authentication deactivated.');
          setPinLockEnabled(false);
          setAuthMethod('frictionless');
          onSecurityChange(false, null, 'frictionless'); // Reverts vault to SYSTEM_KEY
          resetSecurityState();
          loadSettingsAndStats();
          alert('PIN protection deactivated. Operating in Frictionless Mode.');
        } else {
          triggerShake('Incorrect PIN. Authentication failed.');
        }
      } else if (securityAction === 'changing') {
        if (pinStep === 1) {
          // Verify old PIN
          const masterHash = await getConfig('master_pin_hash');
          const masterSalt = await getConfig('master_pin_salt');
          const { hash } = await hashPIN(currentVal, masterSalt);

          if (hash === masterHash) {
            setOldPinInput(currentVal);
            setPinInput('');
            setPinStep(2);
          } else {
            triggerShake('Incorrect current PIN. Authentication failed.');
          }
        } else if (pinStep === 2) {
          // Inputting new PIN
          setPinConfirm(currentVal);
          setPinInput('');
          setPinStep(3);
        } else if (pinStep === 3) {
          // Confirming new PIN
          if (currentVal !== pinConfirm) {
            triggerShake('New PINs do not match. Restarting change process...');
            setPinStep(2);
          } else {
            const { hash, salt } = await hashPIN(currentVal);
            await setConfig('master_pin_hash', hash);
            await setConfig('master_pin_salt', salt);
            await addLog('info', 'PIN Security Credentials Changed', 'Passcode updated successfully.');
            
            if (pinLockEnabled) {
              onSecurityChange(true, currentVal, 'pin'); // Update active session masterPin
            }
            resetSecurityState();
            loadSettingsAndStats();
            alert('Your security PIN passcode was changed successfully!');
          }
        }
      }
    } catch (err) {
      console.error(err);
      triggerShake('Cryptographic operation failed.');
    }
  };

  const resetSecurityState = () => {
    setSecurityAction('idle');
    setPinInput('');
    setPinConfirm('');
    setOldPinInput('');
    setPinStep(1);
    setError('');
  };

  const handleSelectAuthMethod = async (method) => {
    try {
      setError('');
      setPinInput('');

      if (method === 'frictionless') {
        await setConfig('auth_method', 'frictionless');
        await setConfig('pin_lock_enabled', false);
        await addLog('info', 'Frictionless Mode Activated', 'Bypassed all startup passcode gates.');
        setAuthMethod('frictionless');
        setPinLockEnabled(false);
        onSecurityChange(false, null, 'frictionless');
        alert('Authentication disabled. Aegis is running in Frictionless Mode.');
      } else if (method === 'pin') {
        if (hasPinConfigured) {
          await setConfig('auth_method', 'pin');
          await setConfig('pin_lock_enabled', true);
          await addLog('info', 'PIN Lock Enabled', 'Startup passcode lock configured.');
          setAuthMethod('pin');
          setPinLockEnabled(true);
          onSecurityChange(true, null, 'pin');
          alert('Aegis Secure PIN Lock activated!');
        } else {
          // Must configure PIN
          setSecurityAction('enabling');
          setPinStep(1);
        }
      } else if (method === 'password') {
        // Must check if email and password are set
        const dbEmail = await getConfig('profile_email');
        const dbPassword = await getConfig('profile_password');
        
        if (dbEmail && dbPassword) {
          await setConfig('auth_method', 'password');
          await setConfig('pin_lock_enabled', false);
          await addLog('info', 'Email & Password Lock Enabled', 'Secure credentials screen activated.');
          setAuthMethod('password');
          setPinLockEnabled(false);
          onSecurityChange(true, dbPassword, 'password');
          alert('Email & Password security lock activated!');
        } else {
          alert('To enable Email & Password authentication, you must configure a secure Email and Password in the Profile Form first.');
          const element = document.getElementById('profile-credentials-card');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      await setConfig('profile_name', profileName);
      await setConfig('profile_phone', profilePhone);
      await setConfig('profile_email', profileEmail);
      await setConfig('profile_password', profilePassword);
      await addLog('info', 'Profile Credentials Updated', 'Optional identity details saved locally.');
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save profile configuration:', err);
      alert('Failed to save identity options.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleWipeLogs = async () => {
    if (confirm('Are you sure you want to clear your local event logs? This will not touch your Vault files.')) {
      try {
        const db = await initDB();
        const transaction = db.transaction('logs', 'readwrite');
        const store = transaction.objectStore('logs');
        await new Promise((resolve, reject) => {
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
        await addLog('info', 'Event Logs Wiped', 'User purged all scanning log outputs.');
        alert('Forensic logs wiped successfully.');
        loadSettingsAndStats();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = confirm('Are you sure you want to delete your account? This will permanently wipe all your settings, profiles, and encrypted vault files. This action cannot be undone.');
    if (confirmDelete) {
      const finalInput = prompt('Type "DELETE" to confirm account deletion:');
      if (finalInput === 'DELETE') {
        try {
          await clearDatabase();
          alert('Account deleted successfully.');
          window.location.reload();
        } catch (err) {
          alert('Account deletion failed: ' + err.message);
        }
      }
    }
  };

  const handleEmergencyDatabaseShred = async () => {
    const doubleConfirm = confirm('🚨 DANGER WARNING! 🚨\n\nThis will completely purge and shred your entire Aegis database, permanently deleting ALL items in your secure vault, encryption configurations, and system logs.\n\nThis operation is irreversible. Continue?');
    if (doubleConfirm) {
      const finalInput = prompt('Type "SHRED" in uppercase to confirm complete sanitization:');
      if (finalInput === 'SHRED') {
        try {
          const db = await initDB();
          
          const stores = ['config', 'vault', 'logs'];
          const transaction = db.transaction(stores, 'readwrite');
          
          stores.forEach(storeName => {
            transaction.objectStore(storeName).clear();
          });

          await new Promise((resolve) => {
            transaction.oncomplete = () => resolve();
          });

          alert('Aegis data fully sanitized. All configurations, keys, logs, and encrypted files have been destroyed.');
          
          // Revert application states
          setPinLockEnabled(false);
          setHasPinConfigured(false);
          setAuthMethod('frictionless');
          setProfileName('');
          setProfilePhone('');
          setProfileEmail('');
          setProfilePassword('');
          onSecurityChange(false, null, 'frictionless');
          resetSecurityState();
          loadSettingsAndStats();
          if (onBackToScan) onBackToScan();
        } catch (err) {
          alert('Purge operation failed: ' + err.message);
        }
      } else {
        alert('Confirmation mismatch. Purge cancelled.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Title Card */}
      <div className="glass-card" style={{ borderLeft: '4px solid var(--neon-indigo)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px' }}>System Control Settings</h2>
        <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Manage cryptographic pattern rules, storage statistics, and security audits.</p>
      </div>

      {securityAction !== 'idle' ? (
        /* Dynamic PIN keypad panel for security changes */
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px', width: '100%' }}>
            <div style={{
              display: 'inline-flex',
              padding: '10px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.08)',
              color: '#6366f1',
              marginBottom: '12px'
            }}>
              <Lock className="animate-pulse-cyan" size={32} />
            </div>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
              {securityAction === 'enabling' && pinStep === 1 && 'Configure Master PIN'}
              {securityAction === 'enabling' && pinStep === 2 && 'Confirm Master PIN'}
              {securityAction === 'disabling' && 'Disable Startup Lock'}
              {securityAction === 'changing' && pinStep === 1 && 'Verify Current PIN'}
              {securityAction === 'changing' && pinStep === 2 && 'Enter New Security PIN'}
              {securityAction === 'changing' && pinStep === 3 && 'Confirm New Security PIN'}
            </h3>
            
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', maxWidth: '280px', margin: '6px auto 0 auto', lineHeight: 1.4 }}>
              {securityAction === 'enabling' && pinStep === 1 && 'Create a new 4-digit passcode lock key.'}
              {securityAction === 'enabling' && pinStep === 2 && 'Confirm your new 4-digit master security passcode.'}
              {securityAction === 'disabling' && 'Enter your current master security PIN code to confirm disabling lock screens.'}
              {securityAction === 'changing' && pinStep === 1 && 'Authenticate using your active 4-digit master PIN.'}
              {securityAction === 'changing' && pinStep === 2 && 'Enter your new replacement 4-digit passcode.'}
              {securityAction === 'changing' && pinStep === 3 && 'Re-enter your new passcode to ensure key accuracy.'}
            </p>
          </div>

          {/* Dots Indicator */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            transform: isShake ? 'translateX(10px)' : 'none',
            transition: isShake ? 'none' : 'transform 0.1s ease'
          }}>
            {[0, 1, 2, 3].map((index) => {
              const filled = pinInput.length > index;
              return (
                <div
                  key={index}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: '2px solid rgba(99, 102, 241, 0.5)',
                    background: filled ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'transparent',
                    boxShadow: filled ? '0 0 10px #6366f1' : 'none',
                    transform: filled ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
                />
              );
            })}
          </div>

          {error && (
            <div style={{
              color: '#f43f5e',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '16px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Grid Dial Keypad */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '14px 20px',
            maxWidth: '240px',
            marginBottom: '20px'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="haptic-tap"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '1.4rem',
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
            
            <button
              onClick={resetSecurityState}
              className="haptic-tap"
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: '#9ca3af',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={() => handleKeyPress(0)}
              className="haptic-tap"
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontSize: '1.4rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              0
            </button>

            <button
              onClick={handleBackspace}
              className="haptic-tap"
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(244, 63, 94, 0.05)',
                border: '1px solid rgba(244, 63, 94, 0.1)',
                color: '#f43f5e',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <EyeOff size={18} />
            </button>
          </div>
        </div>
      ) : (
        /* Normal Settings List Options */
        <>
          {/* Section 1: Startup Authentication Mode */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} color="var(--neon-purple)" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Startup Authentication Mode</h3>
            </div>
            
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.4 }}>
              Choose how Aegis validates your operator identity and derives database encryption keys on boot.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
              gap: '10px',
              padding: '4px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              {[
                { id: 'frictionless', label: 'Frictionless', color: '#06b6d4', desc: 'No lock screen' },
                { id: 'pin', label: 'PIN Lock', color: '#a855f7', desc: '4-Digit numeric' },
                { id: 'password', label: 'Password', color: '#6366f1', desc: 'Email/Password' }
              ].map((mode) => {
                const active = authMethod === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleSelectAuthMethod(mode.id)}
                    className="haptic-tap"
                    style={{
                      padding: '12px 8px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: active ? mode.color : 'transparent',
                      background: active ? `rgba(${mode.id === 'frictionless' ? '6, 182, 212' : mode.id === 'pin' ? '168, 85, 247' : '99, 102, 241'}, 0.1)` : 'transparent',
                      color: active ? '#ffffff' : '#9ca3af',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease',
                      boxShadow: active ? `0 0 10px rgba(${mode.id === 'frictionless' ? '6, 182, 212' : mode.id === 'pin' ? '168, 85, 247' : '99, 102, 241'}, 0.2)` : 'none'
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{mode.label}</span>
                    <span style={{ fontSize: '0.62rem', color: active ? mode.color : '#6b7280' }}>{mode.desc}</span>
                  </button>
                );
              })}
            </div>

            {authMethod === 'pin' && hasPinConfigured && (
              <button
                onClick={() => {
                  setError('');
                  setPinInput('');
                  setSecurityAction('changing');
                  setPinStep(1);
                }}
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  justifyContent: 'center',
                  marginTop: '4px'
                }}
              >
                <Key size={16} />
                Modify Master Passcode PIN
              </button>
            )}
          </div>

          {/* Section 2: Operator Identity Profile (Optional) */}
          <div 
            id="profile-credentials-card" 
            className="glass-card" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px',
              borderLeft: '4px solid var(--neon-indigo)',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={20} color="var(--neon-indigo)" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Operator Identity Profile (Optional)</h3>
            </div>
            
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.4 }}>
              Fill in your operator profile details. Email and Password are required to enable **Email & Password** startup lock screen.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Display Name Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operator Name</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={14} style={{ position: 'absolute', left: '12px', color: '#6b7280' }} />
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Agent Smith"
                    className="glass-input"
                    style={{ paddingLeft: '36px', fontSize: '0.82rem', height: '38px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#ffffff', width: '100%', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Phone Number Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Phone size={14} style={{ position: 'absolute', left: '12px', color: '#6b7280' }} />
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="e.g. +1 (555) 0199"
                    className="glass-input"
                    style={{ paddingLeft: '36px', fontSize: '0.82rem', height: '38px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#ffffff', width: '100%', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Email</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={14} style={{ position: 'absolute', left: '12px', color: '#6b7280' }} />
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="e.g. operator@aegis.io"
                    className="glass-input"
                    style={{ paddingLeft: '36px', fontSize: '0.82rem', height: '38px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#ffffff', width: '100%', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Recovery Password Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recovery Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '12px', color: '#6b7280' }} />
                  <input
                    type={showProfilePassword ? 'text' : 'password'}
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder="e.g. secure-recovery-key-2026"
                    className="glass-input"
                    style={{ paddingLeft: '36px', paddingRight: '36px', fontSize: '0.82rem', height: '38px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#ffffff', width: '100%', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowProfilePassword(!showProfilePassword)}
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
                    {showProfilePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={profileSaving}
              className="btn-neon animate-pulse-cyan"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                justifyContent: 'center',
                background: profileSaved ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, var(--neon-indigo), var(--neon-purple))',
                boxShadow: profileSaved ? '0 4px 15px rgba(16, 185, 129, 0.4)' : '0 4px 15px rgba(99, 102, 241, 0.35)',
                color: '#ffffff',
                fontWeight: 700,
                marginTop: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {profileSaving ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Saving Profile...
                </>
              ) : profileSaved ? (
                <>
                  <ShieldCheck size={16} />
                  Profile Details Saved!
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Save Profile Details
                </>
              )}
            </button>
          </div>

          {/* Section 2: Storage Sector Metrics */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={20} color="#06b6d4" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>IndexedDB Storage Audits</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block', textTransform: 'uppercase' }}>Vault Encrypted Items</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginTop: '4px', display: 'block' }}>{vaultStats.fileCount}</span>
              </div>
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block', textTransform: 'uppercase' }}>Secure Vault Space</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#06b6d4', marginTop: '6px', display: 'block' }}>
                  {(vaultStats.totalBytes / 1024).toFixed(2)} KB
                </span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="#6b7280" />
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Forensic History Logs</span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{vaultStats.logCount} items</span>
            </div>
          </div>

          {/* Section 3: Forensic Sanitization Operations */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '4px solid var(--neon-rose)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} color="#f43f5e" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Emergency Sanitization</h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.4 }}>
              Purge and overwrite sandboxed partitions dynamically in case of physical compromise.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={handleWipeLogs}
                className="btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '10px',
                  borderRadius: '10px',
                  justifyContent: 'center',
                  borderColor: 'rgba(255, 255, 255, 0.05)'
                }}
              >
                Clear Terminal Event Logs
              </button>
              
              <button
                onClick={handleDeleteAccount}
                className="btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '10px',
                  borderRadius: '10px',
                  justifyContent: 'center',
                  borderColor: 'rgba(244, 63, 94, 0.4)',
                  color: '#f43f5e'
                }}
              >
                Delete Account
              </button>
              
              <button
                onClick={handleEmergencyDatabaseShred}
                className="btn-neon"
                style={{
                  background: 'linear-gradient(135deg, #f43f5e, #be123c)',
                  boxShadow: '0 4px 15px rgba(244, 63, 94, 0.3)',
                  fontSize: '0.8rem',
                  padding: '11px',
                  borderRadius: '10px'
                }}
              >
                <Trash2 size={16} />
                Emergency Database Shredder
              </button>
            </div>
          </div>

          {/* Signature Footer */}
          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.75rem',
            color: '#6b7280',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            designed & compiled <span style={{ color: 'var(--neon-purple)', textShadow: '0 0 8px var(--neon-purple)', fontWeight: 700 }}>by abhireddy</span>
          </div>
        </>
      )}
    </div>
  );
}

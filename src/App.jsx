import React, { useState, useEffect } from 'react';
import { Cpu, Settings, Globe } from 'lucide-react';
import RecoveryScanner from './components/RecoveryScanner';
import EncryptedVault from './components/EncryptedVault';
import DataShredder from './components/DataShredder';
import NetworkPortal from './components/NetworkPortal';
import PlaygroundCreator from './components/PlaygroundCreator';
import UtilitiesPanel from './components/UtilitiesPanel';
import SettingsPanel from './components/SettingsPanel';
import AuthGate from './components/AuthGate';
import PasswordGate from './components/PasswordGate';
import BottomNav from './components/BottomNav';
import LandingPage from './components/LandingPage';
import TitleBar from './components/TitleBar';
import { getConfig } from './utils/db';

// System key to run local database sandbox encryption transparently in background
const SYSTEM_KEY = 'AEGIS-SECURE-SYSTEM-KEY';

function AppContent() {
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'vault' | 'shredder' | 'portal' | 'playground' | 'settings'
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [masterPin, setMasterPin] = useState(SYSTEM_KEY);
  const [pinLockEnabled, setPinLockEnabled] = useState(false);
  const [authMethod, setAuthMethod] = useState('frictionless');
  const [isViewingLanding, setIsViewingLanding] = useState(true);

  // Read config on mount to see which Startup Auth Mode is active
  useEffect(() => {
    async function checkSecurityMode() {
      try {
        let method = await getConfig('auth_method');
        const legacyEnabled = await getConfig('pin_lock_enabled');
        
        // Backward compatibility fallback
        if (!method) {
          method = legacyEnabled ? 'pin' : 'frictionless';
        }
        
        setAuthMethod(method);

        if (method === 'pin') {
          const hash = await getConfig('master_pin_hash');
          if (hash) {
            setPinLockEnabled(true);
            setIsAuthorized(false); // Gate startup access
          } else {
            setPinLockEnabled(false);
            setMasterPin(SYSTEM_KEY);
            setIsAuthorized(true); // Fallback to frictionless
          }
        } else if (method === 'password') {
          const dbEmail = await getConfig('profile_email');
          const dbPassword = await getConfig('profile_password');
          const rememberDevice = await getConfig('remember_device');
          
          if (dbEmail && dbPassword) {
            setPinLockEnabled(true);
            if (rememberDevice === 'true') {
              setMasterPin(dbPassword);
              setIsAuthorized(true);
              setIsViewingLanding(false);
            } else {
              setIsAuthorized(false); // Gate startup access
            }
          } else {
            setPinLockEnabled(false);
            setMasterPin(SYSTEM_KEY);
            setIsAuthorized(true); // Fallback to frictionless
          }
        } else {
          // Frictionless
          setPinLockEnabled(false);
          setMasterPin(SYSTEM_KEY);
          setIsAuthorized(true);
        }
      } catch (err) {
        console.error('Failed to read config status:', err);
        setIsAuthorized(true); // Fail-safe frictionless
      }
    }
    checkSecurityMode();
  }, []);

  const handleSecurityChange = (enabled, activeKey, method) => {
    setPinLockEnabled(enabled);
    if (method) {
      setAuthMethod(method);
    }
    if (enabled && activeKey) {
      setMasterPin(activeKey);
    } else if (!enabled) {
      setMasterPin(SYSTEM_KEY);
    }
  };

  // Wait until IndexedDB reads configuration
  if (isAuthorized === null) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#080710',
        color: '#06b6d4',
        fontSize: '0.9rem',
        fontFamily: 'var(--font-mono)'
      }}>
        Initializing Security Core...
      </div>
    );
  }

  const handleAuthorizedLaunch = (pwd) => {
    setMasterPin(pwd);
    setIsAuthorized(true);
    setIsViewingLanding(false);
  };

  // Render landing website if active
  if (isViewingLanding) {
    return (
      <LandingPage 
        onLaunch={() => setIsViewingLanding(false)} 
        onAuthorizedLaunch={handleAuthorizedLaunch}
        activeAuthMethod={authMethod} 
        onSecurityChange={handleSecurityChange}
      />
    );
  }

  // Render Lock Gate if protection is active and not yet authorized
  if (!isAuthorized) {
    if (authMethod === 'password') {
      return (
        <PasswordGate 
          onAuthorized={() => setIsAuthorized(true)} 
          onPasswordSet={(pwd) => setMasterPin(pwd)} 
        />
      );
    }
    return (
      <AuthGate 
        onAuthorized={() => setIsAuthorized(true)} 
        onPinSet={(pin) => setMasterPin(pin)} 
      />
    );
  }

  return (
    <div className="app-shell">
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>
      
      {/* App Header */}
      <header className="app-header">
        <div className="app-logo" onClick={() => setActiveTab('scanner')} style={{ cursor: 'pointer' }}>
          <Cpu size={24} style={{ color: '#06b6d4' }} />
          AEGIS <span>RECOVERY</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            background: authMethod === 'password'
              ? 'rgba(99, 102, 241, 0.08)'
              : authMethod === 'pin'
                ? 'rgba(168, 85, 247, 0.08)'
                : 'rgba(6, 182, 212, 0.08)',
            border: authMethod === 'password'
              ? '1px solid rgba(99, 102, 241, 0.15)'
              : authMethod === 'pin'
                ? '1px solid rgba(168, 85, 247, 0.15)'
                : '1px solid rgba(6, 182, 212, 0.15)',
            borderRadius: '8px',
            padding: '5px 9px',
            color: authMethod === 'password'
              ? '#6366f1'
              : authMethod === 'pin'
                ? '#a855f7'
                : '#06b6d4',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {authMethod === 'password' ? 'Password Secured' : authMethod === 'pin' ? 'PIN Secured' : 'Frictionless'}
          </div>

          <button 
            onClick={() => setIsViewingLanding(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            title="View Product Website"
            className="haptic-tap"
          >
            <Globe size={18} />
          </button>

          <button 
            onClick={() => setActiveTab(activeTab === 'settings' ? 'scanner' : 'settings')}
            style={{
              background: activeTab === 'settings' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: activeTab === 'settings' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeTab === 'settings' ? '#6366f1' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            title="System Settings"
            className="haptic-tap"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main App Content Viewport */}
      <main className="app-content">
        {activeTab === 'scanner' && (
          <RecoveryScanner masterPin={masterPin} />
        )}
        
        {activeTab === 'vault' && (
          <EncryptedVault masterPin={masterPin} />
        )}
        
        {activeTab === 'shredder' && (
          <DataShredder />
        )}

        {activeTab === 'utilities' && (
          <UtilitiesPanel />
        )}
        
        {activeTab === 'portal' && (
          <NetworkPortal />
        )}
        
        {activeTab === 'playground' && (
          <PlaygroundCreator />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel 
            onSecurityChange={handleSecurityChange}
            currentPinState={pinLockEnabled}
            onBackToScan={() => setActiveTab('scanner')}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab === 'settings' ? 'scanner' : activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Title bar requires the app to know if it's in electron, but we can safely render it everywhere */}
      {isElectron && <TitleBar />}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <AppContent />
      </div>
    </div>
  );
}

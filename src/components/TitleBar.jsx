import React from 'react';
import { Minus, Square, X, ShieldAlert } from 'lucide-react';

export default function TitleBar() {
  const handleMinimize = () => {
    if (window.electronAPI) window.electronAPI.minimize();
  };

  const handleMaximize = () => {
    if (window.electronAPI) window.electronAPI.maximize();
  };

  const handleClose = () => {
    if (window.electronAPI) window.electronAPI.close();
  };

  return (
    <div style={{
      WebkitAppRegion: 'drag',
      height: '36px',
      background: 'rgba(8, 7, 16, 0.95)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: '14px',
      position: 'relative',
      zIndex: 9999,
      backdropFilter: 'blur(10px)'
    }}>
      {/* App Branding Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldAlert size={14} color="var(--neon-cyan)" />
        <span style={{ 
          fontSize: '0.75rem', 
          fontWeight: 700, 
          color: '#9ca3af',
          letterSpacing: '0.1em'
        }}>
          AEGIS SECURE SHELL
        </span>
      </div>

      {/* Window Controls - Must be non-draggable to be clickable */}
      <div style={{ 
        display: 'flex', 
        height: '100%',
        WebkitAppRegion: 'no-drag' 
      }}>
        <button 
          onClick={handleMinimize}
          className="window-control-btn"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            width: '46px',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <Minus size={16} />
        </button>
        <button 
          onClick={handleMaximize}
          className="window-control-btn"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            width: '46px',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <Square size={14} />
        </button>
        <button 
          onClick={handleClose}
          className="window-control-btn close-btn"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            width: '46px',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <X size={16} />
        </button>
      </div>

      <style>{`
        .window-control-btn:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }
        .window-control-btn.close-btn:hover {
          background: #e11d48 !important;
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}

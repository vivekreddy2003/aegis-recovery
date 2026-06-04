import React from 'react';
import { Search, ShieldAlert, Trash2, Box, Share2, Wrench } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'scanner', label: 'Scanner', icon: Search },
    { id: 'vault', label: 'Vault', icon: ShieldAlert },
    { id: 'shredder', label: 'Shredder', icon: Trash2 },
    { id: 'utilities', label: 'Utilities', icon: Wrench },
    { id: 'portal', label: 'Sharing', icon: Share2 },
    { id: 'playground', label: 'Playground', icon: Box }
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`bottom-nav-item ${isActive ? 'active' : ''} haptic-tap`}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <div className="bottom-nav-icon-wrapper" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '12px',
              background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
              boxShadow: isActive ? 'inset 0 0 10px rgba(99, 102, 241, 0.1)' : 'none',
              color: isActive ? '#6366f1' : '#6b7280',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <Icon size={24} style={{
                filter: isActive ? 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.5))' : 'none'
              }} />
            </div>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: isActive ? '700' : '500',
              letterSpacing: '0.01em',
              transition: 'all 0.3s ease'
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

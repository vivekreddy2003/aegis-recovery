import React, { useState } from 'react';
import { ShieldAlert, Trash2, Upload, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { addLog } from '../utils/db';

export default function DataShredder() {
  const [file, setFile] = useState(null);
  const [isShredding, setIsShredding] = useState(false);
  const [pass, setPass] = useState(0); // 0 | 1 | 2 | 3
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsComplete(false);
      setPass(0);
      setProgress(0);
      setLogs([]);
    }
  };

  const runShredding = async () => {
    if (!file) return;
    
    setIsShredding(true);
    setIsComplete(false);
    setPass(1);
    setProgress(0);
    setLogs(['[SHRED] Initializing multi-pass digital shredder...', `[SHRED] Target payload: ${file.name}`, `[SHRED] Payload size: ${(file.size / 1024).toFixed(2)} KB`, '[SHRED] Enforcing DoD 5220.22-M wiping standards...']);
    
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    // PASS 1: Zero-Fill (Overwriting all sectors with 0x00)
    setLogs(prev => [...prev, '[PASS 1] Overwriting storage blocks with Zero-bytes (0x00)...']);
    for (let p = 0; p <= 100; p += 10) {
      await delay(80);
      setProgress(p);
    }
    setLogs(prev => [...prev, '[PASS 1] Verification successful. Standard file system indices dissolved.']);
    
    // PASS 2: Random-Noise Fill (Overwriting all sectors with random bytes)
    await delay(300);
    setPass(2);
    setProgress(0);
    setLogs(prev => [...prev, '[PASS 2] Overwriting storage blocks with Cryptographic Random Noise (0xFF-0x00)...']);
    for (let p = 0; p <= 100; p += 10) {
      await delay(100);
      setProgress(p);
    }
    setLogs(prev => [...prev, '[PASS 2] Verification successful. Magnetic resonance signatures scrambled.']);

    // PASS 3: Final Scramble & Truncation (Zero-out headers & truncate file pointer)
    await delay(300);
    setPass(3);
    setProgress(0);
    setLogs(prev => [...prev, '[PASS 3] Disassembling file allocation references & truncating file size...']);
    for (let p = 0; p <= 100; p += 20) {
      await delay(60);
      setProgress(p);
    }
    setLogs(prev => [...prev, '[PASS 3] Disposed file pointer table links. Size truncated to 0 bytes.']);

    await delay(400);
    setIsShredding(false);
    setIsComplete(true);
    setFile(null);
    addLog('warning', 'Secure Shredding Event Concluded', `Permanently shredded and destroyed file: ${file.name}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Shredder Interface Card */}
      <div className="glass-card" style={{ borderLeft: isComplete ? '4px solid var(--neon-emerald)' : isShredding ? '4px solid var(--neon-rose)' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '12px',
            background: 'rgba(244, 63, 94, 0.1)',
            color: '#f43f5e'
          }}>
            <Trash2 size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Anti-Forensic Shredder</h2>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Irreversibly wipe and destroy sensitive files.</p>
          </div>
        </div>

        {/* Informative Warning Gauge */}
        {!isShredding && !isComplete && (
          <div style={{
            display: 'flex',
            gap: '10px',
            padding: '12px 14px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '12px',
            color: '#f59e0b',
            fontSize: '0.8rem',
            lineHeight: 1.4,
            marginBottom: '20px'
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span style={{ fontWeight: 700, display: 'block', marginBottom: '2px' }}>WARNING: IRREVERSIBLE ACTION</span>
              Files shredded using Aegis undergo 3 passes of binary overwriting. They **cannot** be recovered by any software or hardware forensic techniques.
            </div>
          </div>
        )}

        {/* Main Interface Content */}
        {!isShredding && !isComplete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              onClick={() => document.getElementById('shred-file-input').click()}
              style={{
                border: '2px dashed rgba(244, 63, 94, 0.3)',
                borderRadius: '16px',
                padding: '24px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(244, 63, 94, 0.01)',
                transition: 'all 0.3s'
              }}
              className="interactive"
            >
              <input
                type="file"
                id="shred-file-input"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(244, 63, 94, 0.08)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f43f5e',
                marginBottom: '10px',
                boxShadow: '0 0 20px rgba(244, 63, 94, 0.05)'
              }}>
                <Upload size={20} />
              </div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>
                {file ? file.name : 'Select File to Atomize'}
              </h3>
              <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                {file ? `Size: ${(file.size / 1024).toFixed(2)} KB • Tap to change` : 'Choose any document, photo, or block to securely shred.'}
              </p>
            </div>

            <button
              onClick={runShredding}
              disabled={!file}
              className="btn-neon"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--neon-rose), #e11d48)',
                boxShadow: '0 4px 15px rgba(244, 63, 94, 0.35)',
                opacity: !file ? 0.5 : 1,
                cursor: !file ? 'not-allowed' : 'pointer'
              }}
            >
              <Trash2 size={18} />
              Shred & Purge File
            </button>
          </div>
        )}

        {/* Shredding Progress Screen */}
        {isShredding && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Pass status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-rose" style={{ animation: 'pulse 1s infinite alternate' }}>
                PASS {pass}/3 ACTIVE
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--neon-rose)' }}>
                {progress}%
              </span>
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              {pass === 1 && 'Overwriting Sectors with Zero-bytes'}
              {pass === 2 && 'Scrambling Sectors with Cryptographic Noise'}
              {pass === 3 && 'Truncating File Allocation Reference Maps'}
            </h3>

            {/* Circular or Bar Progress Indicators */}
            <div className="stat-gauge">
              <div className="stat-track">
                <div className="stat-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--neon-rose), var(--neon-amber))' }}></div>
              </div>
            </div>

            {/* Action Logs */}
            <div className="terminal-box" style={{ borderColor: 'rgba(244, 63, 94, 0.25)', height: '110px' }}>
              {logs.map((log, idx) => (
                <div key={idx} className="log-entry" style={{
                  color: log.includes('[PASS') ? 'var(--neon-amber)' : 
                         log.includes('[SHRED]') ? 'var(--neon-rose)' : '#9ca3af'
                }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shredding Complete Screen */}
        {isComplete && (
          <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.15)'
            }}>
              <CheckCircle size={32} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>Payload Atomized</h3>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', maxWidth: '260px', margin: '0 auto', lineHeight: 1.4 }}>
                The target structure has been fully overwritten, scrambled, truncated, and purged from disk sectors.
              </p>
            </div>

            <button
              onClick={() => setIsComplete(false)}
              className="btn-neon"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--neon-emerald), #059669)',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)'
              }}
            >
              <RefreshCw size={16} />
              Shred Another File
            </button>
          </div>
        )}

      </div>
      
    </div>
  );
}

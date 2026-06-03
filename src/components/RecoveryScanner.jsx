import React, { useState, useEffect, useRef } from 'react';
import { Search, Upload, ShieldCheck, ShieldAlert, FileText, ImageIcon, File, CornerDownRight, Play, Terminal, HelpCircle } from 'lucide-react';
import { carveData } from '../utils/carver';
import { encryptFile } from '../utils/crypto';
import { saveToVault, addLog } from '../utils/db';
import confetti from 'canvas-confetti';

export default function RecoveryScanner({ masterPin }) {
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanType, setScanType] = useState('deep'); // 'quick' | 'deep'
  const [progress, setProgress] = useState(0);
  const [activeBlock, setActiveBlock] = useState(-1);
  const [carvedBlocks, setCarvedBlocks] = useState([]);
  const [hexPreview, setHexPreview] = useState('AWAITING DATA STREAM...');
  const [logs, setLogs] = useState([]);
  const [recoveredFiles, setRecoveredFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [restoring, setRestoring] = useState(false);
  
  const fileInputRef = useRef(null);
  const logsEndRef = useRef(null);

  // Auto scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      addLog('info', `File loaded for scan: ${droppedFile.name}`, `Size: ${droppedFile.size} bytes`);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      addLog('info', `File loaded for scan: ${selectedFile.name}`, `Size: ${selectedFile.size} bytes`);
    }
  };

  // Run simulated Quick Scan
  const runQuickScan = async () => {
    setIsScanning(true);
    setProgress(0);
    setLogs(['[SYSTEM] Initializing Quick Recovery Mode...', '[SYSTEM] Searching Windows Recycle Bin equivalents...', '[SYSTEM] Accessing browser local temporary index blocks...']);
    setRecoveredFiles([]);
    setSelectedFiles({});
    
    const delay = (ms) => new Promise(res => setTimeout(res, ms));
    
    for (let p = 5; p <= 100; p += 5) {
      await delay(60);
      setProgress(p);
      
      if (p === 20) {
        setLogs(prev => [...prev, '[LOG] Parsing directory: C:\\Users\\User\\AppData\\Local\\Temp']);
      } else if (p === 40) {
        setLogs(prev => [...prev, '[FOUND] Found index entry matching: index_deleted_log_14.txt (4.2 KB)']);
      } else if (p === 60) {
        setLogs(prev => [...prev, '[LOG] Scanning browser history cache logs...']);
      } else if (p === 80) {
        setLogs(prev => [...prev, '[FOUND] Found thumbnail metadata: cache_thumb_img_92.png (12 KB)']);
      }
    }
    
    // Generate mock recovered files
    const mockFiles = [
      {
        id: 'mock-1',
        name: 'deleted_sys_log_2026.txt',
        type: 'text/plain',
        size: 4320,
        ext: 'txt',
        health: 100,
        recoveryOffset: '0x1F2C',
        timestamp: new Date().toLocaleTimeString(),
        data: new TextEncoder().encode('AEGIS SYSTEM QUICK RECOVERY LOG\nEverything is operational. Test recovery succeeded.')
      },
      {
        id: 'mock-2',
        name: 'cache_thumb_img_92.png',
        type: 'image/png',
        size: 12288,
        ext: 'png',
        health: 90,
        recoveryOffset: '0x3AC4',
        timestamp: new Date().toLocaleTimeString(),
        // Simple transparent image
        data: new Uint8Array([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
          0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
          0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
          0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
          0x42, 0x60, 0x82
        ]).buffer
      }
    ];
    
    setRecoveredFiles(mockFiles);
    setLogs(prev => [...prev, '[SYSTEM] Quick scan successfully finalized. 2 items identified.']);
    setIsScanning(false);
    confetti({ particleCount: 80, spread: 60 });
    addLog('info', 'Quick Scan Completed', 'Recovered 2 cached system logs.');
  };

  // Run deep binary carving scan using utilities
  const runDeepScan = async () => {
    if (!file) return;
    
    setIsScanning(true);
    setProgress(0);
    setCarvedBlocks([]);
    setLogs(['[FORENSIC] Initializing deep signature byte carver...', `[FORENSIC] Target file: ${file.name}`, `[FORENSIC] Total byte sectors: ${Math.ceil(file.size / 512)}`]);
    setRecoveredFiles([]);
    setSelectedFiles({});
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        
        // Execute real binary carving from utilities!
        const files = await carveData(arrayBuffer, (update) => {
          if (update.progress !== undefined) {
            setProgress(Math.round(update.progress));
          }
          if (update.currentSector !== undefined) {
            setActiveBlock(Math.floor(update.currentSector % 256));
            // Mark sector as scanned
            setCarvedBlocks(prev => {
              const blocks = [...prev];
              const blockIndex = Math.floor(update.currentSector % 256);
              if (!blocks.includes(blockIndex)) {
                blocks.push(blockIndex);
              }
              return blocks;
            });
          }
          if (update.hexSample !== undefined) {
            setHexPreview(update.hexSample);
          }
          if (update.log !== undefined) {
            setLogs(prev => [...prev, update.log]);
            
            // Mark block green if file carved
            if (update.log.includes('[CARVED]')) {
              setCarvedBlocks(prev => {
                const blocks = [...prev];
                // Add green marker class simulation in grid
                return blocks;
              });
            }
          }
        });
        
        setRecoveredFiles(files);
        setLogs(prev => [...prev, `[FORENSIC] Signature scan concluded. Identified ${files.length} valid file headers.`]);
        setIsScanning(false);
        if (files.length > 0) {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.8 } });
        }
        addLog('info', 'Deep Byte Carving Scan Complete', `Carved ${files.length} deleted file blocks from ${file.name}.`);
      };
      
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      setLogs(prev => [...prev, `[ERROR] Secure scanning failed: ${err.message}`]);
      setIsScanning(false);
    }
  };

  const handleSelectToggle = (id) => {
    setSelectedFiles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAll = () => {
    if (Object.keys(selectedFiles).length === recoveredFiles.length) {
      setSelectedFiles({});
    } else {
      const selections = {};
      recoveredFiles.forEach(f => {
        selections[f.id] = true;
      });
      setSelectedFiles(selections);
    }
  };

  // Securely restore files (and encrypt them with AES PIN into secure vault)
  const restoreSelectedFiles = async (shouldEncrypt) => {
    const selectedIds = Object.keys(selectedFiles).filter(id => selectedFiles[id]);
    if (selectedIds.length === 0) return;
    
    setRestoring(true);
    addLog('info', 'Restoration Started', `Attempting to restore ${selectedIds.length} files. Encryption: ${shouldEncrypt ? 'AES-256' : 'None'}`);

    try {
      for (const id of selectedIds) {
        const fileObj = recoveredFiles.find(f => f.id === id);
        if (!fileObj) continue;
        
        if (shouldEncrypt) {
          // Encrypt recovered ArrayBuffer via Master PIN using Web Crypto API
          const { ciphertext, iv, salt } = await encryptFile(fileObj.data, masterPin);
          
          await saveToVault({
            id: fileObj.id,
            name: fileObj.name + '.aegis',
            originalName: fileObj.name,
            type: fileObj.type,
            size: fileObj.size,
            ciphertext,
            iv,
            salt,
            timestamp: new Date().toLocaleString()
          });
        } else {
          // Standard download trigger for standard recovery
          const blob = new Blob([fileObj.data], { type: fileObj.type });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileObj.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
      
      confetti({ particleCount: 80, spread: 60, colors: shouldEncrypt ? ['#6366f1', '#a855f7'] : ['#10b981', '#06b6d4'] });
      alert(shouldEncrypt ? 'Recovered files secured and encrypted into your Aegis Vault!' : 'Successfully restored selected files!');
      setSelectedFiles({});
      addLog('info', 'Restoration Finalized', `Successfully restored ${selectedIds.length} files.`);
    } catch (err) {
      console.error(err);
      alert('Secure restoration failed: ' + err.message);
    } finally {
      setRestoring(false);
    }
  };

  // Generate a preview image URL if image
  const getImagePreview = (fileObj) => {
    if (fileObj.type.startsWith('image/')) {
      try {
        const blob = new Blob([fileObj.data], { type: fileObj.type });
        return URL.createObjectURL(blob);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Upload area or Scan Controller */}
      {!isScanning && recoveredFiles.length === 0 ? (
        <div className="glass-card">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Forensic Scanner</h2>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Select recovery intensity and feed storage arrays.</p>
            </div>
            
            <div style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '10px',
              padding: '2px',
              border: '1px solid var(--border-color)'
            }}>
              <button
                onClick={() => setScanType('quick')}
                className="haptic-tap"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: scanType === 'quick' ? 'var(--neon-indigo)' : 'transparent',
                  color: scanType === 'quick' ? '#ffffff' : '#9ca3af',
                  transition: 'all 0.2s'
                }}
              >
                Quick Scan
              </button>
              <button
                onClick={() => setScanType('deep')}
                className="haptic-tap"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: scanType === 'deep' ? 'var(--neon-indigo)' : 'transparent',
                  color: scanType === 'deep' ? '#ffffff' : '#9ca3af',
                  transition: 'all 0.2s'
                }}
              >
                Deep Carver
              </button>
            </div>
          </div>

          {scanType === 'deep' ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(99, 102, 241, 0.3)',
                borderRadius: '16px',
                padding: '30px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(99, 102, 241, 0.02)',
                transition: 'all 0.3s'
              }}
              className="interactive"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.08)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366f1',
                marginBottom: '14px',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.1)'
              }}>
                <Upload size={24} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '6px' }}>
                {file ? file.name : 'Load Disk Dump or Backup'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', maxWidth: '280px', margin: '0 auto' }}>
                {file ? `Size: ${(file.size / 1024).toFixed(2)} KB - Tap to change` : 'Drag and drop or tap to select a virtual forensic binary disk image to scan.'}
              </p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px 20px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <ShieldCheck size={40} color="#6366f1" style={{ marginBottom: '10px' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px' }}>System Quick Recovery</h3>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', maxWidth: '280px', margin: '0 auto', lineHeight: 1.4 }}>
                Quickly sweeps through the device\'s browser storage sandbox, cache maps, and local Recycle indices without file carving.
              </p>
            </div>
          )}

          <button
            onClick={scanType === 'deep' ? runDeepScan : runQuickScan}
            disabled={scanType === 'deep' && !file}
            className="btn-neon animate-pulse-cyan"
            style={{
              width: '100%',
              marginTop: '20px',
              opacity: (scanType === 'deep' && !file) ? 0.5 : 1,
              cursor: (scanType === 'deep' && !file) ? 'not-allowed' : 'pointer'
            }}
          >
            <Play size={18} />
            Initialize Secure Scan
          </button>
        </div>
      ) : null}

      {/* Real-time Scanning Progress Board */}
      {isScanning && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Byte-Signature Scan in Progress
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {scanType === 'deep' ? 'Carving Sector Arrays' : 'Indexing System Cache'}
              </h3>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--neon-cyan)' }}>
                {progress}%
              </span>
            </div>
            
            {/* Progress Gauge */}
            <div className="stat-gauge" style={{ marginTop: '10px' }}>
              <div className="stat-track">
                <div className="stat-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>

          {/* Glowing Active Grid for Deep Carver */}
          {scanType === 'deep' && (
            <div>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Virtual Memory Block Grid:
              </span>
              <div className="scanning-sector-grid">
                {Array.from({ length: 256 }).map((_, idx) => {
                  const isScanned = carvedBlocks.includes(idx);
                  const isActive = activeBlock === idx;
                  let blockClass = 'sector-block';
                  if (isActive) blockClass += ' active';
                  else if (isScanned) blockClass += ' scanned';
                  
                  return (
                    <div
                      key={idx}
                      className={blockClass}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Hex Stream preview */}
          {scanType === 'deep' && (
            <div>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Raw Hex Sector Stream:
              </span>
              <div className="hex-dump-panel">
                <pre style={{ margin: 0 }}>{hexPreview}</pre>
              </div>
            </div>
          )}

          {/* Live Action Logs Terminal */}
          <div>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              System Terminal Output:
            </span>
            <div className="terminal-box">
              {logs.map((log, idx) => (
                <div key={idx} className="log-entry" style={{
                  color: log.includes('[FOUND]') || log.includes('[CARVED]') ? 'var(--neon-emerald)' : 
                         log.includes('[ERROR]') ? 'var(--neon-rose)' : 
                         log.includes('[SYSTEM]') ? 'var(--neon-indigo)' : 'var(--neon-cyan)'
                }}>
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Recovered Items Dashboard */}
      {!isScanning && recoveredFiles.length > 0 && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Carved Memory Segments</h2>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Select restored sectors to save or encrypt.</p>
            </div>
            
            <button
              onClick={handleSelectAll}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
            >
              {Object.keys(selectedFiles).filter(id => selectedFiles[id]).length === recoveredFiles.length 
                ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Item Listing Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recoveredFiles.map((fileObj) => {
              const isSelected = !!selectedFiles[fileObj.id];
              const isImg = fileObj.type.startsWith('image/');
              const imgUrl = isImg ? getImagePreview(fileObj) : null;
              
              return (
                <div
                  key={fileObj.id}
                  onClick={() => handleSelectToggle(fileObj.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '14px',
                    border: '1px solid',
                    borderColor: isSelected ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-color)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'rgba(0, 0, 0, 0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="interactive"
                >
                  {/* Thumbnail / Icon Selector */}
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                    flexShrink: 0
                  }}>
                    {isImg && imgUrl ? (
                      <img src={imgUrl} alt="recovered preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : isImg ? (
                      <ImageIcon size={20} color="#a855f7" />
                    ) : fileObj.type === 'application/pdf' ? (
                      <FileText size={20} color="#ef4444" />
                    ) : (
                      <File size={20} color="#3b82f6" />
                    )}
                  </div>

                  {/* Metadata labels */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {fileObj.name}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                        {(fileObj.size / 1024).toFixed(2)} KB
                      </span>
                      <span style={{ fontSize: '0.65rem', color: '#6b7280', fontFamily: 'var(--font-mono)' }}>
                        {fileObj.recoveryOffset}
                      </span>
                    </div>
                  </div>

                  {/* Health gauge badge */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className={`badge ${fileObj.health >= 80 ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                      {fileObj.health}% Health
                    </span>
                    <span style={{ display: 'block', fontSize: '0.6rem', color: '#6b7280', marginTop: '4px' }}>
                      {fileObj.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secure Actions bar */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              onClick={() => restoreSelectedFiles(false)}
              disabled={restoring || Object.values(selectedFiles).filter(Boolean).length === 0}
              className="btn-secondary"
              style={{
                flex: 1,
                opacity: Object.values(selectedFiles).filter(Boolean).length === 0 ? 0.5 : 1,
                cursor: Object.values(selectedFiles).filter(Boolean).length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Restore Standard
            </button>
            
            <button
              onClick={() => restoreSelectedFiles(true)}
              disabled={restoring || Object.values(selectedFiles).filter(Boolean).length === 0}
              className="btn-neon"
              style={{
                flex: 1.3,
                opacity: Object.values(selectedFiles).filter(Boolean).length === 0 ? 0.5 : 1,
                cursor: Object.values(selectedFiles).filter(Boolean).length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <ShieldCheck size={18} />
              Encrypt to Vault
            </button>
          </div>
          
          <button
            onClick={() => { setRecoveredFiles([]); setSelectedFiles({}); }}
            className="btn-secondary"
            style={{ width: '100%', padding: '10px' }}
          >
            Reset Scanner
          </button>
        </div>
      )}
    </div>
  );
}

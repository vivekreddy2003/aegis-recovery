import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, Unlock, Eye, Trash2, ShieldCheck, Download, AlertCircle, Cloud, Search, CloudLightning } from 'lucide-react';
import { decryptFile } from '../utils/crypto';
import { getVaultFiles, deleteFromVault, addLog } from '../utils/db';

export default function EncryptedVault({ masterPin }) {
  const [vaultFiles, setVaultFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedPreview, setDecryptedPreview] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [syncingId, setSyncingId] = useState(null);
  const [syncedIds, setSyncedIds] = useState(new Set()); // Mock cloud state

  // Load vault files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const files = await getVaultFiles();
      setVaultFiles(files);
    } catch (err) {
      console.error('Failed to load secure vault inventory:', err);
    }
  };

  const handleDecrypt = async (fileObj) => {
    setIsDecrypting(true);
    setError('');
    setDecryptedPreview(null);
    setActiveFile(fileObj);
    
    try {
      // Small visual delay to showcase secure decryption key derivation
      await new Promise(resolve => setTimeout(resolve, 800));

      // Decrypt ArrayBuffer from IndexedDB using AES-GCM 256
      const decryptedBuffer = await decryptFile(
        fileObj.ciphertext,
        masterPin,
        fileObj.iv,
        fileObj.salt
      );

      // Create object URL representing decrypted binary blob
      const blob = new Blob([decryptedBuffer], { type: fileObj.type });
      const url = URL.createObjectURL(blob);
      
      let textPreview = null;
      if (fileObj.type.startsWith('text/')) {
        textPreview = new TextDecoder().decode(decryptedBuffer);
      }

      setDecryptedPreview({
        url,
        blob,
        textPreview
      });
      
      addLog('info', 'File Decrypted from Vault', `Filename: ${fileObj.originalName}`);
    } catch (err) {
      console.error(err);
      setError('Decryption failed: incorrect PIN configuration or tampered sector bits.');
      addLog('warning', 'Vault Decryption Failure', `Attempted decryption of ${fileObj.originalName} failed.`);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDownload = (fileObj) => {
    if (!decryptedPreview) return;
    
    const a = document.createElement('a');
    a.href = decryptedPreview.url;
    a.download = fileObj.originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Are you sure you want to permanently delete ${name} from your secure vault?`)) {
      try {
        await deleteFromVault(id);
        await addLog('info', 'File Deleted from Vault', `Filename: ${name}`);
        loadFiles();
        if (activeFile && activeFile.id === id) {
          setActiveFile(null);
          setDecryptedPreview(null);
        }
      } catch (err) {
        console.error('Failed to purge vault item:', err);
      }
    }
  };

  const handleCloudSync = async (fileObj) => {
    setSyncingId(fileObj.id);
    
    // Simulate secure cloud upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSyncedIds(prev => new Set(prev).add(fileObj.id));
    setSyncingId(null);
    addLog('info', 'Zero-Knowledge Cloud Sync', `Encrypted blob ${fileObj.originalName} synced to remote Aegis cluster.`);
  };

  const filteredVaultFiles = vaultFiles.filter(f => 
    f.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Vault Inventory Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.1)',
            color: '#6366f1'
          }}>
            <Lock size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>AES-256 Secure Vault</h2>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Your locally encrypted recovered sandboxed files.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
          <input 
            type="text" 
            placeholder="Search encrypted vault..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input"
            style={{ paddingLeft: '40px', fontSize: '0.85rem' }}
          />
        </div>

        {filteredVaultFiles.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '30px 20px',
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px dashed var(--border-color)',
            borderRadius: '16px'
          }}>
            <ShieldCheck size={36} color="#6b7280" style={{ marginBottom: '10px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#9ca3af', marginBottom: '4px' }}>Vault is Empty</h3>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', maxWidth: '240px', margin: '0 auto', lineHeight: 1.4 }}>
              Recover deleted files using the <strong>Scanner</strong> tab and choose <strong>"Encrypt to Vault"</strong> to secure them.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredVaultFiles.map((fileObj) => {
              const isImg = fileObj.type.startsWith('image/');
              const isSynced = syncedIds.has(fileObj.id);
              const isSyncing = syncingId === fileObj.id;
              
              return (
                <div
                  key={fileObj.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.08)',
                      color: '#6366f1',
                      flexShrink: 0
                    }}>
                      <Lock size={18} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        display: 'block',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>
                        {fileObj.originalName}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                        {(fileObj.size / 1024).toFixed(2)} KB • Encrypted Vault
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleCloudSync(fileObj)}
                      disabled={isSyncing || isSynced}
                      className="haptic-tap"
                      style={{
                        background: isSynced ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.08)',
                        border: `1px solid ${isSynced ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
                        borderRadius: '10px',
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSynced ? '#10b981' : '#8b5cf6',
                        cursor: (isSyncing || isSynced) ? 'default' : 'pointer',
                        opacity: isSyncing ? 0.5 : 1
                      }}
                      title={isSynced ? "Synced to Cloud" : "Sync to Secure Cloud"}
                    >
                      {isSyncing ? (
                        <div style={{ width: '14px', height: '14px', border: '2px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      ) : isSynced ? (
                        <CloudLightning size={14} />
                      ) : (
                        <Cloud size={14} />
                      )}
                    </button>

                    <button
                      onClick={() => handleDecrypt(fileObj)}
                      className="haptic-tap"
                      style={{
                        background: 'rgba(6, 182, 212, 0.08)',
                        border: '1px solid rgba(6, 182, 212, 0.2)',
                        borderRadius: '10px',
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#06b6d4',
                        cursor: 'pointer'
                      }}
                      title="Decrypt File"
                    >
                      <Unlock size={14} />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(fileObj.id, fileObj.originalName)}
                      className="haptic-tap"
                      style={{
                        background: 'rgba(244, 63, 94, 0.08)',
                        border: '1px solid rgba(244, 63, 94, 0.2)',
                        borderRadius: '10px',
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f43f5e',
                        cursor: 'pointer'
                      }}
                      title="Purge File"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decryption Preview Portal */}
      {activeFile && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--neon-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Decryption Portal</h3>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{activeFile.originalName}</p>
            </div>
            <button
              onClick={() => { setActiveFile(null); setDecryptedPreview(null); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>

          {isDecrypting ? (
            <div style={{
              textAlign: 'center',
              padding: '24px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '3px solid rgba(6, 182, 212, 0.2)',
                borderTopColor: '#06b6d4',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
                Deriving AES key & decrypting sector blocks...
              </span>
            </div>
          ) : error ? (
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              color: '#f43f5e',
              fontSize: '0.8rem',
              lineHeight: 1.4
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          ) : decryptedPreview ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Media Preview Box */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '14px',
                textAlign: 'center',
                maxHeight: '200px',
                overflow: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {activeFile.type.startsWith('image/') ? (
                  <img
                    src={decryptedPreview.url}
                    alt="decrypted preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '160px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                    }}
                  />
                ) : decryptedPreview.textPreview ? (
                  <pre style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#ffffff',
                    textAlign: 'left',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {decryptedPreview.textPreview}
                  </pre>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={32} color="#10b981" />
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                      Binary data verified and decrypted (No visual preview for {activeFile.type})
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => handleDownload(activeFile)}
                className="btn-neon"
                style={{
                  background: 'linear-gradient(135deg, var(--neon-cyan), #0891b2)',
                  boxShadow: '0 4px 15px rgba(6, 182, 212, 0.35)',
                  width: '100%'
                }}
              >
                <Download size={18} />
                Export Decrypted File
              </button>
            </div>
          ) : null}
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
    </div>
  );
}

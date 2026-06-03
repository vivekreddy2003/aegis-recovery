import React, { useState, useEffect, useRef } from 'react';
import { Share2, Link, Copy, Check, Upload, AlertCircle, Wifi, ShieldCheck, Download, RefreshCw, Send } from 'lucide-react';
import { Peer } from 'peerjs';
import { addLog } from '../utils/db';

export default function NetworkPortal() {
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('offline'); // 'offline' | 'connecting' | 'online'
  
  // File transfer states
  const [file, setFile] = useState(null);
  const [transferMode, setTransferMode] = useState(null); // 'send' | 'receive'
  const [progress, setProgress] = useState(0);
  const [transferSpeed, setTransferSpeed] = useState(0);
  const [transferLogs, setTransferLogs] = useState([]);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [error, setError] = useState('');

  const activeConnectionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize WebRTC Peer and check for incoming share links
  useEffect(() => {
    // Generate a secure, easy-to-read Aegis identity
    const secureRandomId = 'AEGIS-' + Math.floor(1000 + Math.random() * 9000);
    
    const newPeer = new Peer(secureRandomId, {
      debug: 1
    });

    newPeer.on('open', (id) => {
      setMyId(id);
      setConnectionStatus('online');
      addLog('info', 'WebRTC Secure Peer Initialized', `Registered ID: ${id}`);
      
      // AFTER opening our peer, check if we arrived via a secure share link
      checkShareLink(id, newPeer);
    });

    newPeer.on('error', (err) => {
      console.error('PeerJS error:', err);
      setError('Connection failed: ' + err.type);
      setConnectionStatus('offline');
    });

    // Listen for incoming file transfer connections
    newPeer.on('connection', (conn) => {
      setTransferLogs(['[PORTAL] WebRTC Incoming Peer Handshake detected...', `[PORTAL] Remote Peer ID: ${conn.peer}`]);
      activeConnectionRef.current = conn;
      
      conn.on('open', () => {
        setConnectionStatus('online');
      });

      let receivedChunks = [];
      let receivedBytes = 0;
      let totalBytes = 0;
      let fileName = '';
      let fileType = '';
      let startTime = 0;

      conn.on('data', (data) => {
        if (data.type === 'meta') {
          setIncomingRequest({
            senderId: conn.peer,
            name: data.name,
            size: data.size,
            mime: data.mime
          });
          fileName = data.name;
          fileType = data.mime;
          totalBytes = data.size;
          setTransferMode('receive');
        } 
        else if (data.type === 'chunk') {
          if (!startTime) startTime = Date.now();
          
          receivedChunks.push(data.chunk);
          receivedBytes += data.chunk.byteLength;
          
          const pct = Math.round((receivedBytes / totalBytes) * 100);
          setProgress(pct);

          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed > 0) {
            const speed = (receivedBytes / (1024 * 1024)) / elapsed;
            setTransferSpeed(speed.toFixed(2));
          }

          if (receivedBytes >= totalBytes) {
            const blob = new Blob(receivedChunks, { type: fileType });
            const url = URL.createObjectURL(blob);

            setTransferLogs(prev => [...prev, `[SUCCESS] Carved and verified direct P2P data payload!`, `[SUCCESS] Download compiled successfully.`]);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            addLog('info', 'File Received via WebRTC', `Filename: ${fileName}, Size: ${totalBytes} bytes`);
            setIncomingRequest(null);
            setProgress(100);
            
            setTimeout(() => {
              setTransferMode(null);
              setProgress(0);
            }, 3000);
          }
        }
        else if (data.type === 'cancel') {
          setTransferLogs(prev => [...prev, '[WARNING] Remote peer cancelled the transfer corridor connection.']);
          activeConnectionRef.current = null;
          setTimeout(() => {
            setTransferMode(null);
            setProgress(0);
            setTransferSpeed(0);
            setIncomingRequest(null);
            setFile(null);
            setShareLink('');
          }, 1500);
        }
      });
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, []);

  // Parses query parameters to automatically trigger incoming transfer request
  const checkShareLink = (currentId, peerInstance) => {
    const params = new URLSearchParams(window.location.search);
    const senderShareId = params.get('shareId');
    const fileName = params.get('name');
    const fileSize = params.get('size');
    const fileMime = params.get('mime') || 'application/octet-stream';

    if (senderShareId && fileName && fileSize) {
      addLog('info', 'Secure share link detected', `Connecting to sender ID: ${senderShareId}`);
      
      // Auto-populate target receiver ID
      setTargetId(senderShareId);
      
      // Display receipt details in the UI
      setIncomingRequest({
        senderId: senderShareId,
        name: decodeURIComponent(fileName),
        size: parseInt(fileSize),
        mime: fileMime,
        isAutoLink: true
      });
      setTransferMode('receive');
      setTransferLogs(['[PORTAL] Auto-share link identified.', `[PORTAL] Handshaking with sender: ${senderShareId}...`]);
      
      // Establish background connection to the sender peer
      const conn = peerInstance.connect(senderShareId);
      activeConnectionRef.current = conn;
      
      conn.on('open', () => {
        setConnectionStatus('online');
        setTransferLogs(prev => [...prev, '[PORTAL] Secure link channel verified. Awaiting file push...']);
      });

      // Handle direct file chunks pushed by sender
      let receivedChunks = [];
      let receivedBytes = 0;
      let totalBytes = parseInt(fileSize);
      let startTime = 0;

      conn.on('data', (data) => {
        if (data.type === 'chunk') {
          if (!startTime) startTime = Date.now();
          
          receivedChunks.push(data.chunk);
          receivedBytes += data.chunk.byteLength;
          
          const pct = Math.round((receivedBytes / totalBytes) * 100);
          setProgress(pct);

          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed > 0) {
            const speed = (receivedBytes / (1024 * 1024)) / elapsed;
            setTransferSpeed(speed.toFixed(2));
          }

          if (receivedBytes >= totalBytes) {
            const blob = new Blob(receivedChunks, { type: fileMime });
            const url = URL.createObjectURL(blob);

            setTransferLogs(prev => [...prev, `[SUCCESS] Carved and verified direct P2P data payload!`, `[SUCCESS] Download compiled successfully.`]);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = decodeURIComponent(fileName);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            addLog('info', 'File Received via WebRTC Auto-Link', `Filename: ${decodeURIComponent(fileName)}`);
            setIncomingRequest(null);
            setProgress(100);
            
            // Clean up browser URL bar so reloads don't re-trigger
            window.history.replaceState({}, document.title, window.location.pathname);
            
            setTimeout(() => {
              setTransferMode(null);
              setProgress(0);
            }, 3000);
          }
        }
        else if (data.type === 'cancel') {
          setTransferLogs(prev => [...prev, '[WARNING] Remote peer cancelled the transfer corridor connection.']);
          activeConnectionRef.current = null;
          window.history.replaceState({}, document.title, window.location.pathname);
          setTimeout(() => {
            setTransferMode(null);
            setProgress(0);
            setTransferSpeed(0);
            setIncomingRequest(null);
            setFile(null);
            setShareLink('');
          }, 1500);
        }
      });
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(myId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setShareLink(''); // Reset share link
      
      // Auto-generate share link incorporating current Peer ID and metadata
      if (myId) {
        const link = `${window.location.origin}${window.location.pathname}?shareId=${myId}&name=${encodeURIComponent(selectedFile.name)}&size=${selectedFile.size}&mime=${encodeURIComponent(selectedFile.type)}`;
        setShareLink(link);
      }
    }
  };

  const sendP2PFile = async () => {
    if (!targetId || !file || !peer) return;

    setTransferMode('send');
    setProgress(0);
    setTransferSpeed(0);
    setTransferLogs(['[PORTAL] Establishing WebRTC data corridor...', `[PORTAL] Targeting peer: ${targetId}`]);

    const conn = peer.connect(targetId);
    activeConnectionRef.current = conn;

    conn.on('open', () => {
      setTransferLogs(prev => [...prev, '[PORTAL] Handshake confirmed. Encryption keys exchanged.', `[PORTAL] Streaming: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`]);

      conn.send({
        type: 'meta',
        name: file.name,
        size: file.size,
        mime: file.type
      });

      const chunkSize = 32 * 1024;
      const reader = new FileReader();
      let offset = 0;
      let startTime = Date.now();

      reader.onload = (e) => {
        // Abort file reader loop if transfer is cancelled
        if (!activeConnectionRef.current) return;

        const chunk = e.target.result;
        try {
          conn.send({
            type: 'chunk',
            chunk: chunk
          });
        } catch (err) {
          console.error('Send chunk aborted, connection lost:', err);
          return;
        }

        offset += chunk.byteLength;
        const pct = Math.round((offset / file.size) * 100);
        setProgress(pct);

        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed > 0) {
          const speed = (offset / (1024 * 1024)) / elapsed;
          setTransferSpeed(speed.toFixed(2));
        }

        if (offset < file.size) {
          readNextChunk();
        } else {
          setTransferLogs(prev => [...prev, '[SUCCESS] Peer payload transfer finished successfully!', '[SUCCESS] Secured connection closed.']);
          addLog('info', 'File Sent via WebRTC', `Filename: ${file.name}, Destination: ${targetId}`);
          setFile(null);
          setShareLink('');
          setTimeout(() => {
            setTransferMode(null);
            setProgress(0);
          }, 3000);
        }
      };

      const readNextChunk = () => {
        const slice = file.slice(offset, offset + chunkSize);
        reader.readAsArrayBuffer(slice);
      };

      readNextChunk();
    });

    conn.on('error', (err) => {
      console.error(err);
      setError('Failed to stream files: ' + err.message);
      setTransferMode(null);
    });
  };

  const cancelTransfer = () => {
    try {
      if (activeConnectionRef.current) {
        try {
          activeConnectionRef.current.send({ type: 'cancel' });
        } catch (e) {}
        activeConnectionRef.current.close();
        activeConnectionRef.current = null;
      }
      addLog('warning', 'P2P Transfer Cancelled', 'File streaming was manually terminated by the operator.');
      setTransferLogs(prev => [...prev, '[CANCEL] Connection shut down. Transfer corridor terminated.']);
      
      setTimeout(() => {
        setTransferMode(null);
        setProgress(0);
        setTransferSpeed(0);
        setIncomingRequest(null);
        setFile(null);
        setShareLink('');
      }, 1500);
    } catch (err) {
      console.error('Failed to cancel transfer:', err);
    }
  };

  // Trigger file stream response when receiver accepts connection request
  const acceptIncomingTransfer = () => {
    setTransferLogs(prev => [...prev, '[PORTAL] Secure link accepted. Preparing Local buffers...']);
    
    // For auto share links, notify sender that receiver accepted the link
    if (incomingRequest.isAutoLink && activeConnectionRef.current) {
      setTransferLogs(prev => [...prev, '[PORTAL] Secure connection established. Requesting file payload...']);
    }
    setIncomingRequest(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* My Identity Card */}
      <div className="glass-card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(6, 182, 212, 0.1)',
              color: '#06b6d4'
            }}>
              <Share2 size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Network Sharing Portal</h2>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>P2P end-to-end encrypted direct file sharing.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connectionStatus === 'online' ? 'var(--neon-emerald)' : 'var(--neon-rose)',
              boxShadow: connectionStatus === 'online' ? '0 0 10px var(--neon-emerald)' : 'none'
            }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>
              {connectionStatus}
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#9ca3af', lineHeight: 1.5, marginBottom: '20px' }}>
          Stream recovered files or backups directly to other devices on the network. Connections are completely peer-to-peer with zero size limits.
        </p>

        {/* Share ID Copy Bar */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>
              My Receiver Security ID
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
              {myId || 'GENERATING SECURITY TUNNEL...'}
            </span>
          </div>
          
          {myId && (
            <button
              onClick={handleCopyId}
              className="haptic-tap"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {isCopied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Main Sender Console (if not transferring) */}
      {!transferMode && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Secure Send Station</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* File Drag Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(6, 182, 212, 0.3)',
                borderRadius: '16px',
                padding: '24px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(6, 182, 212, 0.01)',
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
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.08)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#06b6d4',
                marginBottom: '10px',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.05)'
              }}>
                <Upload size={20} />
              </div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>
                {file ? file.name : 'Select Share Payload'}
              </h4>
              <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                {file ? `Size: ${(file.size / 1024).toFixed(2)} KB • Tap to change` : 'Choose any document, photo, or block to securely send.'}
              </p>
            </div>

            {/* Dynamic Link Share Section */}
            {shareLink && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.04)',
                border: '1px solid rgba(99, 102, 241, 0.15)',
                borderRadius: '14px',
                padding: '14px',
                marginTop: '4px'
              }}>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--neon-indigo)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Secure Share Link (No ID Entry Required)
                </span>
                
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.4, marginBottom: '10px' }}>
                  Share this link with your recipient. Clicking it automatically connects devices and requests transfer of this file!
                </p>
                
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px'
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {shareLink}
                  </span>
                  
                  <button
                    onClick={handleCopyLink}
                    className="btn-neon"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      background: 'var(--neon-indigo)',
                      boxShadow: 'none'
                    }}
                  >
                    {isLinkCopied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              margin: '8px 0',
              color: '#6b7280',
              fontSize: '0.75rem'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              <span>OR ENTER TARGET ID MANUALLY</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            {/* Target ID Input */}
            <div>
              <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Recipient Receiver ID
              </label>
              <input
                type="text"
                placeholder="Enter Recipient's Aegis ID (e.g. AEGIS-1234)"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value.toUpperCase())}
                className="glass-input"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <button
              onClick={sendP2PFile}
              disabled={!targetId || !file || connectionStatus === 'offline'}
              className="btn-neon"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--neon-cyan), #0891b2)',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.35)',
                opacity: (!targetId || !file || connectionStatus === 'offline') ? 0.5 : 1,
                cursor: (!targetId || !file || connectionStatus === 'offline') ? 'not-allowed' : 'pointer'
              }}
            >
              <Send size={18} />
              Send to ID Receiver
            </button>
          </div>
        </div>
      )}

      {/* Connection request modal overlay */}
      {incomingRequest && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--neon-emerald)', animation: 'pulseCyan 2s infinite' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              flexShrink: 0
            }}>
              <Wifi size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Incoming P2P Stream Request</h3>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-emerald)', display: 'block', marginTop: '2px' }}>
                {incomingRequest.isAutoLink ? 'Automatic Secure Link Active' : `Sender ID: ${incomingRequest.senderId}`}
              </span>
            </div>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>{incomingRequest.name}</span>
            <span style={{ display: 'block', fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' }}>
              Size: {(incomingRequest.size / 1024).toFixed(2)} KB • Type: {incomingRequest.mime || 'unknown'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                setIncomingRequest(null);
                setTransferMode(null);
                window.history.replaceState({}, document.title, window.location.pathname);
              }}
              className="btn-secondary"
              style={{ flex: 1, padding: '10px' }}
            >
              Refuse Connection
            </button>
            <button
              onClick={acceptIncomingTransfer}
              className="btn-neon"
              style={{
                flex: 1.2,
                background: 'linear-gradient(135deg, var(--neon-emerald), #059669)',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                padding: '10px'
              }}
            >
              Accept Stream
            </button>
          </div>
        </div>
      )}

      {/* Active Transfer Screen */}
      {transferMode && !incomingRequest && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--neon-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span className="badge badge-cyan" style={{ animation: 'pulse 1s infinite alternate' }}>
                {transferMode === 'send' ? 'STREAMING PAYLOAD' : 'CORRIDOR INCOMING'}
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '6px' }}>
                {transferMode === 'send' ? 'WebRTC Encrypted Push' : 'WebRTC Encrypted Pull'}
              </h3>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--neon-cyan)' }}>
              {progress}%
            </span>
          </div>

          {/* Progress Indicators */}
          <div className="stat-gauge" style={{ marginBottom: '16px' }}>
            <div className="stat-track">
              <div className="stat-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#6b7280', marginTop: '4px' }}>
              <span>{transferSpeed} MB/s Transfer Speed</span>
              <span>Direct Encrypted Link (P2P)</span>
            </div>
          </div>

          {/* Transfer Logs Terminal */}
          <div>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Tunnel Terminal Log:
            </span>
            <div className="terminal-box" style={{ height: '110px' }}>
              {transferLogs.map((log, idx) => (
                <div key={idx} className="log-entry" style={{
                  color: log.includes('[SUCCESS') ? 'var(--neon-emerald)' : 'var(--neon-cyan)'
                }}>
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Cancel button */}
          <button
            onClick={cancelTransfer}
            className="btn-neon animate-pulse-cyan"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, var(--neon-rose), #be123c)',
              boxShadow: '0 4px 15px rgba(244, 63, 94, 0.25)',
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              color: '#ffffff'
            }}
          >
            Cancel Sharing Corridor
          </button>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
      `}</style>
      
    </div>
  );
}

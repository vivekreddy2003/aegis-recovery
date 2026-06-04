import React, { useState, useEffect, useRef } from 'react';
import { CameraOff, Image as ImageIcon, MessageSquare, History, Key, Shield, ShieldCheck, Download, Copy, RefreshCw, Mail } from 'lucide-react';
import { getLogs } from '../utils/db';

export default function UtilitiesPanel() {
  const [activeTab, setActiveTab] = useState('password');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{ borderLeft: '4px solid var(--neon-cyan)', padding: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
          Cyber Utilities
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#9ca3af', lineHeight: 1.5 }}>
          A suite of privacy and cryptography tools to sanitize files, secure communications, and monitor system events.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', background: 'rgba(8, 7, 16, 0.4)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => setActiveTab('password')}
          className="haptic-tap"
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
            background: activeTab === 'password' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeTab === 'password' ? 'var(--neon-cyan)' : '#9ca3af',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <Key size={16} /> Strong Password Generator
        </button>
        <button
          onClick={() => setActiveTab('exif')}
          className="haptic-tap"
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
            background: activeTab === 'exif' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'exif' ? 'var(--neon-indigo)' : '#9ca3af',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <CameraOff size={16} /> Photo Privacy Cleaner
        </button>
        <button
          onClick={() => setActiveTab('stego')}
          className="haptic-tap"
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
            background: activeTab === 'stego' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: activeTab === 'stego' ? 'var(--neon-emerald)' : '#9ca3af',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <MessageSquare size={16} /> Secret Message Hider
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className="haptic-tap"
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
            background: activeTab === 'audit' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
            color: activeTab === 'audit' ? 'var(--neon-rose)' : '#9ca3af',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <History size={16} /> App Security History
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className="haptic-tap"
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
            background: activeTab === 'email' ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
            color: activeTab === 'email' ? '#eab308' : '#9ca3af',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <Mail size={16} /> Ghost Email
        </button>
      </div>

      {/* Main Content Area */}
      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'password' && <PasswordGenerator />}
        {activeTab === 'exif' && <ExifSanitizer />}
        {activeTab === 'stego' && <SteganographyTool />}
        {activeTab === 'audit' && <AuditLogViewer />}
        {activeTab === 'email' && <GhostEmailTool />}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 1. Password Generator
// -------------------------------------------------------------
function PasswordGenerator() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(24);
  const [incUpper, setIncUpper] = useState(true);
  const [incLower, setIncLower] = useState(true);
  const [incNums, setIncNums] = useState(true);
  const [incSyms, setIncSyms] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    let charset = '';
    if (incUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (incLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (incNums) charset += '0123456789';
    if (incSyms) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    if (charset === '') {
      setPassword('Select at least one character type.');
      return;
    }

    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += charset[array[i] % charset.length];
    }
    setPassword(newPassword);
    setCopied(false);
  };

  useEffect(() => {
    generatePassword();
  }, [length, incUpper, incLower, incNums, incSyms]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate entropy
  let poolSize = 0;
  if (incUpper) poolSize += 26;
  if (incLower) poolSize += 26;
  if (incNums) poolSize += 10;
  if (incSyms) poolSize += 32;
  const entropy = poolSize > 0 ? length * Math.log2(poolSize) : 0;
  
  let strengthColor = '#f43f5e';
  let strengthLabel = 'WEAK';
  if (entropy > 50) { strengthColor = '#f59e0b'; strengthLabel = 'MODERATE'; }
  if (entropy > 80) { strengthColor = '#10b981'; strengthLabel = 'STRONG'; }
  if (entropy > 120) { strengthColor = '#06b6d4'; strengthLabel = 'MILITARY-GRADE'; }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Strong Password Generator</h3>
      
      <div style={{
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        marginBottom: '20px'
      }}>
        {/* Output Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '1.2rem',
            color: '#fff',
            wordBreak: 'break-all',
            letterSpacing: '0.05em'
          }}>
            {password}
          </div>
          <button
            onClick={copyToClipboard}
            className="haptic-tap"
            style={{
              background: copied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.1)',
              border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`,
              color: copied ? '#10b981' : '#06b6d4',
              borderRadius: '8px',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {copied ? <ShieldCheck size={24} /> : <Copy size={24} />}
          </button>
        </div>

        {/* Strength Meter */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Entropy Strength</span>
            <span style={{ fontSize: '0.8rem', color: strengthColor, fontWeight: 700, letterSpacing: '0.05em' }}>{strengthLabel} ({Math.round(entropy)} bits)</span>
          </div>
          <div className="stat-track" style={{ height: '6px' }}>
            <div className="stat-fill" style={{ width: `${Math.min((entropy / 150) * 100, 100)}%`, background: strengthColor }}></div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#fff' }}>Password Length</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--neon-cyan)', fontWeight: 700 }}>{length} characters</span>
            </div>
            <input
              type="range"
              min="8"
              max="128"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--neon-cyan)', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Uppercase (A-Z)', state: incUpper, setter: setIncUpper },
              { label: 'Lowercase (a-z)', state: incLower, setter: setIncLower },
              { label: 'Numbers (0-9)', state: incNums, setter: setIncNums },
              { label: 'Symbols (!@#$)', state: incSyms, setter: setIncSyms },
            ].map((opt, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#ccc' }}>
                <input
                  type="checkbox"
                  checked={opt.state}
                  onChange={(e) => opt.setter(e.target.checked)}
                  style={{ accentColor: 'var(--neon-cyan)', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <button
        onClick={generatePassword}
        className="btn-cyber-primary haptic-tap"
        style={{ width: '100%', justifyContent: 'center' }}
      >
        <RefreshCw size={18} /> Regenerate Password
      </button>
    </div>
  );
}

// -------------------------------------------------------------
// 2. EXIF Sanitizer (Photo Privacy Cleaner)
// -------------------------------------------------------------
function ExifSanitizer() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cleanedUrl, setCleanedUrl] = useState('');
  const [isCleaning, setIsCleaning] = useState(false);
  const canvasRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    setImageFile(file);
    setCleanedUrl('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const sanitizeImage = () => {
    if (!previewUrl) return;
    setIsCleaning(true);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      // Drawing the image to a canvas naturally strips all EXIF metadata 
      // because it only extracts the raw pixel data.
      ctx.drawImage(img, 0, 0);

      // Export as full quality JPEG
      const newUrl = canvas.toDataURL('image/jpeg', 1.0);
      
      setTimeout(() => {
        setCleanedUrl(newUrl);
        setIsCleaning(false);
      }, 800); // Artificial delay for cyber effect
    };
    img.src = previewUrl;
  };

  const downloadCleanImage = () => {
    if (!cleanedUrl) return;
    const a = document.createElement('a');
    a.href = cleanedUrl;
    a.download = `sanitized_${imageFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Photo Privacy Cleaner</h3>
      <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '20px' }}>
        Photos contain hidden EXIF data (GPS coordinates, camera model, exact timestamps). Upload an image to strip all tracking data before sharing.
      </p>

      {/* Hidden Canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      {!imageFile ? (
        <div
          onClick={() => document.getElementById('exif-upload').click()}
          style={{
            border: '2px dashed rgba(99, 102, 241, 0.3)',
            borderRadius: '16px',
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(99, 102, 241, 0.02)',
            transition: 'all 0.3s'
          }}
          className="interactive"
        >
          <input type="file" id="exif-upload" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          <CameraOff size={48} style={{ color: '#6366f1', marginBottom: '16px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>Select Photo to Sanitize</h3>
          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>JPEG, PNG, WEBP supported.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Original Preview */}
            <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: '#000', position: 'relative', height: '200px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '8px', background: 'rgba(0,0,0,0.7)', fontSize: '0.7rem', color: '#f43f5e', fontWeight: 700, zIndex: 10 }}>
                ORIGINAL (CONTAINS METADATA)
              </div>
              <img src={previewUrl} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.6 }} />
            </div>

            {/* Clean Preview */}
            <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: '#000', position: 'relative', height: '200px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '8px', background: 'rgba(0,0,0,0.7)', fontSize: '0.7rem', color: cleanedUrl ? '#10b981' : '#6b7280', fontWeight: 700, zIndex: 10 }}>
                {cleanedUrl ? 'SANITIZED (SAFE TO SHARE)' : 'AWAITING SANITIZATION'}
              </div>
              {cleanedUrl ? (
                <img src={cleanedUrl} alt="Cleaned" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#374151' }}>
                  <ImageIcon size={48} />
                </div>
              )}
            </div>
          </div>

          {!cleanedUrl ? (
            <button
              onClick={sanitizeImage}
              disabled={isCleaning}
              className="btn-neon haptic-tap"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--neon-indigo), #4f46e5)',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                opacity: isCleaning ? 0.7 : 1
              }}
            >
              <RefreshCw size={18} className={isCleaning ? 'animate-spin' : ''} />
              {isCleaning ? 'Stripping EXIF Traces...' : 'Strip GPS & Metadata Traces'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={downloadCleanImage}
                className="btn-neon haptic-tap"
                style={{
                  flex: 2,
                  background: 'linear-gradient(135deg, var(--neon-emerald), #059669)',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Download size={18} /> Download Safe Image
              </button>
              <button
                onClick={() => { setImageFile(null); setPreviewUrl(''); setCleanedUrl(''); }}
                className="btn-secondary haptic-tap"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 3. Steganography Engine (Secret Message Hider)
// -------------------------------------------------------------
function SteganographyTool() {
  const [mode, setMode] = useState('hide'); // 'hide' or 'reveal'
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState('');
  const [revealedMessage, setRevealedMessage] = useState('');
  const canvasRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setResultImage('');
    setRevealedMessage('');
    
    const reader = new FileReader();
    reader.onload = (event) => setPreviewUrl(event.target.result);
    reader.readAsDataURL(file);
  };

  // Simple XOR encryption for the string before hiding
  const xorEncryptDecrypt = (text, key) => {
    if (!key) return text;
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  };

  const hideMessage = () => {
    if (!previewUrl || !message) return;
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Encrypt and convert message to binary string (append termination marker)
      const encryptedMsg = xorEncryptDecrypt(message, password) + ';;[END];;';
      
      let binaryMsg = '';
      for (let i = 0; i < encryptedMsg.length; i++) {
        let bin = encryptedMsg.charCodeAt(i).toString(2);
        binaryMsg += '00000000'.slice(bin.length) + bin; // pad to 8 bits
      }

      if (binaryMsg.length > data.length / 4 * 3) {
        alert('Message is too long for this image!');
        setIsProcessing(false);
        return;
      }

      // Encode into LSB of RGB channels (ignore Alpha)
      let dataIdx = 0;
      for (let i = 0; i < binaryMsg.length; i++) {
        if ((dataIdx + 1) % 4 === 0) dataIdx++; // skip alpha channel
        
        const bit = parseInt(binaryMsg[i]);
        if (bit === 1) {
          data[dataIdx] = data[dataIdx] | 1; // set LSB to 1
        } else {
          data[dataIdx] = data[dataIdx] & ~1; // set LSB to 0
        }
        dataIdx++;
      }

      ctx.putImageData(imgData, 0, 0);
      // MUST be PNG to preserve lossless LSB
      const newUrl = canvas.toDataURL('image/png');
      
      setTimeout(() => {
        setResultImage(newUrl);
        setIsProcessing(false);
      }, 600);
    };
    img.src = previewUrl;
  };

  const revealMessage = () => {
    if (!previewUrl) return;
    setIsProcessing(true);
    setRevealedMessage('');

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      let binaryMsg = '';
      let extractedText = '';
      let dataIdx = 0;
      
      // Read bits until termination string ';;[END];;' is found
      while (dataIdx < data.length) {
        if ((dataIdx + 1) % 4 === 0) dataIdx++; // skip alpha
        
        binaryMsg += (data[dataIdx] & 1).toString();
        dataIdx++;

        if (binaryMsg.length === 8) {
          const charCode = parseInt(binaryMsg, 2);
          extractedText += String.fromCharCode(charCode);
          binaryMsg = '';

          if (extractedText.endsWith(';;[END];;')) {
            extractedText = extractedText.slice(0, -9); // remove marker
            break;
          }
        }
      }

      setTimeout(() => {
        try {
          const decrypted = xorEncryptDecrypt(extractedText, password);
          setRevealedMessage(decrypted || 'No hidden message found or incorrect password.');
        } catch (e) {
          setRevealedMessage('Failed to decrypt. Incorrect password or image corrupted.');
        }
        setIsProcessing(false);
      }, 600);
    };
    img.src = previewUrl;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingRight: '10px' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Secret Message Hider</h3>
      <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '20px' }}>
        Uses Steganography to invisibly encode text messages into the pixel data of an image.
      </p>

      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => { setMode('hide'); setImageFile(null); setPreviewUrl(''); setResultImage(''); }}
          className={`haptic-tap ${mode === 'hide' ? 'btn-neon' : 'btn-secondary'}`}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          Hide Message
        </button>
        <button
          onClick={() => { setMode('reveal'); setImageFile(null); setPreviewUrl(''); setRevealedMessage(''); }}
          className={`haptic-tap ${mode === 'reveal' ? 'btn-neon' : 'btn-secondary'}`}
          style={{ flex: 1, justifyContent: 'center', background: mode === 'reveal' ? 'linear-gradient(135deg, var(--neon-emerald), #059669)' : '' }}
        >
          Reveal Message
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
        {/* Upload Area */}
        {!imageFile ? (
          <div
            onClick={() => document.getElementById('stego-upload').click()}
            style={{
              border: '2px dashed rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(16, 185, 129, 0.02)',
              transition: 'all 0.3s'
            }}
            className="interactive"
          >
            <input type="file" id="stego-upload" accept="image/png, image/jpeg" onChange={handleImageUpload} style={{ display: 'none' }} />
            <ImageIcon size={48} style={{ color: '#10b981', marginBottom: '16px', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>Select Carrier Photo</h3>
            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Must be PNG or JPEG.</p>
          </div>
        ) : (
          <div style={{ position: 'relative', height: '180px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <img src={previewUrl} alt="Carrier" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
            <button
              onClick={() => { setImageFile(null); setPreviewUrl(''); setResultImage(''); setRevealedMessage(''); }}
              style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', border: '1px solid #333', color: '#fff', borderRadius: '8px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Change Image
            </button>
          </div>
        )}

        {/* Hide Mode Interface */}
        {mode === 'hide' && imageFile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type the secret message you want to hide..."
              className="glass-input"
              style={{ minHeight: '100px', resize: 'vertical' }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Encryption Password (Optional)"
              className="glass-input"
            />
            
            {!resultImage ? (
              <button
                onClick={hideMessage}
                disabled={isProcessing || !message}
                className="btn-cyber-primary haptic-tap"
                style={{ justifyContent: 'center' }}
              >
                {isProcessing ? 'Encoding LSB Matrix...' : 'Encode & Hide Message'}
              </button>
            ) : (
              <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', textAlign: 'center' }}>
                <ShieldCheck size={32} color="#10b981" style={{ marginBottom: '8px' }} />
                <h4 style={{ color: '#10b981', marginBottom: '12px' }}>Message Successfully Hidden!</h4>
                <a
                  href={resultImage}
                  download={`secret_${imageFile.name.split('.')[0]}.png`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#10b981', color: '#000', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}
                >
                  <Download size={18} /> Download Encoded PNG
                </a>
                <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '12px' }}>Note: Sending this image via WhatsApp or iMessage may compress it and destroy the hidden data. Share via Email or a File link.</p>
              </div>
            )}
          </div>
        )}

        {/* Reveal Mode Interface */}
        {mode === 'reveal' && imageFile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Decryption Password (if used)"
              className="glass-input"
            />
            
            <button
              onClick={revealMessage}
              disabled={isProcessing}
              className="btn-neon haptic-tap"
              style={{ background: 'linear-gradient(135deg, var(--neon-emerald), #059669)', justifyContent: 'center' }}
            >
              {isProcessing ? 'Scanning Pixel Data...' : 'Extract Hidden Message'}
            </button>

            {revealedMessage && (
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Extracted Payload:</span>
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--neon-emerald)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {revealedMessage}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. Audit Log Viewer
// -------------------------------------------------------------
function AuditLogViewer() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const fetchedLogs = await getLogs();
        setLogs(fetchedLogs);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLogs();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>App Security History</h3>
      <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '20px' }}>Review all underlying application events and database interactions. Real-time updates active.</p>
      
      <div className="terminal-box" style={{ flex: 1, minHeight: '300px', padding: '16px', overflowY: 'auto' }}>
        <div className="log-entry" style={{ color: 'var(--neon-cyan)', marginBottom: '16px' }}>[INIT] Fetching system logs...</div>
        
        {logs.length === 0 && (
          <div className="log-entry" style={{ color: '#6b7280' }}>No local events recorded in the database yet.</div>
        )}

        {logs.map((log, index) => {
          let logColor = '#9ca3af'; // default info
          if (log.type === 'error' || log.type === 'warning') logColor = 'var(--neon-rose)';
          if (log.type === 'success') logColor = 'var(--neon-emerald)';

          return (
            <div key={index} className="log-entry" style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: logColor, fontWeight: 700 }}>[{log.type.toUpperCase()}] {log.message}</span>
                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{log.timestamp}</span>
              </div>
              {log.details && (
                <div style={{ color: '#9ca3af', fontSize: '0.8rem', paddingLeft: '10px', borderLeft: `2px solid ${logColor}` }}>
                  {log.details}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 5. Ghost Email Relay
// -------------------------------------------------------------
function GhostEmailTool() {
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [expandedMsg, setExpandedMsg] = useState(null);
  const [messageBodies, setMessageBodies] = useState({});
  const [error, setError] = useState(null);

  const generateEmail = async () => {
    setIsGenerating(true);
    setError(null);
    setMessages([]);
    setExpandedMsg(null);
    setMessageBodies({});
    
    try {
      // 1. Fetch available domains
      const domainRes = await fetch('https://api.mail.tm/domains');
      if (!domainRes.ok) throw new Error('Failed to fetch mail domains');
      const domainsData = await domainRes.json();
      const activeDomains = domainsData['hydra:member'] || [];
      if (activeDomains.length === 0) throw new Error('No active mail domains available');
      
      // Select the first active domain
      const domain = activeDomains[0].domain;
      
      // 2. Generate a random username and password
      const randomId = Math.floor(100000 + Math.random() * 900000);
      const generatedEmail = `ghost-${randomId}@${domain}`;
      const generatedPassword = `pass-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // 3. Create the account
      const accountRes = await fetch('https://api.mail.tm/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: generatedEmail,
          password: generatedPassword
        })
      });
      if (!accountRes.ok) throw new Error('Failed to register email account on relay');
      
      // 4. Retrieve the token
      const tokenRes = await fetch('https://api.mail.tm/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: generatedEmail,
          password: generatedPassword
        })
      });
      if (!tokenRes.ok) throw new Error('Failed to authenticate token with relay');
      const tokenData = await tokenRes.json();
      
      setEmailAddress(generatedEmail);
      setPassword(generatedPassword);
      setToken(tokenData.token);
      setCopied(false);
      
      // Add a friendly welcome message in state locally
      setMessages([
        {
          id: 'welcome',
          from: { address: 'admin@aegis-relay.net', name: 'Aegis Admin' },
          subject: 'Connection Established: Relay Node Active',
          createdAt: new Date().toISOString(),
          intro: 'Your ghost email address is successfully registered on the shadow network.',
          text: 'Your ghost email address is successfully registered on the shadow network.\n\nAny emails sent to this address will be intercepted and displayed here. This inbox will self-destruct upon window closure. Do not use for sensitive 2FA recovery.'
        }
      ]);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate ghost email address.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateEmail();
  }, []);

  const copyToClipboard = () => {
    if (!emailAddress) return;
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkInbox = async () => {
    if (!token) return;
    setIsRefreshing(true);
    setError(null);
    
    try {
      const messagesRes = await fetch('https://api.mail.tm/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!messagesRes.ok) throw new Error('Failed to sync inbox messages');
      const messagesData = await messagesRes.json();
      const fetchedMessages = messagesData['hydra:member'] || [];
      
      if (fetchedMessages.length > 0) {
        setMessages(fetchedMessages);
      } else {
        // Keep welcome message if inbox is empty
        setMessages(prev => prev.filter(m => m.id === 'welcome'));
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to sync with relay.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Poll for messages periodically
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      checkInbox();
    }, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const handleToggleMessage = async (msgId) => {
    if (expandedMsg === msgId) {
      setExpandedMsg(null);
      return;
    }
    
    setExpandedMsg(msgId);
    
    if (msgId === 'welcome') return;
    if (messageBodies[msgId]) return; // Already loaded
    
    try {
      const msgRes = await fetch(`https://api.mail.tm/messages/${msgId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!msgRes.ok) throw new Error('Failed to retrieve email content');
      const msgData = await msgRes.json();
      
      if (msgData) {
        setMessageBodies(prev => ({
          ...prev,
          [msgId]: msgData.text || msgData.html || 'No content.'
        }));
      }
    } catch (err) {
      console.error(err);
      setMessageBodies(prev => ({
        ...prev,
        [msgId]: `Error loading content: ${err.message}`
      }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Ghost Email Relay</h3>
      <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '20px' }}>
        Generate an anonymous, self-destructing temporary email address. Keep this window open to receive messages.
      </p>

      <div style={{
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Output Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '1.2rem',
            color: isGenerating ? '#9ca3af' : error ? 'var(--neon-rose)' : '#eab308',
            wordBreak: 'break-all',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {isGenerating ? (
              <>
                <RefreshCw size={20} className="animate-spin" style={{ color: '#eab308' }} />
                <span style={{ fontSize: '1rem', color: '#9ca3af' }}>Creating secure relay channel...</span>
              </>
            ) : error ? (
              <span style={{ fontSize: '0.95rem' }}>Error: {error}</span>
            ) : (
              emailAddress || 'No Address Generated'
            )}
          </div>
          <button
            onClick={copyToClipboard}
            disabled={!emailAddress || isGenerating}
            className="haptic-tap"
            style={{
              background: copied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.1)',
              border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
              color: copied ? '#10b981' : '#eab308',
              borderRadius: '8px',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: emailAddress && !isGenerating ? 'pointer' : 'not-allowed',
              opacity: emailAddress && !isGenerating ? 1 : 0.5,
              transition: 'all 0.2s'
            }}
          >
            {copied ? <ShieldCheck size={24} /> : <Copy size={24} />}
          </button>
        </div>

        <button
          onClick={generateEmail}
          disabled={isGenerating}
          className="btn-secondary haptic-tap"
          style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '0.8rem', opacity: isGenerating ? 0.6 : 1 }}
        >
          <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} style={{ marginRight: '6px' }} /> 
          {isGenerating ? 'Generating...' : 'Generate New Address'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Encrypted Inbox</h4>
        <button
          onClick={checkInbox}
          disabled={isRefreshing || !token}
          className="haptic-tap"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: token ? 'pointer' : 'not-allowed',
            opacity: isRefreshing || !token ? 0.6 : 1
          }}
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> 
          {isRefreshing ? 'Syncing Node...' : 'Check For Messages'}
        </button>
      </div>

      <div className="terminal-box" style={{ flex: 1, minHeight: '150px', padding: '16px', overflowY: 'auto' }}>
        {isRefreshing && messages.length === 0 ? (
          <div style={{ color: '#eab308', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
            <RefreshCw size={32} className="animate-spin" />
            <span>Polling encrypted relay network...</span>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ color: '#6b7280', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Mail size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
            <p>Inbox is currently empty.</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Awaiting incoming transmissions for {emailAddress}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map(msg => {
              const isExpanded = expandedMsg === msg.id;
              const hasBody = msg.id === 'welcome' ? !!msg.text : !!messageBodies[msg.id];
              const bodyContent = msg.id === 'welcome' ? msg.text : messageBodies[msg.id];
              const formattedTime = new Date(msg.createdAt).toLocaleTimeString();
              const formattedDate = new Date(msg.createdAt).toLocaleDateString();

              return (
                <div key={msg.id} style={{ border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.05)', overflow: 'hidden' }}>
                  <div 
                    onClick={() => handleToggleMessage(msg.id)}
                    className="interactive"
                    style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#eab308', fontSize: '0.9rem' }}>
                        {msg.from.name ? `${msg.from.name} <${msg.from.address}>` : msg.from.address}
                      </span>
                      <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{formattedDate} {formattedTime}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '1rem' }}>{msg.subject}</div>
                    {!isExpanded && msg.intro && (
                      <div style={{ color: '#9ca3af', fontSize: '0.8rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {msg.intro}
                      </div>
                    )}
                  </div>
                  
                  {isExpanded && (
                    <div style={{ 
                      padding: '16px', 
                      background: 'rgba(0,0,0,0.4)', 
                      borderTop: '1px solid rgba(234, 179, 8, 0.1)', 
                      color: '#d1d5db', 
                      fontSize: '0.85rem', 
                      whiteSpace: 'pre-wrap', 
                      lineHeight: 1.5,
                      borderLeft: '3px solid #eab308'
                    }}>
                      {!hasBody ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#eab308' }}>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Decrypting payload from node...</span>
                        </div>
                      ) : (
                        bodyContent
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Shield, 
  Share2, 
  Trash2, 
  Terminal, 
  ArrowRight, 
  Lock, 
  Settings, 
  Activity, 
  Wifi, 
  Globe, 
  HardDrive,
  User,
  KeyRound,
  ExternalLink,
  Mail,
  Eye,
  EyeOff,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

import { setConfig, addLog, getConfig } from '../utils/db';
import HelpModal from './HelpModal';

export default function LandingPage({ onLaunch, onAuthorizedLaunch, activeAuthMethod, onSecurityChange }) {
  const [activeTab, setActiveTab] = useState('sharing'); // 'sharing' | 'shields' | 'scanner' | 'vault'
  const [telemetryLogs, setTelemetryLogs] = useState([
    'SYSTEM: Initializing Aegis Recovery Sub-routine...',
    'NET: PeerJS listener configured on standard ports',
    'SECURE: Storage encryption bound to local master keys',
    'READY: Node listening for secure handshakes'
  ]);
  
  // Registration States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(true); // Default true until checked
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [dbEmail, setDbEmail] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('register'); // 'login' | 'register'
  
  // Verification States
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Check if already registered
  useEffect(() => {
    async function checkRegistration() {
      try {
        const storedEmail = await getConfig('profile_email');
        const storedPassword = await getConfig('profile_password');
        if (!storedEmail || !storedPassword) {
          setIsRegistered(false); // They need to register
          setAuthMode('register');
        } else {
          setDbEmail(storedEmail);
          setDbPassword(storedPassword);
          setAuthMode('login');
        }
      } catch (err) {
        console.error(err);
      }
    }
    checkRegistration();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!email || !password) {
      setRegError('Please provide both email and password.');
      return;
    }
    
    setIsRegistering(true);
    try {
      await setConfig('profile_email', email);
      await setConfig('profile_password', password);
      await setConfig('auth_method', 'password');
      await setConfig('pin_lock_enabled', false);
      await addLog('info', 'Secure Identity Created', 'Operator registered email and password credentials.');
      
      setDbEmail(email);
      setDbPassword(password);
      setIsRegistered(true);
      
      if (onSecurityChange) {
        onSecurityChange(true, password, 'password');
      }
      
      // Reset form and show success
      setEmail('');
      setPassword('');
      setShowSuccessPopup(true);
      
      // Switch to login tab automatically
      setAuthMode('login');
    } catch (err) {
      setRegError('Failed to save secure credentials.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    if (!email || !password) {
      setLoginError('Please enter both email and password.');
      return;
    }
    if (email.trim().toLowerCase() === dbEmail.trim().toLowerCase() && password === dbPassword) {
      if (onAuthorizedLaunch) {
        onAuthorizedLaunch(password);
      } else {
        onLaunch();
      }
    } else {
      setLoginError('Authentication failed. Invalid Email or Password.');
    }
  };
  
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: null, y: null });
  const [transferPercent, setTransferPercent] = useState(42);
  const [nodeCount, setNodeCount] = useState(24);
  const [activeTraffic, setActiveTraffic] = useState('2.4 MB/s');

  // Simulated live file transfer loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTransferPercent(prev => {
        if (prev >= 100) {
          // Add a log entry when transfer completes
          setTelemetryLogs(logs => [
            `SHARING: Stream block 0x${Math.floor(Math.random() * 9000 + 1000).toString(16).toUpperCase()} transfer complete. Hash verified.`,
            ...logs.slice(0, 10)
          ]);
          return 0;
        }
        return prev + Math.floor(Math.random() * 6 + 2);
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // Telemetry logs simulation loop
  useEffect(() => {
    const events = [
      'SHARING: Syncing local nodes...',
      'VAULT: Access attempts gated via active authorization hash',
      'SHREDDER: Diagnostic completed. Storage integrity 100%',
      'SYSTEM: Telemetry ping successfully routed through secure socket',
      'NET: Dynamic tunnel recognized at *.lhr.life',
      'SECURE: Key generation cycle triggered successfully',
      'SYSTEM: Core memory footprint optimized. Safe operational status',
      'SHARING: Awaiting secure P2P stream handshakes'
    ];

    const interval = setInterval(() => {
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      const timestamp = new Date().toLocaleTimeString();
      setTelemetryLogs(logs => [
        `[${timestamp}] ${randomEvent}`,
        ...logs.slice(0, 12)
      ]);
      
      // Randomize traffic indicator
      setActiveTraffic(`${(Math.random() * 4 + 0.8).toFixed(1)} MB/s`);
      setNodeCount(prev => Math.max(12, Math.min(48, prev + Math.floor(Math.random() * 5) - 2)));
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  // Interactive Live Node Grid Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    
    // Set sizing
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create random nodes
    const nodes = [];
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    
    for (let i = 0; i < 28; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2.5 + 1.5,
        pulse: Math.random() * Math.PI
      });
    }

    const draw = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, w, h);
      
      const mouse = mouseRef.current;

      // Draw background grid lines
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw paths between close nodes
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.15;
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw active connections to cursor coordinates
      if (mouse.x !== null && mouse.y !== null) {
        ctx.lineWidth = 0.8;
        // Pulse ring around cursor
        const pulseRadius = 15 + Math.sin(Date.now() / 150) * 3;
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        nodes.forEach(node => {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const alpha = (1 - dist / 160) * 0.35;
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        });
      }

      // Draw and update nodes
      nodes.forEach(node => {
        // Move
        node.x += node.vx;
        node.y += node.vy;
        
        // Bounce
        if (node.x < 0 || node.x > w) node.vx *= -1;
        if (node.y < 0 || node.y > h) node.vy *= -1;
        
        // Clamp bounds to prevent drift
        node.x = Math.max(0, Math.min(w, node.x));
        node.y = Math.max(0, Math.min(h, node.y));

        node.pulse += 0.02;
        const radiusScale = node.radius + Math.sin(node.pulse) * 0.8;

        // Draw node
        ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#06b6d4';
        ctx.beginPath();
        ctx.arc(node.x, node.y, radiusScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationId = requestAnimationFrame(draw);
    };
    draw();

    // Mouse movement listeners
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div className="landing-container">
      {/* Background aesthetics */}
      <div className="landing-hologram-overlay"></div>
      <div className="landing-glow-orb" style={{ width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(0,0,0,0) 70%)', top: '10%', left: '5%' }}></div>
      <div className="landing-glow-orb" style={{ width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(0,0,0,0) 70%)', bottom: '15%', right: '5%' }}></div>

      {/* Top Right Help Button */}
      <button
        onClick={() => setIsHelpModalOpen(true)}
        className="haptic-tap"
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          cursor: 'pointer',
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'all 0.2s ease'
        }}
        title="Help & Support"
      >
        <HelpCircle size={22} />
      </button>

      {/* Hero Section */}
      <div className="landing-hero">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          color: 'var(--neon-cyan)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '16px',
          background: 'rgba(6, 182, 212, 0.06)',
          border: '1px solid rgba(6, 182, 212, 0.15)',
          padding: '6px 14px',
          borderRadius: '20px'
        }}>
          <Wifi size={14} className="telemetry-pulse" /> Live Sharing Portal Active
        </div>
        
        <h1 className="landing-title">
          AEGIS SHIELD <span style={{ color: '#06b6d4', fontWeight: 300 }}>PORTAL</span>
        </h1>
        
        <p className="landing-subtitle">
          An ultra-secure, premium peer-to-peer sharing hub and recovery terminal. Built with military-grade dynamic cryptographic locks and frictionless local storage carving.
        </p>

        {/* Unified Authentication Box */}
        <div style={{
          width: '100%',
          maxWidth: '380px',
          background: 'rgba(8, 7, 16, 0.4)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginTop: '16px',
          zIndex: 10,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
        }}>
          
          {/* Auth Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '4px', marginBottom: '8px' }}>
            <button 
              onClick={() => { setAuthMode('login'); setLoginError(''); setRegError(''); }}
              className="haptic-tap"
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: authMode === 'login' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: authMode === 'login' ? '#ffffff' : '#9ca3af',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Login
            </button>
            <button 
              onClick={() => { setAuthMode('register'); setLoginError(''); setRegError(''); }}
              className="haptic-tap"
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: authMode === 'register' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                color: authMode === 'register' ? '#ffffff' : '#9ca3af',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Register
            </button>
          </div>

          {authMode === 'register' ? (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>Create Account</h3>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Set up local login credentials.</p>
              </div>

              {regError && (
                <div style={{ color: '#f43f5e', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(244, 63, 94, 0.1)', padding: '8px', borderRadius: '8px' }}>
                  {regError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Email Address</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', color: '#6b7280' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="glass-input"
                    style={{ paddingLeft: '38px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Vault Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', color: '#6b7280' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="glass-input"
                    style={{ paddingLeft: '38px', paddingRight: '40px', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="btn-cyber-primary haptic-tap"
                style={{ width: '100%', marginTop: '8px', display: 'flex', justifyContent: 'center', background: 'rgba(6, 182, 212, 0.1)', borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)' }}
              >
                <span>{isRegistering ? 'Configuring...' : 'Configure Secure Login'}</span>
                {!isRegistering && <CheckCircle size={18} />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--neon-emerald)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                  <CheckCircle size={16} /> Device Authorized
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>Login</h3>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Authenticate to decrypt your vault.</p>
              </div>

              {loginError && (
                <div style={{ color: '#f43f5e', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(244, 63, 94, 0.1)', padding: '8px', borderRadius: '8px' }}>
                  {loginError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Email Address</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', color: '#6b7280' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="glass-input"
                    style={{ paddingLeft: '38px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Vault Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', color: '#6b7280' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="glass-input"
                    style={{ paddingLeft: '38px', paddingRight: '40px', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-cyber-primary haptic-tap"
                style={{ width: '100%', marginTop: '8px', display: 'flex', justifyContent: 'center' }}
              >
                <span>Decrypt & Launch</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Feature Layout Grid */}
      <div className="landing-grid">
        
        {/* Left Column: Feature Interactive Showcase */}
        <div className="landing-showcase-panel">
          <div className="telemetry-card">
            <div className="telemetry-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={18} style={{ color: '#6366f1' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Platform Capabilities Showcase
                </span>
              </div>
              <div className="telemetry-indicator">
                <span className="telemetry-pulse"></span>
                Interactive Telemetry
              </div>
            </div>

            {/* Segmented Feature Tabs */}
            <div className="feature-tab-list">
              <button 
                onClick={() => setActiveTab('sharing')}
                className={`feature-tab-item ${activeTab === 'sharing' ? 'active' : ''} haptic-tap`}
              >
                <Share2 size={16} />
                <span>P2P Transfer</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('shields')}
                className={`feature-tab-item ${activeTab === 'shields' ? 'active' : ''} haptic-tap`}
              >
                <Lock size={16} />
                <span>Multi-Auth</span>
              </button>

              <button 
                onClick={() => setActiveTab('scanner')}
                className={`feature-tab-item ${activeTab === 'scanner' ? 'active' : ''} haptic-tap`}
              >
                <Activity size={16} />
                <span>Carving</span>
              </button>

              <button 
                onClick={() => setActiveTab('vault')}
                className={`feature-tab-item ${activeTab === 'vault' ? 'active' : ''} haptic-tap`}
              >
                <KeyRound size={16} />
                <span>Encryption</span>
              </button>
            </div>

            {/* Content for Tabs */}
            <div style={{ marginTop: '24px', minHeight: '160px' }}>
              {activeTab === 'sharing' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Share2 size={16} style={{ color: 'var(--neon-cyan)' }} />
                    Secure P2P File Streams ("Sharing")
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                    Connect and transfer files seamlessly across members. Features direct peer bridging with synchronized stream abort triggers, letting you cancel mid-way with zero data leaks.
                  </p>
                  
                  {/* Simulated sharing progress bar */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                      <span>quantum_core_dump.bin</span>
                      <span style={{ color: 'var(--neon-cyan)' }}>{transferPercent}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${transferPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--neon-indigo), var(--neon-cyan))', boxShadow: '0 0 10px var(--neon-cyan)', transition: 'width 0.4s ease' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', color: 'var(--text-muted)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                      <span>Speed: {activeTraffic}</span>
                      <span>Nodes: {nodeCount} peers online</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'shields' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} style={{ color: 'var(--neon-purple)' }} />
                    Tri-Tier Startup Shields
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                    Lock down your sharing vault using three optional security startup screens. Tailor your defenses to secure sensitive local data.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(6, 182, 212, 0.1)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tier 01</div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--neon-cyan)', marginTop: '2px' }}>Frictionless</div>
                    </div>
                    <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(168, 85, 247, 0.1)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tier 02</div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--neon-purple)', marginTop: '2px' }}>4-Digit PIN</div>
                    </div>
                    <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(99, 102, 241, 0.1)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tier 03</div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--neon-indigo)', marginTop: '2px' }}>Mail & Password</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={12} style={{ color: activeAuthMethod !== 'frictionless' ? 'var(--neon-emerald)' : 'var(--neon-rose)' }} />
                    Active Shield Protocol: <span style={{ color: '#ffffff', textTransform: 'uppercase' }}>{activeAuthMethod || 'Frictionless'}</span>
                  </div>
                </div>
              )}

              {activeTab === 'scanner' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} style={{ color: 'var(--neon-emerald)' }} />
                    Decentralized Data Carving
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '12px' }}>
                    Diagnose local system directories and recover lost fragments. Features low-level block scanning simulation with dynamic sector tables and diagnostic readouts.
                  </p>
                  <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-emerald)' }}>
                      <HardDrive size={14} />
                      <span>SECTOR DIAGNOSTIC: OPERATIONAL</span>
                    </div>
                    <span style={{ color: '#ffffff', marginLeft: 'auto' }}>READ/WRITE: 99.8%</span>
                  </div>
                </div>
              )}

              {activeTab === 'vault' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <KeyRound size={16} style={{ color: 'var(--neon-amber)' }} />
                    Dynamic Cryptographic Vault
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '12px' }}>
                    Your files are safe. The system dynamically binds vault assets with your unique master keys (PIN, profile password, or root-level credentials) with complete local privacy.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Cipher Algorithm:</span>
                      <span style={{ color: 'var(--neon-amber)' }}>AES-GCM-256 (Local)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Key Bind Mode:</span>
                      <span style={{ color: '#ffffff', textTransform: 'uppercase' }}>{activeAuthMethod || 'frictionless'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>IndexedDB Sandbox:</span>
                      <span style={{ color: 'var(--neon-emerald)' }}>ENCRYPTED</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Mesh Map & Terminal Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2vh', flex: 1 }}>
          
          {/* Live Node Map Area */}
          <div className="telemetry-card" style={{ flex: 1.2, minHeight: '180px', padding: '0', position: 'relative' }}>
            <canvas ref={canvasRef} className="landing-matrix-canvas" />
            
            <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, background: 'rgba(8,7,16,0.7)', border: '1px solid rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', pointerEvents: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                <Globe size={12} className="telemetry-pulse" style={{ color: 'var(--neon-cyan)' }} />
                <span>P2P MESH INTERACTIVE MAP</span>
              </div>
            </div>
            
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 10, background: 'rgba(8,7,16,0.7)', border: '1px solid rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', pointerEvents: 'none', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Move cursor over map to bridge nodes
            </div>
          </div>

          {/* Telemetry Terminal */}
          <div className="telemetry-card" style={{ flex: 1, minHeight: '150px' }}>
            <div className="telemetry-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={16} style={{ color: 'var(--neon-purple)' }} />
                <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live System Diagnostics
                </span>
              </div>
            </div>
            
            <div className="telemetry-terminal">
              {telemetryLogs.map((log, index) => {
                let lineClass = '';
                if (log.includes('SYSTEM')) lineClass = 'terminal-prompt';
                else if (log.includes('NET')) lineClass = 'terminal-success';
                else if (log.includes('SECURE')) lineClass = 'terminal-warning';
                else if (log.includes('SHARING')) lineClass = 'terminal-success';
                
                return (
                  <div key={index} className="terminal-line" style={{ animation: 'fadeIn 0.2s ease' }}>
                    <span className="terminal-prompt">&gt;</span>
                    <span className={lineClass}>{log}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Footer credits and brand signature */}
      <footer className="landing-footer" style={{ marginTop: '2vh' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '1vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <Shield size={12} style={{ color: 'var(--neon-emerald)' }} />
            <span>AES-GCM Encryption</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <Share2 size={12} style={{ color: 'var(--neon-cyan)' }} />
            <span>Direct P2P Bridge</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <Trash2 size={12} style={{ color: 'var(--neon-rose)' }} />
            <span>Secure Storage Shredding</span>
          </div>
        </div>

        <div className="landing-footer-credits" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span>Aegis Recovery Suite &copy; 2026</span>
          <span>Developed <span className="landing-by-badge">BY ABBI REDDY</span></span>
        </div>
      </footer>

      {/* Success Popup Modal */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--neon-emerald)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 0 50px rgba(16, 185, 129, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              marginBottom: '10px'
            }}>
              <CheckCircle size={40} color="var(--neon-emerald)" />
            </div>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Account Created!</h2>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
              Your secure identity has been verified and your cryptographic keys have been generated.
            </p>
            
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="btn-cyber-primary haptic-tap"
              style={{ marginTop: '16px', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--neon-emerald)', color: 'var(--neon-emerald)', width: '100%', justifyContent: 'center' }}
            >
              Please Login to Continue
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
}

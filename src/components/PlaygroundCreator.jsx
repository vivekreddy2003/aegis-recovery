import React, { useState } from 'react';
import { Box, Download, Info, CheckCircle, HelpCircle } from 'lucide-react';
import { addLog } from '../utils/db';

export default function PlaygroundCreator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFile, setGeneratedFile] = useState(null);

  // Generates a mock binary file containing specific file header signatures and footers
  const generateForensicImage = async () => {
    setIsGenerating(true);
    
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // 1. Create a 512KB virtual sector disk dump (ArrayBuffer)
      const diskSize = 512 * 1024; 
      const buffer = new ArrayBuffer(diskSize);
      const view = new DataView(buffer);
      
      // 2. Fill the buffer with garbage/noise data (representing random sector fragmentation)
      for (let i = 0; i < diskSize; i++) {
        view.setUint8(i, Math.floor(Math.random() * 256));
      }

      // 3. Embed a hidden PNG image at sector offset 0x4000 (Sector 32)
      // Standard 1x1 Transparent PNG byte array (highly compact and valid PNG!)
      const pngBytes = [
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG Header
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR header
        0x00, 0x00, 0x00, 0x0A, 0x00, 0x00, 0x00, 0x0A, // 10x10 width/height
        0x08, 0x02, 0x00, 0x00, 0x00, 0x02, 0x50, 0x58, // bitdepth etc
        0xEA, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT header
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, // IDAT data
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND footer
        0x42, 0x60, 0x82
      ];
      
      const pngOffset = 32 * 512; // Sector 32 (16,384 bytes)
      pngBytes.forEach((byte, idx) => {
        view.setUint8(pngOffset + idx, byte);
      });

      // 4. Embed a hidden JPEG image at sector offset 0xC000 (Sector 96)
      // Standard minimal valid 1x1 red pixel JPEG data
      const jpgBytes = [
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60,
        0x00, 0x60, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
        0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0xC5, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
        0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
        0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
        0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
        0x00, 0x37, 0xFF, 0xD9 // JPEG Footer
      ];
      
      const jpgOffset = 96 * 512; // Sector 96 (49,152 bytes)
      jpgBytes.forEach((byte, idx) => {
        view.setUint8(jpgOffset + idx, byte);
      });

      // 5. Embed a hidden PDF at sector offset 0x20000 (Sector 256)
      const pdfString = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 50 >>\nstream\nBT /F1 12 Tf 72 712 Td (AEGIS FORENSIC SUITE RECOVERY MATCH) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000192 00000 n\ntrailer\n<< /Size 5 >>\nstartxref\n310\n%%EOF`;
      const pdfOffset = 256 * 512; // Sector 256 (131,072 bytes)
      for (let i = 0; i < pdfString.length; i++) {
        view.setUint8(pdfOffset + i, pdfString.charCodeAt(i));
      }

      // Convert to blob and trigger download link
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      setGeneratedFile({
        url,
        name: 'aegis_forensic_disk.bin',
        size: '512 KB'
      });

      await addLog(
        'info',
        'Forensic Playground Disk Generated',
        'Successfully injected 1x PNG, 1x JPEG, and 1x PDF signatures into a 512KB virtual raw sector image file.'
      );
    } catch (err) {
      console.error('Failed to generate playground image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Overview Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '12px',
            background: 'rgba(168, 85, 247, 0.1)',
            color: '#a855f7'
          }}>
            <Box size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Forensic Playground</h2>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Create virtual deleted disk structures to test byte carving.</p>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#9ca3af', lineHeight: 1.5, marginBottom: '20px' }}>
          Because mobile sandboxing restricts raw hardware access to security modules, Aegis allows you to test actual **file signature carving** via an interactive playground.
        </p>

        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '14px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <Info size={16} color="#a855f7" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', display: 'block' }}>
                How to use the Carving Sandbox:
              </span>
              <ol style={{ fontSize: '0.8rem', color: '#9ca3af', paddingLeft: '16px', marginTop: '6px', lineHeight: 1.4 }}>
                <li>Tap <strong>"Generate Forensic Image"</strong> below.</li>
                <li>Download the generated <code>aegis_forensic_disk.bin</code> file to your device.</li>
                <li>Switch to the <strong>Scanner</strong> tab.</li>
                <li>Upload the downloaded file and run a <strong>Deep Scan</strong>.</li>
                <li>Watch the block scanner locate and recover the hidden JPEGs, PNGs, and PDFs in real-time!</li>
              </ol>
            </div>
          </div>
        </div>

        {!generatedFile ? (
          <button
            onClick={generateForensicImage}
            disabled={isGenerating}
            className="btn-neon"
            style={{ width: '100%' }}
          >
            {isGenerating ? (
              <>
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Injecting Byte Signatures...
              </>
            ) : (
              <>
                <Box size={20} />
                Generate Forensic Image
              </>
            )}
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#10b981" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                  Image Compiled Successfully!
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{generatedFile.size}</span>
            </div>

            <a
              href={generatedFile.url}
              download={generatedFile.name}
              className="btn-neon"
              style={{
                textDecoration: 'none',
                background: 'linear-gradient(135deg, var(--neon-emerald), #059669)',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Download size={20} />
              Download {generatedFile.name}
            </a>

            <button
              onClick={() => setGeneratedFile(null)}
              className="btn-secondary"
              style={{ width: '100%', padding: '10px' }}
            >
              Compile New Image
            </button>
          </div>
        )}
      </div>

      {/* Hex Blueprint Card */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Forensic Sector Map</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sector 0 - 31</span>
              <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Address 0x0000 - 0x3FFF</span>
            </div>
            <span className="badge badge-amber">Random Noise</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sector 32 - 95</span>
              <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Address 0x4000 - 0xBFFF</span>
            </div>
            <span className="badge badge-cyan">PNG Signature</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sector 96 - 255</span>
              <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Address 0xC000 - 0x1FFFF</span>
            </div>
            <span className="badge badge-rose">JPEG Signature</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sector 256 - 512</span>
              <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Address 0x20000 - 0x3FFFF</span>
            </div>
            <span className="badge badge-emerald">PDF Signature</span>
          </div>
          
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
    </div>
  );
}

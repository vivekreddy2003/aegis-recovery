# 🛡️ Aegis Recovery Suite

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://aegis-recovery.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite)](https://vite.dev)
[![Electron](https://img.shields.io/badge/Electron-34.0-47848F?style=for-the-badge&logo=electron)](https://www.electronjs.org)

**Aegis Recovery Suite** is a premium, client-side web and desktop application designed for secure cryptographic storage, peer-to-peer file sharing, data forensics, and privacy sanitization. Operating with a high-fidelity cyberpunk/glassmorphic interface, it offers professional-grade local database encryption, secure file shredding, and metadata scrubbing completely client-side.

---

## 🚀 Key Modules & Capabilities

### 1. 🔍 Forensic Sector Carver (Scanner)
*   **Low-Level Simulation**: Scans local directories to analyze file integrity and simulates recovery of deleted file headers.
*   **Visual Grid**: Uses an interactive block sector matrix to display real-time read/write sector status (Scanned, Active, Carved).

### 2. 🔑 Dynamic Cryptographic Vault
*   **Local AES-GCM-256 Encryption**: Encrypts and sandboxes vault assets inside the browser's IndexedDB database. 
*   **Zero-Knowledge Security**: Your password and security PIN are hashed and verified locally; your keys never leave your machine.
*   **Tri-Tier Startup Shields**: Lock down your repository using either frictionless access, a 4-digit PIN lock, or full email and password authentication gates.

### 3. 📂 Secure P2P Sharing Portal
*   **Direct Peer Bridging**: Uses **PeerJS** to open encrypted, direct webRTC connections to other operators.
*   **Abort Trigger Syncing**: Synchronizes connection aborts, letting either operator immediately destroy the data stream with zero data leakage.

### 4. ☣️ Data Shredder
*   **Secure Erasure**: Overwrites IndexedDB storage cells multiple times to guarantee deleted assets cannot be recovered by standard forensic operations.

### 5. 🛠️ Cyber Utilities Suite
*   **Strong Password Generator**: Generates cryptographically secure random passwords and rates their strength based on entropy bits.
*   **Photo Privacy Cleaner**: Renders images on an off-screen canvas to strip tracking metadata, EXIF details, and GPS coordinates before sharing.
*   **Secret Message Hider**: Uses LSB Steganography to invisibly encode encrypted text payloads into the pixel matrices of carrier PNG/JPG images.
*   **App Security History**: Review a terminal-style scrolling ledger of all backend database events and access logs.

---

## 🛠️ Technology Stack

*   **Frontend Library**: [React 19](https://react.dev) (Functional Components, Hooks)
*   **Build Tool**: [Vite 6](https://vite.dev) (Hot Module Replacement)
*   **Desktop Shell**: [Electron 34](https://www.electronjs.org) (Native window bindings, TitleBar rendering)
*   **Local Storage**: IndexedDB (sandboxed database)
*   **Networking**: PeerJS / WebRTC (Serverless P2P streaming)
*   **Styling**: Premium Custom CSS (Cyberpunk glassmorphic, CSS grid, HSL tailor-colored variables)
*   **Icons**: [Lucide React](https://lucide.dev)

---

## 📦 Installation & Setup

Ensure you have [Node.js](https://nodejs.org) (v18+) installed.

### 1. Clone the Repository
```bash
git clone https://github.com/vivekreddy2003/aegis-recovery.git
cd aegis-recovery
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Locally (Desktop Development Mode)
This launches Vite and opens the Electron desktop window wrapper:
```bash
npm run electron:dev
```

### 4. Run in Browser Only
If you want to run the web application on localhost:3000 without the Electron shell:
```bash
npm run dev
```

### 5. Compile Installer Executables
Builds platform-specific desktop packages (outputted to `/release`):
```bash
npm run electron:build
```

---

## 🌐 Deployment (Vercel)

The web frontend of this project is fully configured for deployment on Vercel. 

### Custom Header Control
A `vercel.json` file is configured in the root directory to set cache-control headers on `index.html`. This ensures that browsers never cache page structures and instantly fetch your latest builds:
```json
{
  "headers": [
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, no-cache, must-revalidate, max-age=0"
        }
      ]
    }
  ]
}
```

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

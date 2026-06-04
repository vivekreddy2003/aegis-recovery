import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we are running in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Aegis Recovery Suite',
    backgroundColor: '#080710',
    frame: false, // Make window frameless
    webPreferences: {
      nodeIntegration: false, // Secure
      contextIsolation: true, // Secure
      preload: path.join(__dirname, 'preload.cjs')
    },
    autoHideMenuBar: true
  });

  // IPC Handlers for custom Title Bar
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow.close();
  });

  if (isDev) {
    // In dev mode, load the Vite dev server URL
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools automatically in dev mode
    mainWindow.webContents.openDevTools();
  } else {
    // In production mode, load the compiled React index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// Ensure the app only runs when Electron is fully initialized
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // macOS behavior: recreate window if dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


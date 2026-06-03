/**
 * Aegis Sandboxed Storage Manager
 * Implements persistent binary and metadata storage via browser IndexedDB,
 * allowing completely local secure configuration and AES-encrypted vault files.
 */

const DB_NAME = 'AegisRecoveryDB';
const DB_VERSION = 1;

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store 1: Config (For PIN hashes and salts)
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'key' });
      }
      
      // Store 2: Encrypted Vault Files
      if (!db.objectStoreNames.contains('vault')) {
        db.createObjectStore('vault', { keyPath: 'id' });
      }
      
      // Store 3: Recovery Logs & Scan Histories
      if (!db.objectStoreNames.contains('logs')) {
        db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB opening error:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Config getters & setters
export async function setConfig(key, value) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('config', 'readwrite');
    const store = transaction.objectStore('config');
    const request = store.put({ key, value });

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function getConfig(key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('config', 'readonly');
    const store = transaction.objectStore('config');
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result ? request.result.value : null);
    request.onerror = () => reject(request.error);
  });
}

// Vault CRUD operations
export async function saveToVault(fileData) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('vault', 'readwrite');
    const store = transaction.objectStore('vault');
    const request = store.put(fileData);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function getVaultFiles() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('vault', 'readonly');
    const store = transaction.objectStore('vault');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFromVault(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('vault', 'readwrite');
    const store = transaction.objectStore('vault');
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Logging CRUD
export async function addLog(type, message, details = '') {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('logs', 'readwrite');
    const store = transaction.objectStore('logs');
    const request = store.add({
      timestamp: new Date().toLocaleString(),
      type,
      message,
      details
    });

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function getLogs() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('logs', 'readonly');
    const store = transaction.objectStore('logs');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result ? request.result.reverse().slice(0, 100) : []);
    request.onerror = () => reject(request.error);
  });
}

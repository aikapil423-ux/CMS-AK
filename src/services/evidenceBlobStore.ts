// src/services/evidenceBlobStore.ts
// Persistent binary blob store backed by IndexedDB and server-side evidence store.
// Solves localStorage quota limits by safely storing full-fidelity base64/blob files
// across page reloads, browser sessions, and route transitions.

const IDB_NAME = "cms_evidence_blob_store_v1";
const IDB_STORE = "evidence_blobs";
const IDB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB is not available"));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn("Error opening IndexedDB evidence blob store:", request.error);
        reject(request.error);
      };
    });
  }

  return dbPromise;
}

export interface StoredBlobRecord {
  key: string;
  dataUrl: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: number | string;
  storedAt: string;
}

// In-memory fallback cache
const memoryBlobCache = new Map<string, string>();

export const evidenceBlobStore = {
  /**
   * Persistently store a dataUrl under one or more keys in IndexedDB and memory
   */
  async put(key: string, dataUrl: string, metadata?: { mimeType?: string; fileName?: string; fileSize?: number | string }): Promise<void> {
    if (!key || !dataUrl) return;

    // Cache in memory immediately
    memoryBlobCache.set(key, dataUrl);
    if (metadata?.fileName) {
      memoryBlobCache.set(metadata.fileName.toLowerCase().trim(), dataUrl);
    }

    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        const store = tx.objectStore(IDB_STORE);

        const record: StoredBlobRecord = {
          key,
          dataUrl,
          mimeType: metadata?.mimeType,
          fileName: metadata?.fileName,
          fileSize: metadata?.fileSize,
          storedAt: new Date().toISOString(),
        };

        store.put(record);

        // Also store by fileName if provided
        if (metadata?.fileName) {
          store.put({
            ...record,
            key: metadata.fileName.toLowerCase().trim(),
          });
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => {
          console.warn("Failed to store blob in IndexedDB:", tx.error);
          resolve(); // Resolve anyway so UI is not blocked
        };
      });
    } catch (err) {
      console.warn("IndexedDB put error:", err);
    }
  },

  /**
   * Retrieve a dataUrl by key from memory or IndexedDB
   */
  async get(key: string): Promise<string | null> {
    if (!key) return null;

    // Check memory cache first
    const mem = memoryBlobCache.get(key) || memoryBlobCache.get(key.toLowerCase().trim());
    if (mem && mem.length > 50) return mem;

    try {
      const db = await getDb();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(key);

        req.onsuccess = () => {
          if (req.result?.dataUrl) {
            memoryBlobCache.set(key, req.result.dataUrl);
            resolve(req.result.dataUrl);
          } else {
            // Try normalized lowercase key
            const normKey = key.toLowerCase().trim();
            if (normKey !== key) {
              const req2 = store.get(normKey);
              req2.onsuccess = () => {
                if (req2.result?.dataUrl) {
                  memoryBlobCache.set(key, req2.result.dataUrl);
                  resolve(req2.result.dataUrl);
                } else {
                  resolve(null);
                }
              };
              req2.onerror = () => resolve(null);
            } else {
              resolve(null);
            }
          }
        };

        req.onerror = () => resolve(null);
      });
    } catch (err) {
      console.warn("IndexedDB get error:", err);
      return null;
    }
  },

  /**
   * Remove a blob from IndexedDB and memory
   */
  async delete(key: string): Promise<void> {
    if (!key) return;
    memoryBlobCache.delete(key);
    memoryBlobCache.delete(key.toLowerCase().trim());

    try {
      const db = await getDb();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        const store = tx.objectStore(IDB_STORE);
        store.delete(key);
        store.delete(key.toLowerCase().trim());
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
  },

  /**
   * Convert a base64 DataURL to a high-compatibility native Blob URL for <iframe> viewing
   */
  createBlobUrl(dataUrl: string): string {
    if (!dataUrl) return "";
    if (dataUrl.startsWith("blob:") || dataUrl.startsWith("http")) return dataUrl;

    try {
      const parts = dataUrl.split(",");
      if (parts.length !== 2) return dataUrl;

      const header = parts[0];
      const base64 = parts[1];
      const mimeMatch = header.match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "application/pdf";

      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.warn("Could not create Blob URL from dataUrl:", e);
      return dataUrl;
    }
  },
};

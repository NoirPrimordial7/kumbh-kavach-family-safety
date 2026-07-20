import { mapConfig } from '@/config/mapConfig';

const DIRECTORY = 'kumbh-kavach-maps';
const ARCHIVE = 'nashik-ramkund-v1.pmtiles';
export const offlineMapMetadata = { version: 'Ramkund v1', approximateBytes: mapConfig.approximateDownloadBytes, archive: ARCHIVE } as const;

export interface OfflineMapProgress { downloadedBytes: number; totalBytes?: number; percent?: number }

async function directory() {
  if (!navigator.storage?.getDirectory) throw new Error('Origin Private File System is unavailable in this browser.');
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(DIRECTORY, { create: true });
}

export const offlineMapService = {
  isSupported: () => Boolean(navigator.storage?.getDirectory),

  async isInstalled() {
    try { await (await directory()).getFileHandle(ARCHIVE); return true; }
    catch { return false; }
  },

  async download(onProgress?: (progress: OfflineMapProgress) => void, signal?: AbortSignal) {
    const response = await fetch(mapConfig.offlineArchiveUrl, { signal });
    if (!response.ok || !response.body) throw new Error(`Map download failed (${response.status}). Configure VITE_OFFLINE_PMTILES_URL with a bounded Nashik extract.`);
    const totalBytes = Number(response.headers.get('content-length')) || undefined;
    const handle = await (await directory()).getFileHandle(ARCHIVE, { create: true });
    const writable = await handle.createWritable();
    const reader = response.body.getReader();
    let downloadedBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writable.write(value);
        downloadedBytes += value.byteLength;
        onProgress?.({ downloadedBytes, totalBytes, percent: totalBytes ? Math.round(downloadedBytes / totalBytes * 100) : undefined });
      }
      await writable.close();
    } catch (error) {
      await writable.abort();
      throw error;
    }
  },

  async remove() {
    try { await (await directory()).removeEntry(ARCHIVE); } catch { /* already absent */ }
  },

  async getObjectUrl() {
    const handle = await (await directory()).getFileHandle(ARCHIVE);
    return URL.createObjectURL(await handle.getFile());
  },

  async getFile() {
    const handle = await (await directory()).getFileHandle(ARCHIVE);
    return handle.getFile();
  },
};

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
    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !response.body) {
      throw new Error(`Map download failed (${response.status}). Configure VITE_OFFLINE_PMTILES_URL with a bounded Nashik extract.`);
    }
    if (contentType.includes('text/html')) {
      throw new Error('Map download returned an HTML page instead of a PMTiles archive.');
    }
    const totalBytes = Number(response.headers.get('content-length')) || undefined;
    const handle = await (await directory()).getFileHandle(ARCHIVE, { create: true });
    const writable = await handle.createWritable();
    const reader = response.body.getReader();
    let downloadedBytes = 0;
    let signature = new Uint8Array();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (signature.byteLength < 8) {
          const joined = new Uint8Array(Math.min(8, signature.byteLength + value.byteLength));
          joined.set(signature);
          joined.set(value.subarray(0, joined.byteLength - signature.byteLength), signature.byteLength);
          signature = joined;
          if (signature.byteLength === 8) {
            const label = new TextDecoder().decode(signature.subarray(0, 7));
            if (label !== 'PMTiles' || signature[7] !== 3) {
              throw new Error('Map download is not a supported PMTiles v3 archive.');
            }
          }
        }
        await writable.write(value);
        downloadedBytes += value.byteLength;
        onProgress?.({ downloadedBytes, totalBytes, percent: totalBytes ? Math.round(downloadedBytes / totalBytes * 100) : undefined });
      }
      if (signature.byteLength < 8) throw new Error('Map download ended before a valid PMTiles header was received.');
      await writable.close();
    } catch (error) {
      await writable.abort();
      try { await (await directory()).removeEntry(ARCHIVE); } catch { /* no partial file */ }
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

/* global Buffer, console, process */
import { open, stat } from 'node:fs/promises';
import path from 'node:path';

const required = process.argv.includes('--required') || process.env.CI === 'true';
const asset = path.resolve('public/maps/nashik-ramkund-v1.pmtiles');
const minimumBytes = 100_000;

try {
  const info = await stat(asset);
  if (info.size < minimumBytes) {
    throw new Error(`file is only ${info.size} bytes; expected at least ${minimumBytes}`);
  }
  const handle = await open(asset, 'r');
  const header = Buffer.alloc(8);
  await handle.read(header, 0, header.length, 0);
  await handle.close();
  const signature = header.subarray(0, 7).toString('ascii');
  if (signature !== 'PMTiles') {
    const preview = header.toString('utf8').replace(/\s+/g, ' ');
    throw new Error(`invalid PMTiles signature (${JSON.stringify(preview)}); possible HTML/error response`);
  }
  if (header[7] !== 3) {
    throw new Error(`unsupported PMTiles version ${header[7]}; expected v3`);
  }
  console.log(`Verified ${path.relative(process.cwd(), asset)} (${info.size.toLocaleString()} bytes, PMTiles v3).`);
} catch (error) {
  const message = `Map asset verification failed: ${error instanceof Error ? error.message : String(error)}. `
    + 'Generate it with the documented official pmtiles extract command.';
  if (required) {
    console.error(message);
    process.exit(1);
  }
  console.warn(`${message} Local development will use the bundled coordinate fallback.`);
}

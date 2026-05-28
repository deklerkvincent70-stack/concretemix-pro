import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const capBin = join(root, 'node_modules', '@capacitor', 'cli', 'bin', 'capacitor');

const result = spawnSync(process.execPath, [capBin, ...args], {
  stdio: 'inherit'
});

process.exit(result.status ?? 1);

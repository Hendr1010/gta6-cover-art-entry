// Neon Bay cover maker, handed in for gta6-cover-art-01 (Node 22, standard
// library only). The app is the static files in this directory's app/ folder:
// app/index.html opens in desktop Chrome with no network request, and the
// cover it paints is drawn live on a canvas from the user's own photos. This
// program copies app/ and screenshots/ beside this file into /output and
// writes /output/dossier.json with the make.fun library in vendor/, which
// the scorer runs again byte for byte on what is handed in. Outside the
// grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn() {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
  const shotsDir = join(outputDir, 'screenshots');
  mkdirSync(shotsDir, { recursive: true });
  if (existsSync(join(repoRoot, 'screenshots'))) {
    cpSync(join(repoRoot, 'screenshots'), shotsDir, { recursive: true });
  }
  // The scorer's own caps (the gate's gate.json): only text_max_bytes shapes
  // the dossier's bytes; the rest refuse an entry the scorer would refuse
  // (more than 4 screenshots or one over 256 KiB; more than 993 entries or
  // 48 MiB under app/, or a path under app/ over 1000 bytes).
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  return dossier.length;
}

const dossierBytes = handIn();
console.log(`handed in app/ and screenshots/ to ${outputDir} (dossier.json: ${dossierBytes} bytes)`);

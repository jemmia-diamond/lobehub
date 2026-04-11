import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const spaDir = path.resolve(root, 'public/_spa');
const distDirs = ['desktop', 'mobile'] as const;
const copyDirs = ['assets', 'i18n', 'vendor'] as const;

mkdirSync(spaDir, { recursive: true });

for (const distDir of distDirs) {
  const sourceDist = path.resolve(root, `dist/${distDir}`);
  if (!existsSync(sourceDist)) continue;

  // 1. Copy subdirectories
  for (const dir of copyDirs) {
    const sourceDir = path.resolve(sourceDist, dir);
    const targetDir = path.resolve(spaDir, dir);

    if (!existsSync(sourceDir)) continue;

    cpSync(sourceDir, targetDir, { recursive: true });
    console.log(`Copied dist/${distDir}/${dir} -> public/_spa/${dir}`);
  }

  // 2. Copy root-level assets (favicons, etc.)
  const rootFiles = ['favicon-32x32.png', 'favicon.png', 'favicon.ico', 'apple-touch-icon.png', 'manifest.webmanifest'];
  for (const file of rootFiles) {
    const sourceFile = path.resolve(sourceDist, file);
    const targetFile = path.resolve(spaDir, file);

    if (existsSync(sourceFile)) {
      cpSync(sourceFile, targetFile);
      console.log(`Copied dist/${distDir}/${file} -> public/_spa/${file}`);
    }
  }
}

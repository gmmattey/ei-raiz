/**
 * gerar-icons.mjs
 * Gera PNGs do App Icon em todos os tamanhos para PWA, favicon, Apple Touch, Android.
 * Geometria-fonte: iconApp_Esquilo_preto.svg (canvas 428.86×518.02).
 * Centraliza em canvas quadrado 1024×1024 com fundo branco + ponto preto + barra laranja.
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../');
const OUT_DIR = resolve(ROOT, 'apresentacao/public/assets/logo');
mkdirSync(OUT_DIR, { recursive: true });

// SVG mestre — quadrado 1024×1024, fundo branco, ponto preto (geometria do _preto).
const SVG_MASTER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" rx="220" fill="#FFFFFF"/>
  <g transform="translate(173 102) scale(1.581)">
    <circle cx="118.81" cy="399.21" r="118.81" fill="#111111"/>
    <line x1="179.87" y1="59" x2="369.87" y2="459"
          stroke="#ff6a00" stroke-width="118" stroke-linecap="round"/>
  </g>
</svg>`;

const SIZES = [16, 32, 48, 64, 96, 180, 192, 512, 1024];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const size of SIZES) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!DOCTYPE html>
<html><head>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:${size}px;height:${size}px;overflow:hidden;background:transparent;}
  img{width:${size}px;height:${size}px;display:block;}
</style>
</head><body>
  <img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG_MASTER)}" />
</body></html>`);

  const buffer = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: size, height: size },
    omitBackground: true,
  });

  writeFileSync(resolve(OUT_DIR, `icon-${size}x${size}.png`), buffer);
  console.log(`✅ icon-${size}x${size}.png`);
}

// Aliases
copyFileSync(resolve(OUT_DIR, 'icon-512x512.png'), resolve(OUT_DIR, 'esquilo-invest-simbolo.png'));
copyFileSync(resolve(OUT_DIR, 'icon-180x180.png'), resolve(OUT_DIR, 'apple-touch-icon.png'));
copyFileSync(resolve(OUT_DIR, 'icon-32x32.png'), resolve(ROOT, 'apresentacao/public/favicon.png'));

console.log('✅ apple-touch-icon.png');
console.log('✅ esquilo-invest-simbolo.png');
console.log('✅ public/favicon.png');

await browser.close();
console.log('\n🐿️  Icons gerados em:', OUT_DIR);

/**
 * gerar-icon-monocromatico.mjs
 * Gera ic_launcher_monochrome.png para Android Themed Icons (Android 13+).
 * O ícone monocromático deve ser branco sobre fundo transparente — o sistema
 * aplica a cor do tema do usuário em cima.
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../');

// SVG monocromático: formas brancas sobre fundo transparente
// O sistema Android colore com a cor do wallpaper/tema
const MONO_SVG = `<svg width="108" height="108" viewBox="0 0 108 108" xmlns="http://www.w3.org/2000/svg">
  <!-- Área segura do adaptive icon: 72x72 centrada em 108x108 -->
  <!-- Ponto -->
  <circle cx="43" cy="55" r="6" fill="white"/>
  <!-- Contra-barra -->
  <line x1="54" y1="34" x2="74" y2="76"
        stroke="white" stroke-width="13" stroke-linecap="round"/>
</svg>`;

const ANDROID_RES = resolve(ROOT, 'apresentacao/android/app/src/main/res');

const MIPMAP_SIZES = {
  'mipmap-mdpi':    48,
  'mipmap-hdpi':    72,
  'mipmap-xhdpi':   96,
  'mipmap-xxhdpi':  144,
  'mipmap-xxxhdpi': 192,
};

const browser = await chromium.launch();
const page    = await browser.newPage();

for (const [folder, size] of Object.entries(MIPMAP_SIZES)) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!DOCTYPE html>
<html>
<head>
<style>
  * { margin:0; padding:0; }
  html, body { width:${size}px; height:${size}px; overflow:hidden; background:transparent; }
  img { width:${size}px; height:${size}px; display:block; }
</style>
</head>
<body>
  <img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(MONO_SVG)}" />
</body>
</html>`);

  const buffer = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: size, height: size },
    omitBackground: true,
  });

  const dest = resolve(ANDROID_RES, folder, 'ic_launcher_monochrome.png');
  mkdirSync(resolve(ANDROID_RES, folder), { recursive: true });
  writeFileSync(dest, buffer);
  console.log(`✅ ${folder}/ic_launcher_monochrome.png (${size}px)`);
}

await browser.close();
console.log('\n🐿️  Monochrome icons gerados para Android Themed Icons (Android 13+)');

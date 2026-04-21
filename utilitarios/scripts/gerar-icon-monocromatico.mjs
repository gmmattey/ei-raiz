/**
 * gerar-icon-monocromatico.mjs
 * Gera ic_launcher_monochrome.png para Android Themed Icons (Android 13+).
 * Geometria-fonte: iconApp_Esquilo_branco.svg adaptado para 108×108 (área segura do adaptive icon).
 * O sistema Android aplica a cor do tema do usuário em cima das formas brancas.
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../');

// Fundo transparente, formas brancas — geometria base do _branco (canvas 428.86×518.02)
// Centralizado em 108×108 com scale apropriado (área segura do adaptive icon = 72×72)
const MONO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">
  <g transform="translate(27 23) scale(0.1167)">
    <!-- ponto -->
    <circle cx="118.81" cy="399.21" r="118.81" fill="#FFFFFF"/>
    <!-- contra-barra -->
    <line x1="179.87" y1="59" x2="369.87" y2="459"
          stroke="#FFFFFF" stroke-width="118" stroke-linecap="round"/>
  </g>
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
const page = await browser.newPage();

for (const [folder, size] of Object.entries(MIPMAP_SIZES)) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!DOCTYPE html>
<html><head>
<style>
  *{margin:0;padding:0;}
  html,body{width:${size}px;height:${size}px;overflow:hidden;background:transparent;}
  img{width:${size}px;height:${size}px;display:block;}
</style>
</head><body>
  <img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(MONO_SVG)}" />
</body></html>`);

  const buffer = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: size, height: size },
    omitBackground: true,
  });

  mkdirSync(resolve(ANDROID_RES, folder), { recursive: true });
  writeFileSync(resolve(ANDROID_RES, folder, 'ic_launcher_monochrome.png'), buffer);
  console.log(`✅ ${folder}/ic_launcher_monochrome.png (${size}px)`);
}

await browser.close();
console.log('\n🐿️  Monochrome icons gerados (geometria iconApp_Esquilo_branco)');

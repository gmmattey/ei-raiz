import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const UI_DIR = join(ROOT, 'packages', 'ui')
const WEB_DIR = join(ROOT, 'apps', 'web')
const RUNTIME_UI_DIR = join(WEB_DIR, 'runtime-ui')
const RUNTIME_FONT_DIR = join(WEB_DIR, 'runtime-fonts')
const WEB_ICON_DIR = join(WEB_DIR, 'icons')
const PUBLIC_FONT_DIR = join(ROOT, 'public', 'fonts')
const PUBLIC_ICON_DIR = join(ROOT, 'public', 'icons')
const PUBLIC_TEMPLATE = join(ROOT, 'public', 'template-quanto.xlsx')
const WEB_TEMPLATE = join(WEB_DIR, 'template-quanto.xlsx')

mkdirSync(RUNTIME_UI_DIR, { recursive: true })
mkdirSync(RUNTIME_FONT_DIR, { recursive: true })
mkdirSync(WEB_ICON_DIR, { recursive: true })

copyFileSync(join(UI_DIR, 'components.js'), join(RUNTIME_UI_DIR, 'components.js'))

const styles = readFileSync(join(UI_DIR, 'styles.css'), 'utf8')
const runtimeStyles = styles.replace(/\.\.\/\.\.\/public\/fonts\//g, '../runtime-fonts/')
writeFileSync(join(RUNTIME_UI_DIR, 'styles.css'), runtimeStyles, 'utf8')

for (const file of readdirSync(PUBLIC_FONT_DIR)) {
  if (file.endsWith('.woff2')) {
    copyFileSync(join(PUBLIC_FONT_DIR, file), join(RUNTIME_FONT_DIR, file))
  }
}

for (const file of readdirSync(PUBLIC_ICON_DIR)) {
  if (file.endsWith('.png')) {
    copyFileSync(join(PUBLIC_ICON_DIR, file), join(WEB_ICON_DIR, file))
  }
}

if (existsSync(PUBLIC_TEMPLATE)) {
  copyFileSync(PUBLIC_TEMPLATE, WEB_TEMPLATE)
}

console.log('Synced apps/web runtime assets from packages/ui and public/.')

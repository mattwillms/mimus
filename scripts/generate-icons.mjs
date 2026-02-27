import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = join(__dirname, '../public/icon.svg')
const svg = readFileSync(svgPath)

const icons = [
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'apple-touch-icon.png', size: 180 },
]

for (const { file, size } of icons) {
  const out = join(__dirname, '../public', file)
  await sharp(svg).resize(size, size).png().toFile(out)
  console.log(`Generated ${file} (${size}x${size})`)
}

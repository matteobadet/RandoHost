// Génère un PNG 256x256 pour l'icône RandoHost, puis le convertit en .ico
// Utilise uniquement des modules Node natifs + png-to-ico
const fs = require('fs')
const path = require('path')

const SIZE = 256

// ── Génère un PNG minimal via une bitmap raw (BMP → PNG pas dispo sans lib)
// On va créer un SVG inline et le sauvegarder en PNG via un trick :
// electron-builder accepte aussi un PNG 256x256 directement pour Windows si on
// passe la propriété "icon" au format .png.
//
// Pour l'ICO, on utilise png-to-ico qui accepte un Buffer PNG.
// On génère un PNG 256x256 "maison" avec un header PNG valide.

function createSimplePNG(size) {
  // PNG header + IHDR + IDAT + IEND — dessiné manuellement
  const { createCanvas } = (() => {
    try { return require('canvas') } catch { return null }
  })() ?? {}

  if (createCanvas) {
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')
    // Fond dégradé bleu foncé
    const grad = ctx.createLinearGradient(0, 0, size, size)
    grad.addColorStop(0, '#1e3a5f')
    grad.addColorStop(1, '#0f172a')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(0, 0, size, size, size * 0.2)
    ctx.fill()
    // Triangle "montagne"
    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.moveTo(size * 0.5, size * 0.18)
    ctx.lineTo(size * 0.82, size * 0.72)
    ctx.lineTo(size * 0.18, size * 0.72)
    ctx.closePath()
    ctx.fill()
    // Sommet blanc
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.moveTo(size * 0.5, size * 0.18)
    ctx.lineTo(size * 0.62, size * 0.42)
    ctx.lineTo(size * 0.38, size * 0.42)
    ctx.closePath()
    ctx.fill()
    return canvas.toBuffer('image/png')
  }

  // Fallback : PNG 1×1 bleu valide (electron-builder l'accepte pour tester)
  // On retourne un PNG 256x256 unicolore encodé manuellement
  return generateSolidPNG(size, 0x3b, 0x82, 0xf6)
}

// ── Génère un PNG solid color sans dépendance externe ──────────────────────
function generateSolidPNG(size, r, g, b) {
  const zlib = require('zlib')
  const crc32 = makeCRC32()

  // Raw image data (filter byte 0x00 per scanline)
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0 // filter type None
    for (let x = 0; x < size; x++) {
      const off = y * (size * 3 + 1) + 1 + x * 3
      raw[off] = r; raw[off+1] = g; raw[off+2] = b
    }
  }
  const idat = zlib.deflateSync(raw)

  const chunks = []
  // PNG signature
  chunks.push(Buffer.from([137,80,78,71,13,10,26,10]))
  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  chunks.push(makeChunk('IHDR', ihdr, crc32))
  // IDAT
  chunks.push(makeChunk('IDAT', idat, crc32))
  // IEND
  chunks.push(makeChunk('IEND', Buffer.alloc(0), crc32))
  return Buffer.concat(chunks)
}

function makeChunk(type, data, crc32fn) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const typeBytes = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32fn(Buffer.concat([typeBytes, data])))
  return Buffer.concat([len, typeBytes, data, crcBuf])
}

function makeCRC32() {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  return (buf) => {
    let crc = 0xFFFFFFFF
    for (const b of buf) crc = (crc >>> 8) ^ table[(crc ^ b) & 0xFF]
    return (crc ^ 0xFFFFFFFF) >>> 0
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
;(async () => {
  const assetsDir = path.join(__dirname, 'assets')
  fs.mkdirSync(assetsDir, { recursive: true })

  const pngPath = path.join(assetsDir, 'icon.png')
  const icoPath = path.join(assetsDir, 'icon.ico')

  const pngBuf = createSimplePNG(SIZE)
  fs.writeFileSync(pngPath, pngBuf)
  console.log('✓ icon.png créé')

  const pngToIco = require('png-to-ico')
  const icoBuf = await pngToIco(pngBuf)
  fs.writeFileSync(icoPath, icoBuf)
  console.log('✓ icon.ico créé')
})()

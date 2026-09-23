const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create a basic valid PNG using Node built-in zlib
function createPng(size, bgColor, fgColor) {
  const width = size;
  const height = size;

  // Raw RGBA pixels
  const rowLength = width * 4 + 1; // +1 for filter byte
  const rawData = Buffer.alloc(rowLength * height);

  const [br, bg, bb] = bgColor;
  const [fr, fg, fb] = fgColor;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Draw rounded corner card + Islamic dome / geometric silhouette
      const cx = width / 2;
      const cy = height / 2;
      const dx = (x - cx) / (width / 2);
      const dy = (y - cy) / (height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Inner medallion
      const isInnerCircle = dist < 0.65;
      const isCenterStar = (Math.abs(dx) + Math.abs(dy) < 0.35) || (Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) < 0.25);

      if (isCenterStar) {
        rawData[pixelOffset] = fr;
        rawData[pixelOffset + 1] = fg;
        rawData[pixelOffset + 2] = fb;
        rawData[pixelOffset + 3] = 255;
      } else if (isInnerCircle) {
        rawData[pixelOffset] = Math.round(br * 1.2 > 255 ? 255 : br * 1.2);
        rawData[pixelOffset + 1] = Math.round(bg * 1.2 > 255 ? 255 : bg * 1.2);
        rawData[pixelOffset + 2] = Math.round(bb * 1.2 > 255 ? 255 : bb * 1.2);
        rawData[pixelOffset + 3] = 255;
      } else {
        rawData[pixelOffset] = br;
        rawData[pixelOffset + 1] = bg;
        rawData[pixelOffset + 2] = bb;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Emerald (#064e3b) -> RGB(6, 78, 59)
// Gold (#f59e0b) -> RGB(245, 158, 11)
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), createPng(192, [6, 78, 59], [245, 158, 11]));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), createPng(512, [6, 78, 59], [245, 158, 11]));
console.log('Icons generated successfully!');

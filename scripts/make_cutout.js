const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('../../madiun-showreel/node_modules/@napi-rs/canvas');

async function run() {
  const inputPath = path.join(__dirname, '../public/assets/tri_sitting_raw.jpg');
  const img = await loadImage(inputPath);
  const w = img.width;
  const h = img.height;

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Let's determine background mask using BFS flood fill from edges
  // Visited array: 0 = unvisited, 1 = background, 2 = person
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qHead = 0;
  let qTail = 0;

  function isBgPixel(r, g, b, y) {
    // Top area above y=430 is 100% background
    if (y < 430) return true;

    const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
    
    // Bottom shadow area below y=960 is background
    if (y >= 962 && maxDiff < 15 && r > 180) return true;

    // Checkerboard squares: light gray (~230-236) or white (~250-255) with very low color saturation
    if (maxDiff <= 10 && r >= 220 && g >= 220 && b >= 220) {
      return true;
    }

    // Edge anti-aliasing / soft shadow of checkerboard
    if (maxDiff <= 8 && r >= 205 && g >= 205 && b >= 205) {
      return true;
    }

    return false;
  }

  // Enqueue border pixels
  for (let x = 0; x < w; x++) {
    queue[qTail++] = (0 * w) + x;
    visited[(0 * w) + x] = 1;

    queue[qTail++] = ((h - 1) * w) + x;
    visited[((h - 1) * w) + x] = 1;
  }

  for (let y = 0; y < h; y++) {
    const leftIdx = (y * w) + 0;
    if (!visited[leftIdx]) {
      visited[leftIdx] = 1;
      queue[qTail++] = leftIdx;
    }
    const rightIdx = (y * w) + (w - 1);
    if (!visited[rightIdx]) {
      visited[rightIdx] = 1;
      queue[qTail++] = rightIdx;
    }
  }

  // BFS
  while (qHead < qTail) {
    const curr = queue[qHead++];
    const cx = curr % w;
    const cy = Math.floor(curr / w);

    const neighbors = [
      cy > 0 ? curr - w : -1,
      cy < h - 1 ? curr + w : -1,
      cx > 0 ? curr - 1 : -1,
      cx < w - 1 ? curr + 1 : -1
    ];

    for (let i = 0; i < 4; i++) {
      const nIdx = neighbors[i];
      if (nIdx === -1 || visited[nIdx] !== 0) continue;

      const nx = nIdx % w;
      const ny = Math.floor(nIdx / w);

      const pIdx = nIdx * 4;
      const r = data[pIdx];
      const g = data[pIdx + 1];
      const b = data[pIdx + 2];

      if (isBgPixel(r, g, b, ny)) {
        visited[nIdx] = 1; // background
        queue[qTail++] = nIdx;
      }
    }
  }

  // Check bounds of person (visited != 1)
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x);
      if (visited[idx] !== 1) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log('Detected person bounding box:', { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY });

  // Apply alpha transparency and crop tightly around person
  const cropPad = 4;
  const cMinX = Math.max(0, minX - cropPad);
  const cMaxX = Math.min(w - 1, maxX + cropPad);
  const cMinY = Math.max(0, minY - cropPad);
  const cMaxY = Math.min(h - 1, maxY + cropPad);

  const outW = cMaxX - cMinX + 1;
  const outH = cMaxY - cMinY + 1;

  const outCanvas = createCanvas(outW, outH);
  const outCtx = outCanvas.getContext('2d');
  const outImgData = outCtx.createImageData(outW, outH);
  const outD = outImgData.data;

  for (let y = cMinY; y <= cMaxY; y++) {
    for (let x = cMinX; x <= cMaxX; x++) {
      const srcIdx = (y * w + x);
      const srcPIdx = srcIdx * 4;
      const dstIdx = ((y - cMinY) * outW + (x - cMinX)) * 4;

      if (visited[srcIdx] === 1) {
        outD[dstIdx] = 0;
        outD[dstIdx + 1] = 0;
        outD[dstIdx + 2] = 0;
        outD[dstIdx + 3] = 0; // Transparent
      } else {
        outD[dstIdx] = data[srcPIdx];
        outD[dstIdx + 1] = data[srcPIdx + 1];
        outD[dstIdx + 2] = data[srcPIdx + 2];
        outD[dstIdx + 3] = 255;
      }
    }
  }

  // Smooth edges slightly (defringe 1px)
  for (let y = 1; y < outH - 1; y++) {
    for (let x = 1; x < outW - 1; x++) {
      const idx = (y * outW + x) * 4;
      if (outD[idx + 3] === 255) {
        // check neighbor transparent count
        let transNeighbors = 0;
        const neighbors = [
          idx - 4, idx + 4,
          idx - outW * 4, idx + outW * 4,
          idx - outW * 4 - 4, idx - outW * 4 + 4,
          idx + outW * 4 - 4, idx + outW * 4 + 4
        ];
        for (const n of neighbors) {
          if (outD[n + 3] === 0) transNeighbors++;
        }
        if (transNeighbors >= 4) {
          outD[idx + 3] = Math.max(80, 255 - transNeighbors * 30);
        }
      }
    }
  }

  outCtx.putImageData(outImgData, 0, 0);

  const outBuf = outCanvas.toBuffer('image/png');
  const outputPath = path.join(__dirname, '../public/assets/tri_sitting.png');
  fs.writeFileSync(outputPath, outBuf);
  console.log(`Saved transparent cutout to ${outputPath} (${outW}x${outH})`);
}

run().catch(console.error);

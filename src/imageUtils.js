import fs from 'fs';
import sharp from 'sharp';
import path from 'path';

/**
 * Scale image so the smallest side equals `minSide`, preserving aspect ratio,
 * and make near-black background transparent.
 *
 * @param {Object} options
 * @param {string} options.inputPath - Source image path
 * @param {string} options.outputPath - Destination image path (PNG)
 * @param {number} [options.minSide=128] - Target minimum side in pixels
 * @param {number} [options.threshold=16] - Threshold to consider "black". For 'per-pixel' use 0-255 (or 0-1 fraction); for 'distance' use fraction 0-1 or absolute distance
 * @param {string} [options.method='per-pixel'] - Method to remove background: 'per-pixel'|'distance'|'greyscale'
 * @param {number} [options.softness=8] - Soft transition width (distance units) around threshold used by 'distance'
 * @returns {Promise<Object>} - { outputPath, width, height }
 */
export async function scaleAndRemoveBlackBackground({
  inputPath,
  outputPath,
  minSide = 128,
  threshold = 16,
  method = 'per-pixel',
  softness = 8
}) {

    // print all input options for debugging
    console.log('scaleAndRemoveBlackBackground called with:');
    console.log(`  inputPath: ${inputPath}`);
    console.log(`  outputPath: ${outputPath}`);
    console.log(`  minSide: ${minSide}`);
    console.log(`  threshold: ${threshold}`);

  if (!inputPath || !outputPath) {
    throw new Error('inputPath and outputPath are required');
  }

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  // Normalize threshold: allow 0-1 fractions or 0-255 values
  let thresh = threshold;
  if (threshold > 0 && threshold <= 1) {
    thresh = Math.round(threshold * 255);
  }
  thresh = Math.max(0, Math.min(255, Math.round(thresh)));

  const img = sharp(inputPath);
  const meta = await img.metadata();
  if (!meta.width || !meta.height) {
    throw new Error('Unable to determine input dimensions');
  }

  // Compute resize dimension so the smaller side becomes minSide
  const width = meta.width;
  const height = meta.height;
  let resizeOptions = {};
  if (width <= height) {
    resizeOptions.width = minSide;
  } else {
    resizeOptions.height = minSide;
  }

  // Resize to computed dimension, keep aspect ratio, output PNG
  const resizedBuffer = await img.resize(resizeOptions).png().toBuffer();

  // Create mask using either greyscale thresholding or Euclidean color distance to black
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  if (method === 'per-pixel') {
    // Per-pixel alpha: mark pixels as transparent where R,G,B are all below threshold
    // Normalize threshold: allow 0-1 fraction or 0-255
    let pxThresh = threshold;
    if (threshold > 0 && threshold <= 1) pxThresh = Math.round(threshold * 255);
    pxThresh = Math.max(0, Math.min(255, Number(pxThresh)));

    const { data: raw, info } = await sharp(resizedBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;
    const channels = info.channels; // should be 4 after ensureAlpha

    // modify alpha channel in-place
    for (let i = 0; i < w * h; i++) {
      const off = i * channels;
      const r = raw[off];
      const g = raw[off + 1];
      const b = raw[off + 2];
      if (r < pxThresh && g < pxThresh && b < pxThresh) {
        raw[off + 3] = 0;
      }
    }

    await sharp(raw, { raw: { width: w, height: h, channels } }).png().toFile(outputPath);
  } else if (method === 'distance') {
    // compute raw pixels and derive mask by color distance to black
    const { data: raw, info } = await sharp(resizedBuffer).raw().toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;
    const channels = info.channels; // expect 3 or 4

    const maxDist = Math.sqrt(3 * 255 * 255);
    let distThresh = threshold;
    if (threshold > 0 && threshold <= 1) {
      distThresh = threshold * maxDist;
    }
    distThresh = Math.max(0, Math.min(maxDist, Number(distThresh)));

    const soft = Math.max(0, Number(softness) || 0);

    const mask = Buffer.alloc(w * h);
    let ri = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const r = raw[ri++] ?? 0;
        const g = raw[ri++] ?? 0;
        const b = raw[ri++] ?? 0;
        if (channels === 4) ri++; // skip alpha if present

        const dsq = r * r + g * g + b * b;
        const d = Math.sqrt(dsq);

        if (d <= distThresh - soft) {
          mask[y * w + x] = 0; // fully transparent
        } else if (d >= distThresh + soft) {
          mask[y * w + x] = 255; // fully opaque
        } else {
          // linear ramp between (distThresh-soft) -> 0 and (distThresh+soft) -> 255
          const t = (d - (distThresh - soft)) / (2 * soft);
          const v = Math.round(Math.max(0, Math.min(1, t)) * 255);
          mask[y * w + x] = v;
        }
      }
    }

    const maskPng = await sharp(mask, { raw: { width: w, height: h, channels: 1 } }).png().toBuffer();

    await sharp(resizedBuffer)
      .composite([{ input: maskPng, blend: 'dest-in' }])
      .png()
      .toFile(outputPath);
  } else {
    // greyscale threshold fallback
    const maskBuffer = await sharp(resizedBuffer).greyscale().threshold(thresh).toBuffer();
    await sharp(resizedBuffer).composite([{ input: maskBuffer, blend: 'dest-in' }]).png().toFile(outputPath);
  }

  const outMeta = await sharp(outputPath).metadata();
  return {
    outputPath,
    width: outMeta.width,
    height: outMeta.height
  };
}

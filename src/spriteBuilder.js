import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Compute a centered square crop region for the image, optionally applying padding.
// `padding` semantics:
//  - if 0 <= padding < 1, treat as a fraction of the min(width, height) and shrink both sides by padding*min
//  - if padding >= 1, treat as pixel padding to remove from each side (left/right/top/bottom)
// This lets users tighten the crop to focus more on the central character.
function getCenterSquare(metadata, padding = 0) {
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const minSide = Math.min(width, height);

  // Determine padding in pixels per-side
  let padPx = 0;
  if (padding > 0 && padding < 1) {
    padPx = Math.floor(minSide * padding);
  } else if (padding >= 1) {
    padPx = Math.floor(padding);
  }

  const side = Math.max(1, minSide - 2 * padPx);
  return {
    left: Math.floor((width - side) / 2),
    top: Math.floor((height - side) / 2),
    size: side
  };
}

export async function buildSpriteSheet({ framesDir, frameWidth, frameHeight, columns, fps, padding = 0 }) {
  const files = fs
    .readdirSync(framesDir)
    .filter((file) => file.endsWith('.png'))
    .sort();
  const frameCount = files.length;
  const rows = Math.ceil(frameCount / columns);
  const canvasWidth = columns * frameWidth;
  const canvasHeight = rows * frameHeight;
  const canvas = sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });

  const composites = await Promise.all(
    files.map(async (file, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const filePath = path.join(framesDir, file);
      const metadata = await sharp(filePath).metadata();
      const { left, top, size } = getCenterSquare(metadata, padding);

      const buffer = await sharp(filePath)
        .extract({ left, top, width: size, height: size })
        .resize(frameWidth, frameHeight, { fit: 'cover' })
        .png()
        .toBuffer();

      return {
        input: buffer,
        left: col * frameWidth,
        top: row * frameHeight
      };
    })
  );

  await canvas.composite(composites).png().toFile(path.join(framesDir, '..', 'sprite.png'));

  const metadata = {
    frameWidth,
    frameHeight,
    frameCount,
    fps,
    loop: true,
    centerPadding: padding
  };

  fs.writeFileSync(path.join(framesDir, '..', 'sprite.json'), JSON.stringify(metadata, null, 2));
}

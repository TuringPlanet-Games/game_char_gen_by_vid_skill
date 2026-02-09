import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function getCenterSquare(metadata) {
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const side = Math.min(width, height);
  return {
    left: Math.floor((width - side) / 2),
    top: Math.floor((height - side) / 2),
    size: side
  };
}

export async function buildSpriteSheet({ framesDir, frameWidth, frameHeight, columns, fps }) {
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
      const { left, top, size } = getCenterSquare(metadata);

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
    loop: true
  };

  fs.writeFileSync(path.join(framesDir, '..', 'sprite.json'), JSON.stringify(metadata, null, 2));
}

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function buildSpriteSheet({ framesDir, frameWidth, frameHeight, columns, fps }) {
  const files = fs.readdirSync(framesDir).filter((file) => file.endsWith('.png'));
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

  const composites = files.map((file, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    return {
      input: path.join(framesDir, file),
      left: col * frameWidth,
      top: row * frameHeight
    };
  });

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

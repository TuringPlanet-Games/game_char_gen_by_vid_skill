import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function getEvenlySpacedIndices(total, count) {
  if (total <= 0 || count <= 0) {
    return [];
  }
  if (count === 1) {
    return [0];
  }
  const last = total - 1;
  const step = last / (count - 1);
  const indices = [];
  for (let i = 0; i < count; i += 1) {
    indices.push(Math.round(i * step));
  }
  return Array.from(new Set(indices));
}

async function main() {
  const outputDir = process.argv[2] ?? './output';
  const spritePath = path.join(outputDir, 'sprite.png');
  const metaPath = path.join(outputDir, 'sprite.json');

  if (!fs.existsSync(spritePath) || !fs.existsSync(metaPath)) {
    throw new Error('Missing sprite.png or sprite.json in output directory.');
  }

  const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const frameWidth = metadata.frameWidth;
  const frameHeight = metadata.frameHeight;
  const frameCount = metadata.frameCount;
  const fps = metadata.fps;

  const spriteMeta = await sharp(spritePath).metadata();
  const columns = Math.floor((spriteMeta.width ?? 0) / frameWidth);

  if (!frameWidth || !frameHeight || !frameCount || !columns) {
    throw new Error('Invalid sprite metadata.');
  }

  const requestedCount = 6;
  const indices = getEvenlySpacedIndices(frameCount, requestedCount);
  const actualCount = indices.length;

  const canvas = sharp({
    create: {
      width: frameWidth * actualCount,
      height: frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });

  const composites = await Promise.all(
    indices.map(async (index, targetCol) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const left = col * frameWidth;
      const top = row * frameHeight;
      const buffer = await sharp(spritePath)
        .extract({ left, top, width: frameWidth, height: frameHeight })
        .png()
        .toBuffer();

      return {
        input: buffer,
        left: targetCol * frameWidth,
        top: 0
      };
    })
  );

  const outSpritePath = path.join(outputDir, 'sprite_6.png');
  await canvas.composite(composites).png().toFile(outSpritePath);

  const outMetaPath = path.join(outputDir, 'sprite_6.json');
  fs.writeFileSync(
    outMetaPath,
    JSON.stringify(
      {
        frameWidth,
        frameHeight,
        frameCount: actualCount,
        fps,
        loop: true,
        sourceFrames: indices
      },
      null,
      2
    )
  );

  console.log(`Saved ${outSpritePath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

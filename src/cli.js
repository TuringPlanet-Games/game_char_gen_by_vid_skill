import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import { generateVideo } from './veoClient.js';
import { extractFrames } from './ffmpegHelper.js';
import { buildSpriteSheet } from './spriteBuilder.js';

dotenv.config();

const argv = yargs(hideBin(process.argv))
  .option('prompt', { type: 'string', demandOption: true })
  .option('duration', { type: 'number', default: 3 })
  .option('fps', { type: 'number', default: 12 })
  .option('resolution', { type: 'string', default: '512x512' })
  .option('output', { type: 'string', default: './output' })
  .argv;

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required');
  }

  const video = await generateVideo({
    prompt: argv.prompt,
    duration: argv.duration,
    fps: argv.fps,
    resolution: argv.resolution
  });

  const outputDir = path.resolve(argv.output);
  const mp4Path = path.join(outputDir, 'character.mp4');
  fs.writeFileSync(mp4Path, Buffer.from(video.data, 'base64'));

  const framesDir = path.join(outputDir, 'frames');
  await extractFrames({ input: mp4Path, outputDir: framesDir, fps: argv.fps });

  await buildSpriteSheet({
    framesDir,
    frameWidth: 256,
    frameHeight: 256,
    columns: 8,
    fps: argv.fps
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

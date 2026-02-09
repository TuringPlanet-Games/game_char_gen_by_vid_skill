import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import { generateVideo, downloadGeneratedVideo } from './veoClient.js';
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
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY is required');
  }

  const outputDir = path.resolve(argv.output);
  fs.mkdirSync(outputDir, { recursive: true });
  const mp4Path = path.join(outputDir, 'character.mp4');

  const operationResponse = await generateVideo({
    prompt: argv.prompt
  });

  await downloadGeneratedVideo({
    operationResponse,
    downloadPath: mp4Path
  });

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

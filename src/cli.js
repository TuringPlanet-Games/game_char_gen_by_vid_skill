import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import { generateVideo, downloadGeneratedVideo } from './veoClient.js';
import { extractFrames } from './ffmpegHelper.js';
import { buildSpriteSheet } from './spriteBuilder.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const basePromptPath = path.join(__dirname, 'descriptions.txt');

const argv = yargs(hideBin(process.argv))
  .option('prompt', { type: 'string' })
  .option('image', { type: 'string', description: 'Path to reference image file (absolute path)' })
  .option('padding', { type: 'number', default: 0, description: 'Optional padding around centered content in frames; can be a fraction of frame size (e.g. 0.1 for 10%) or an absolute pixel value' })
  .option('duration', { type: 'number', default: 3 })
  .option('fps', { type: 'number', default: 12 })
  .option('resolution', { type: 'string', default: '512x512' })
  .option('output', { type: 'string', default: './output' })
  .option('frames-only', { type: 'boolean', default: false, description: 'Only extract frames from an existing mp4; do not generate video' })
  .argv;

async function main() {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY is required');
  }

  // Validate image path if provided
  let imagePath = null;
  if (argv.image) {
    imagePath = path.resolve(argv.image);
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }
  }

  const basePrompt = fs.readFileSync(basePromptPath, 'utf8').trim();
  const fullPrompt = [basePrompt, argv.prompt].filter(Boolean).join('\n');

  const outputDir = path.resolve(argv.output);
  fs.mkdirSync(outputDir, { recursive: true });

  const mp4Path = path.join(outputDir, 'character.mp4');
  if (argv['frames-only']) {
    // User requested only frame extraction. Require an existing mp4.
    if (!fs.existsSync(mp4Path)) {
      throw new Error(`--frames-only set but mp4 not found at ${mp4Path}. Provide --input <path to mp4> or run without --frames-only to generate one.`);
    }
  } else {
    const operationResponse = await generateVideo({ prompt: fullPrompt, imagePath });
    await downloadGeneratedVideo({ operationResponse, downloadPath: mp4Path });
  }

  const framesDir = path.join(outputDir, 'frames');
  await extractFrames({ input: mp4Path, outputDir: framesDir, fps: argv.fps });
  await buildSpriteSheet({
    framesDir,
    frameWidth: 256,
    frameHeight: 256,
    columns: 8,
    fps: argv.fps,
    padding: argv.padding
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

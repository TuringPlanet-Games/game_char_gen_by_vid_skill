#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { scaleAndRemoveBlackBackground } from './imageUtils.js';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --input <path> [--output <path>] [--min-side <n>] [--threshold <n>]')
  .option('input', { type: 'string', demandOption: true, describe: 'Input image path' })
  .option('output', { type: 'string', describe: 'Output image path (PNG). Defaults to input_basename_trim.png in same dir' })
  .option('min-side', { type: 'number', default: 128, describe: 'Target minimum side in pixels' })
  .option('threshold', { type: 'number', default: 16, describe: 'Black threshold (per-pixel 0-255 or 0-1 fraction; distance method accepts 0-1 fraction)' })
  .option('method', { type: 'string', default: 'per-pixel', describe: "Method for background removal: 'per-pixel'|'distance'|'greyscale'" })
  .option('softness', { type: 'number', default: 8, describe: 'Soft transition width (distance units) around threshold (used by method=distance)' })
  .help()
  .argv;

async function main() {
  const input = argv.input;
  let output = argv.output;

  if (!output) {
    const { dirname, name } = (() => {
      const p = input;
      const parts = p.split(/\/|\\/);
      const base = parts.pop();
      const dir = parts.join('/') || '.';
      const idx = base.lastIndexOf('.');
      const name = idx === -1 ? base : base.slice(0, idx);
      return { dirname: dir, name };
    })();
    output = `${process.cwd()}/${dirname}/${name}_trim.png`;
  }

  console.log('Scaling & removing black background...');
  try {
    const res = await scaleAndRemoveBlackBackground({
      inputPath: input,
      outputPath: output,
      minSide: argv['min-side'],
      threshold: argv.threshold,
      method: argv.method,
      softness: argv['softness']
    });
    console.log(`Saved trimmed image to ${res.outputPath} (${res.width}x${res.height})`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();

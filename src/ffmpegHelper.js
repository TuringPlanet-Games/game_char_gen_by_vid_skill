import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export function extractFrames({ input, outputDir, fps = 12 }) {
  fs.mkdirSync(outputDir, { recursive: true });
  const args = ['-i', input, '-vf', `fps=${fps}`, path.join(outputDir, 'frame_%03d.png')];
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: 'inherit' });
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error('ffmpeg failed'))));
  });
}

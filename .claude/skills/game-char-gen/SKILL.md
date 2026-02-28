---
name: game-char-gen
description: Generate 2D game character sprites using Google Veo video generation API. Transforms text prompts into animated game character sprites through video generation, frame extraction, and sprite sheet assembly.
---

# Game Character Sprite Generator

This skill generates game character sprites using Google Veo's video generation capabilities.

## Quick Start

```bash
# Full workflow: generate video, extract frames, build sprite sheet
node ./src/cli.js --prompt "A goblin monster walking" --duration 3 --fps 12 --resolution 512x512 --output ./output

# Extract frames from existing video only
node ./src/cli.js --frames-only --duration 3 --fps 12 --resolution 512x512 --output ./output
```

## Common Commands

| Task | Command |
|------|---------|
| Generate sprite from prompt | `node ./src/cli.js --prompt "..." --output ./output` |
| Select 6 key frames | `node src/selectFrames.js ./output` |
| Remove black background | `node src/trim.js --input ./output/sprite_6.png` |

## Output Files

- `character.mp4` - Generated video from Veo
- `frames/` - Individual frame PNGs
- `sprite.png` - Full sprite sheet grid
- `sprite.json` - Metadata (dimensions, frame count, fps)
- `sprite_6.png` / `sprite_6.json` - 6-frame selection

## Key Parameters

- `--prompt`: Text description of the character (be specific about pose/movement)
- `--image`: Path to a reference image file (absolute path) to guide the generation
- `--duration`: Video length in seconds (3-5 works well)
- `--fps`: Frames per second (8-16 for sprite sheets)
- `--resolution`: Video resolution (512x512 recommended)
- `--output`: Output directory path

## Tips for Good Results

1. **Prompting**: Include "looping" or "seamless loop" for seamless animations
2. **Character**: Specify "pixel art" or "2D animation style" if needed
3. **Background**: Use dark backgrounds for easier removal
4. **Trim**: Run `trim.js` after to remove black backgrounds

## Project Structure

```
src/
├── cli.js           # Main entry point
├── veoClient.js     # Google Veo API wrapper
├── ffmpegHelper.js  # Frame extraction
├── spriteBuilder.js # Sprite sheet assembly
├── selectFrames.js  # 6-frame selector
├── trim.js          # Background removal
└── imageUtils.js    # Image utilities
```

# 游戏角色精灵图生成工具

## 安装
1. 确保已安装 Node.js 18+
2. 运行 `npm install`

## 配置
复制 `.env.example` 并填入：
```
GEMINI_API_KEY=your-key
```

## 用法
```
// 生成视频、抽帧并构建精灵图
node ./src/cli.js --prompt "Your prompt" --duration 3 --fps 12 --resolution 512x512 --output ./output
node ./src/cli.js --prompt "一个Goblin一样的怪物，头顶上写着DDos" --duration 3 --fps 12 --resolution 256x256 --output ./output

// 仅抽帧（需要先生成mp4）
❯ node ./src/cli.js  --frames-only  --duration 3 --fps 12 --resolution 512x512 --output ./output

// 对大图片进行再次抽帧脚本（需要先生成大图片png）
node src/selectFrames.js ./output 
```

输出目录包含：
- character.mp4
- frames/ (抽帧结果)
- sprite.png
- sprite.json

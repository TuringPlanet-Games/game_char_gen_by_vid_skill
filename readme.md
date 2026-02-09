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
node ./src/cli.js --prompt "Your prompt" --duration 3 --fps 12 --resolution 512x512 --output ./output
```

输出目录包含：
- character.mp4
- frames/ (抽帧结果)
- sprite.png
- sprite.json

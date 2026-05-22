# 塔罗牌预测

娱乐向塔罗占卜小游戏：完整 78 张 Rider-Waite 公版牌面，支持正/逆位中文解读与「允许逆位」开关。

## 环境要求

- Node.js 18 或更高版本

## 安装与启动

```bash
cd tarot-game
npm install
npm run build          # 生成牌库（Vercel 构建仅执行此项）
npm start
```

浏览器打开：http://localhost:3001

仅更新文案时：

```bash
npm run build-cards
```

本地缺少牌面图时（可选，需网络）：

```bash
npm run download-images
npm run compress-images   # 压缩 JPG，加快线上加载（维护用，不加入 Vercel build）
```

## 功能说明

- **抽一张牌**：从 78 张牌中随机抽取（可重复）
- **允许逆位**：勾选时约 50% 概率逆位；不勾选则恒为正位
- **牌面展示**：Rider-Waite 插图 + 翻牌动画，逆位时牌图旋转 180°
- **解读内容**：关键词、详细含义、汇总提示（正/逆位各一套）
- **清空**：仅重置界面为牌背，不调用接口

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/cards` | 返回 `{ count, total, major, minor, names }` |
| POST | `/api/draw` | 抽牌；body: `{ "allowReversed": true }` |

`POST /api/draw` 响应示例：

```json
{
  "id": "m13",
  "name": "死神",
  "reversed": true,
  "displayName": "死神（逆位）",
  "arcana": "major",
  "suit": null,
  "image": "/static/cards/m13.jpg",
  "keywords": "抗拒结束、停滞",
  "meaning": "...",
  "message": "你抽到了「死神（逆位）」：..."
}
```

## 牌面素材

- 正面：`public/static/cards/`（`m00–m21`、`c/s/w/p01–14`），已随仓库提交
- 牌背：`public/static/cards/bac.svg`（可替换）
- 缺图时前端回退：`/static/placeholder-card.svg` 或文字牌名

## 技术说明

- 后端：Express；牌库 `data/cards.json`（由 `npm run build-cards` 生成）
- 启动时校验牌库必须为 78 张且字段完整
- 默认端口 `3001`，与同级 `rps-game`（3000）互不干扰

## 部署到 Vercel

1. 将项目推送到 GitHub（例如 [yorkyfj/tarot-game](https://github.com/yorkyfj/tarot-game)）
2. 打开 [vercel.com](https://vercel.com) → 用 **Continue with GitHub** 登录 → **Add New Project** → 导入仓库
3. **Root Directory**：
   - 若仓库根目录就是本项目（独立 `tarot-game` 仓库）→ **留空**
   - 若项目在 monorepo 子目录（如 `cursor_workspace/tarot-game`）→ 填 `tarot-game`
4. Framework Preset 选 **Other**（使用 `vercel.json` 的 build 配置）
5. 点击 **Deploy**；完成后分享 `https://你的项目.vercel.app`

构建阶段仅执行 `npm run build`（生成 `cards.json`），**不会**下载图片。牌面图使用仓库内 `public/static/cards/`。若某张图缺失，页面会显示占位图或牌名。

推送 `main` 分支后 Vercel 会自动重新部署。

本地预览 Vercel 环境（需安装 Vercel CLI）：

```bash
npx vercel dev
```

## 项目结构

```
tarot-game/
├── api/index.js              # Vercel Serverless 入口
├── vercel.json
├── server.js
├── scripts/
│   ├── build-cards-json.js
│   └── download-images.js
├── data/
│   ├── tarot-images.json
│   ├── card-meanings.js
│   └── cards.json
└── public/
    ├── static/cards/         # 牌面 JPG + bac.svg
    ├── static/placeholder-card.svg
    ├── index.html
    ├── style.css
    └── app.js
```

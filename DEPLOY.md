# Vercel 部署清单（约 5 分钟）

仓库：[github.com/yorkyfj/tarot-game](https://github.com/yorkyfj/tarot-game)

## 1. 登录 Vercel

1. 打开 https://vercel.com
2. 点击 **Continue with GitHub**，授权 Vercel 访问你的 GitHub

## 2. 导入项目

1. 控制台 → **Add New…** → **Project**
2. 选择 **tarot-game** → **Import**
3. 配置（重要）：

| 项 | 值 |
|----|-----|
| Root Directory | **留空**（独立仓库，不要填 `tarot-game`） |
| Framework Preset | **Other** |
| Build Command | `npm run build`（来自 `vercel.json`） |
| Install Command | `npm install` |

4. 点击 **Deploy**，等待构建完成（约 1–3 分钟）

## 3. 验证

部署状态为 **Ready** 后点击 **Visit**，确认：

- [ ] 首页与牌背正常
- [ ] 「抽一张牌」有解读与牌面图
- [ ] 「允许逆位」开关有效

构建仅运行 `npm run build-cards`，不下载图片。牌面使用仓库内 `public/static/cards/`。

构建失败时：打开 **Deployments** → 最新记录 → **Building** → **View Build Logs**。

## 4. 分享给朋友

复制项目域名，形如：

```
https://tarot-game-xxxx.vercel.app
```

发给朋友即可在浏览器直接玩，无需安装。

## 5. 后续更新

```bash
git push origin main
```

Vercel 会自动重新部署。

## 命令行部署（可选）

已登录 Vercel CLI 时，在项目根目录：

```bash
npx vercel login
npx vercel --prod
```

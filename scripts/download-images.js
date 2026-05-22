/**
 * 下载 Rider-Waite 公版牌面图（metabismuth/tarot-json v0）与牌背图
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ZIP_URL =
  'https://github.com/metabismuth/tarot-json/releases/download/v0/cards.zip';
const OUT_DIR = path.join(__dirname, '..', 'public', 'static', 'cards');
const ZIP_PATH = path.join(OUT_DIR, 'cards.zip');

const USER_AGENT = 'Mozilla/5.0 (compatible; tarot-game/1.0)';

// 牌背：Wikimedia 公版 RWS（按顺序尝试）
const BAC_SOURCES = [
  'https://upload.wikimedia.org/wikipedia/commons/5/5c/RWS_Tarot_Back.jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_Back.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/0/0f/Rider-Waite_Tarot_Deck_backside.jpg',
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (targetUrl) => {
      const parsed = new URL(targetUrl);
      const options = {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        headers: { 'User-Agent': USER_AGENT },
      };
      const req = https
        .get(options, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            file.close();
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
            return request(res.headers.location);
          }
          if (res.statusCode !== 200) {
            file.close();
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
            reject(new Error(`${targetUrl} → HTTP ${res.statusCode}`));
            return;
          }
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
        })
        .on('error', (err) => {
          file.close();
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          reject(err);
        });
      req.setTimeout(30000, () => {
        req.destroy();
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(new Error('超时'));
      });
      file.on('error', () => {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(new Error('写入失败'));
      });
    };
    request(url);
  });
}

async function downloadCardBack() {
  const dest = path.join(OUT_DIR, 'bac.jpg');
  for (const url of BAC_SOURCES) {
    try {
      process.stdout.write(`下载牌背 ${path.basename(dest)} (${new URL(url).hostname}) ... `);
      await download(url, dest);
      const stat = fs.statSync(dest);
      if (stat.size < 1000) {
        fs.unlinkSync(dest);
        throw new Error('文件过小，可能无效');
      }
      console.log('完成');
      return true;
    } catch (err) {
      console.log(`失败 (${err.message})`);
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
    }
  }
  console.log('牌背下载未成功，将使用内置 bac.svg');
  return false;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (!fs.existsSync(ZIP_PATH)) {
    process.stdout.write('下载 cards.zip ... ');
    await download(ZIP_URL, ZIP_PATH);
    console.log('完成');
  } else {
    console.log('cards.zip 已存在，跳过下载');
  }

  const tarotImagesPath = path.join(__dirname, '..', 'data', 'tarot-images.json');
  const tarotImages = JSON.parse(fs.readFileSync(tarotImagesPath, 'utf-8'));
  const names = tarotImages.cards.map((c) => c.img);

  if (names.length !== 78) {
    throw new Error(`tarot-images.json 应有 78 张，实际 ${names.length} 张`);
  }

  const list = names.map((n) => `"${n}"`).join(' ');
  execSync(`unzip -o -j "${ZIP_PATH}" ${list} -d "${OUT_DIR}"`, {
    stdio: 'inherit',
  });

  console.log(`\n已解压 ${names.length} 张牌面（大阿卡纳 + 小阿卡纳）到 public/static/cards/`);

  const svgPath = path.join(OUT_DIR, 'bac.svg');
  if (fs.existsSync(svgPath)) {
    console.log('牌背：使用现有 bac.svg（用户自定义素材，不会覆盖）');
  } else {
    await downloadCardBack();
  }

  console.log('提示：可删除 cards.zip 以减小仓库体积（可选）');
}

main().catch((err) => {
  console.error('下载失败:', err.message);
  process.exit(1);
});

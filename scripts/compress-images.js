/**
 * 压缩 public/static/cards 下的牌面 JPG（本地维护用，不加入 Vercel build）
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = path.join(__dirname, '..', 'public', 'static', 'cards');
const WIDTH = 350;
const QUALITY = 78;

async function main() {
  const files = fs.readdirSync(DIR).filter((f) => /\.jpe?g$/i.test(f)).sort();
  if (files.length === 0) {
    console.error('未找到 JPG 文件:', DIR);
    process.exit(1);
  }

  let before = 0;
  let after = 0;

  for (const name of files) {
    const fp = path.join(DIR, name);
    before += fs.statSync(fp).size;
    const buf = await sharp(fp)
      .resize({ width: WIDTH, withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toBuffer();
    fs.writeFileSync(fp, buf);
    after += buf.length;
    process.stdout.write('.');
  }

  console.log(
    `\n已压缩 ${files.length} 张: ${(before / 1024 / 1024).toFixed(2)} MB → ${(after / 1024 / 1024).toFixed(2)} MB`
  );
}

main().catch((err) => {
  console.error('压缩失败:', err.message);
  process.exit(1);
});

/**
 * 根据 tarot-images.json + card-meanings.js 生成 data/cards.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const tarotImages = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'tarot-images.json'), 'utf-8')
);
const meanings = require(path.join(ROOT, 'data', 'card-meanings.js'));

const SUIT_MAP = {
  Cups: 'cups',
  Swords: 'swords',
  Wands: 'wands',
  Pentacles: 'pentacles',
};

const SUIT_CN = {
  cups: '圣杯',
  swords: '宝剑',
  wands: '权杖',
  pentacles: '星币',
};

const RANK_CN = {
  1: '王牌',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '七',
  8: '八',
  9: '九',
  10: '十',
  11: '侍从',
  12: '骑士',
  13: '王后',
  14: '国王',
};

const MAJOR_CN = [
  '愚者',
  '魔术师',
  '女祭司',
  '皇后',
  '皇帝',
  '教皇',
  '恋人',
  '战车',
  '力量',
  '隐者',
  '命运之轮',
  '正义',
  '倒吊人',
  '死神',
  '节制',
  '恶魔',
  '塔',
  '星星',
  '月亮',
  '太阳',
  '审判',
  '世界',
];

function cardIdFromImg(img) {
  return img.replace(/\.jpg$/i, '');
}

function buildName(entry, id) {
  if (entry.arcana === 'Major Arcana') {
    const n = parseInt(entry.number, 10);
    return MAJOR_CN[n] ?? entry.name;
  }
  const suit = SUIT_MAP[entry.suit];
  const rank = parseInt(entry.number, 10);
  const suitName = SUIT_CN[suit];
  const rankName = RANK_CN[rank];
  return `${suitName}${rankName}`;
}

function buildCard(entry) {
  const id = cardIdFromImg(entry.img);
  const text = meanings[id];
  if (!text) {
    throw new Error(`缺少解读: ${id}`);
  }
  const isMajor = entry.arcana === 'Major Arcana';
  return {
    id,
    name: buildName(entry, id),
    arcana: isMajor ? 'major' : 'minor',
    suit: isMajor ? null : SUIT_MAP[entry.suit],
    rank: parseInt(entry.number, 10),
    image: `/images/cards/${id}.jpg`,
    keywords: text.keywords,
    meaning: text.meaning,
    keywordsReversed: text.keywordsReversed,
    meaningReversed: text.meaningReversed,
  };
}

const cards = tarotImages.cards.map(buildCard);
cards.sort((a, b) => a.id.localeCompare(b.id));

if (cards.length !== 78) {
  throw new Error(`应为 78 张，实际 ${cards.length} 张`);
}

const outPath = path.join(ROOT, 'data', 'cards.json');
fs.writeFileSync(outPath, JSON.stringify(cards, null, 2) + '\n', 'utf-8');
console.log(`已写入 ${outPath}，共 ${cards.length} 张`);
console.log('78 cards OK');

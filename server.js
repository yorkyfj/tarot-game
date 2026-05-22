const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

const cardsPath = path.join(__dirname, 'data', 'cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));

const REQUIRED_FIELDS = [
  'id',
  'name',
  'arcana',
  'image',
  'keywords',
  'meaning',
  'keywordsReversed',
  'meaningReversed',
];

function validateCards(deck) {
  if (!Array.isArray(deck)) {
    throw new Error('cards.json 必须是数组');
  }
  if (deck.length !== 78) {
    throw new Error(`牌库应为 78 张，实际 ${deck.length} 张`);
  }
  for (const card of deck) {
    for (const field of REQUIRED_FIELDS) {
      const val = card[field];
      if (val === undefined || val === null || String(val).trim() === '') {
        throw new Error(`牌 ${card.id ?? '?'} 缺少或为空字段: ${field}`);
      }
    }
    if (!['major', 'minor'].includes(card.arcana)) {
      throw new Error(`牌 ${card.id} arcana 无效`);
    }
  }
}

try {
  validateCards(cards);
} catch (err) {
  console.error('牌库校验失败:', err.message);
  process.exit(1);
}

function drawRandomCard() {
  const index = Math.floor(Math.random() * cards.length);
  return cards[index];
}

function pickText(card, reversed) {
  return reversed
    ? { keywords: card.keywordsReversed, meaning: card.meaningReversed }
    : { keywords: card.keywords, meaning: card.meaning };
}

function buildMessage(card, reversed) {
  const displayName = reversed ? `${card.name}（逆位）` : card.name;
  const text = pickText(card, reversed);
  return `你抽到了「${displayName}」：${text.keywords}。${text.meaning}`;
}

app.use(express.json());
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    etag: true,
  })
);

app.get('/api/cards', (req, res) => {
  const major = cards.filter((c) => c.arcana === 'major').length;
  const minor = cards.filter((c) => c.arcana === 'minor').length;
  res.json({
    count: cards.length,
    total: cards.length,
    major,
    minor,
    names: cards.map((c) => c.name),
  });
});

app.post('/api/draw', (req, res) => {
  const allowReversed = Boolean(req.body?.allowReversed);
  const card = drawRandomCard();
  const reversed = allowReversed && Math.random() < 0.5;
  const text = pickText(card, reversed);
  const displayName = reversed ? `${card.name}（逆位）` : card.name;

  res.json({
    id: card.id,
    name: card.name,
    reversed,
    displayName,
    arcana: card.arcana,
    suit: card.suit ?? null,
    image: card.image,
    keywords: text.keywords,
    meaning: text.meaning,
    message: buildMessage(card, reversed),
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`塔罗牌预测服务已启动：http://localhost:${PORT}`);
  });
}

module.exports = app;


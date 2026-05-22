const cardEl = document.getElementById('card');
const cardImgEl = document.getElementById('card-img');
const cardNameEl = document.getElementById('card-name');
const readingNameEl = document.getElementById('reading-name');
const readingEl = document.getElementById('reading');
const keywordsEl = document.getElementById('keywords');
const meaningEl = document.getElementById('meaning');
const messageEl = document.getElementById('message');
const hintEl = document.getElementById('hint');
const errorMsgEl = document.getElementById('error-msg');
const drawBtn = document.getElementById('draw-btn');
const clearBtn = document.getElementById('clear-btn');
const allowReversedEl = document.getElementById('allow-reversed');

let busy = false;

function showError(msg) {
  if (!msg) {
    errorMsgEl.hidden = true;
    errorMsgEl.textContent = '';
    return;
  }
  errorMsgEl.hidden = false;
  errorMsgEl.textContent = msg;
}

function showNameFallback(name) {
  cardNameEl.textContent = name;
  cardNameEl.classList.remove('hidden');
  cardImgEl.hidden = true;
}

function showCardImage(image, name) {
  cardNameEl.classList.add('hidden');
  cardImgEl.alt = name;
  cardImgEl.hidden = false;
  cardImgEl.onload = () => {
    cardNameEl.classList.add('hidden');
  };
  cardImgEl.onerror = () => showNameFallback(name);
  cardImgEl.src = image;
}

function resetUI() {
  cardEl.classList.remove('flipped');
  cardImgEl.classList.remove('reversed');
  cardImgEl.removeAttribute('src');
  cardImgEl.hidden = true;
  cardNameEl.textContent = '—';
  cardNameEl.classList.remove('hidden');
  readingEl.hidden = true;
  readingNameEl.textContent = '';
  hintEl.textContent = '点击下方按钮抽牌';
  showError('');
}

function showReading(data) {
  const title = data.displayName ?? data.name;
  readingNameEl.textContent = title;
  keywordsEl.textContent = data.keywords;
  meaningEl.textContent = data.meaning;
  messageEl.textContent = data.message;
  readingEl.hidden = false;
  hintEl.textContent = '可再次抽牌，结果会更新';

  cardImgEl.classList.toggle('reversed', !!data.reversed);

  if (data.image) {
    showCardImage(data.image, title);
  } else {
    showNameFallback(data.name);
  }
}

async function draw() {
  if (busy) return;
  busy = true;
  drawBtn.disabled = true;
  showError('');

  try {
    const res = await fetch('/api/draw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowReversed: allowReversedEl.checked }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || '抽牌失败，请重试');
    }

    cardEl.classList.remove('flipped');
    await new Promise((r) => setTimeout(r, 300));

    showReading(data);
    cardEl.classList.add('flipped');
  } catch (e) {
    showError(e.message);
  } finally {
    busy = false;
    drawBtn.disabled = false;
  }
}

drawBtn.addEventListener('click', draw);
clearBtn.addEventListener('click', resetUI);

resetUI();

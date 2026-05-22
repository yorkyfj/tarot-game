const cardEl = document.getElementById('card');
const cardFrontEl = document.querySelector('.card-front');
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

const PLACEHOLDER_IMAGE = '/static/placeholder-card.svg';
const FLIP_MS = 300;
const TEXT_REVEAL_MS = 400;
const IMAGE_LOAD_TIMEOUT_MS = 20000;

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

/** 立刻清空正面，避免再次抽牌时仍显示上一张图 */
function clearCardFace() {
  cardImgEl.classList.remove('reversed', 'is-ready');
  cardImgEl.removeAttribute('src');
  cardImgEl.hidden = true;
  cardNameEl.textContent = '…';
  cardNameEl.classList.remove('hidden');
  cardFrontEl?.classList.remove('is-loading');
}

function showNameFallback(name) {
  cardImgEl.classList.remove('is-ready');
  cardImgEl.hidden = true;
  cardImgEl.removeAttribute('src');
  cardNameEl.textContent = name;
  cardNameEl.classList.remove('hidden');
}

function showReadingLoading() {
  readingEl.hidden = false;
  readingEl.classList.add('is-loading');
  readingNameEl.textContent = '正在抽牌…';
  keywordsEl.textContent = '';
  meaningEl.textContent = '';
  messageEl.textContent = '';
  hintEl.textContent = '正在为你抽取塔罗牌…';
}

function hideReadingLoading() {
  readingEl.classList.remove('is-loading');
}

function updateReadingText(data) {
  const title = data.displayName ?? data.name;
  readingNameEl.textContent = title;
  keywordsEl.textContent = data.keywords;
  meaningEl.textContent = data.meaning;
  messageEl.textContent = data.message;
  readingEl.hidden = false;
  readingEl.classList.remove('is-loading');
}

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      reject(new Error('timeout'));
    }, IMAGE_LOAD_TIMEOUT_MS);

    img.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('error'));
    };
    img.src = url;
  });
}

function applyCardImage(image, title, reversed) {
  cardImgEl.classList.toggle('reversed', !!reversed);
  cardNameEl.classList.add('hidden');
  cardImgEl.alt = title;
  cardImgEl.hidden = false;
  cardImgEl.classList.remove('is-ready');

  cardImgEl.onerror = () => {
    const src = cardImgEl.getAttribute('src') || '';
    if (src !== PLACEHOLDER_IMAGE && !src.endsWith(PLACEHOLDER_IMAGE)) {
      cardImgEl.onerror = () => showNameFallback(title);
      cardImgEl.src = PLACEHOLDER_IMAGE;
      cardImgEl.classList.add('is-ready');
      return;
    }
    showNameFallback(title);
  };

  cardImgEl.onload = () => {
    cardImgEl.classList.add('is-ready');
    cardNameEl.classList.add('hidden');
  };

  // 预加载完成后赋值，浏览器通常立即从缓存显示
  cardImgEl.src = image;
  if (cardImgEl.complete && cardImgEl.naturalWidth > 0) {
    cardImgEl.classList.add('is-ready');
    cardNameEl.classList.add('hidden');
  }
}

async function revealCardFace(data, imagePreloaded = false) {
  const title = data.displayName ?? data.name;

  if (!data.image) {
    showNameFallback(data.name);
    return;
  }

  try {
    if (!imagePreloaded) {
      await preloadImage(data.image);
    }
    applyCardImage(data.image, title, data.reversed);
  } catch {
    try {
      await preloadImage(PLACEHOLDER_IMAGE);
      applyCardImage(PLACEHOLDER_IMAGE, title, false);
    } catch {
      showNameFallback(title);
    }
  }
}

function resetUI() {
  cardEl.classList.remove('flipped');
  clearCardFace();
  readingEl.hidden = true;
  readingEl.classList.remove('is-loading');
  readingNameEl.textContent = '';
  hintEl.textContent = '点击下方按钮抽牌';
  showError('');
}

async function draw() {
  if (busy) return;
  busy = true;
  drawBtn.disabled = true;
  showError('');

  clearCardFace();
  cardEl.classList.remove('flipped');
  showReadingLoading();

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

    let imagePreloaded = false;
    const preloadPromise = data.image
      ? preloadImage(data.image)
          .then(() => {
            imagePreloaded = true;
          })
          .catch(() => {})
      : Promise.resolve();

    await Promise.all([
      new Promise((r) => setTimeout(r, FLIP_MS)),
      preloadPromise,
    ]);

    cardFrontEl?.classList.add('is-loading');
    await revealCardFace(data, imagePreloaded);
    cardFrontEl?.classList.remove('is-loading');

    cardEl.classList.add('flipped');
    await new Promise((r) => setTimeout(r, TEXT_REVEAL_MS));

    hideReadingLoading();
    updateReadingText(data);
    hintEl.textContent = '可再次抽牌，结果会更新';
  } catch (e) {
    readingEl.hidden = true;
    readingEl.classList.remove('is-loading');
    showError(e.message);
  } finally {
    busy = false;
    drawBtn.disabled = false;
  }
}

drawBtn.addEventListener('click', draw);
clearBtn.addEventListener('click', resetUI);

resetUI();

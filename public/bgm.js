/**
 * 背景音乐：默认关闭，点击右上角图标开关，淡入淡出，播放时图标旋转
 */
(function () {
  const btn = document.getElementById('music-toggle');
  const audio = document.getElementById('bgm');
  if (!btn || !audio) return;

  const FADE_MS = 800;
  const MAX_VOLUME = 0.35;

  let playing = false;
  let fadeRaf = null;

  audio.volume = 0;
  audio.loop = true;

  function cancelFade() {
    if (fadeRaf) {
      cancelAnimationFrame(fadeRaf);
      fadeRaf = null;
    }
  }

  function fadeTo(target, ms, onDone) {
    cancelFade();
    const start = audio.volume;
    const delta = target - start;
    if (ms <= 0 || Math.abs(delta) < 0.001) {
      audio.volume = target;
      onDone?.();
      return;
    }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      audio.volume = start + delta * p;
      if (p < 1) {
        fadeRaf = requestAnimationFrame(step);
      } else {
        fadeRaf = null;
        audio.volume = target;
        onDone?.();
      }
    };
    fadeRaf = requestAnimationFrame(step);
  }

  function setPlayingState(on) {
    playing = on;
    btn.classList.toggle('is-playing', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? '关闭背景音乐' : '开启背景音乐');
  }

  async function turnOn() {
    try {
      audio.currentTime = 0;
      audio.volume = 0;
      await audio.play();
      setPlayingState(true);
      fadeTo(MAX_VOLUME, FADE_MS);
    } catch {
      audio.pause();
      setPlayingState(false);
    }
  }

  function turnOff() {
    cancelFade();
    fadeTo(0, FADE_MS, () => {
      audio.pause();
      audio.currentTime = 0;
      setPlayingState(false);
    });
  }

  btn.addEventListener('click', () => {
    if (playing) {
      turnOff();
    } else {
      turnOn();
    }
  });
})();

'use strict';
// Игра для отдыха «Прыжки Пинки»: прыгай по облачкам всё выше.
// Управление: держи палец на левой/правой половине поля или наклоняй телефон (стрелки на клавиатуре — для компьютера).
// Звёзды: +1 ⭐ за 300, 1000 и 2000 м в одной игре (общий дневной предел ECON.cap на все игры для отдыха).
// Скорость: всё, что можно, рисуется один раз заранее (jpSprite), а в кадре только копируется на экран.
// Рисовать SVG и эмодзи заново в каждом кадре на iPhone очень дорого. Подключается до app.js.

const JP = { G: 1900, JUMP: 900, SPRING: 1500, ROCKET: 1250, ROCKET_T: 2.2, VX: 400, PS: 52, MILES: [300, 1000, 2000] };
const JP_SKY = [ // [доля высоты, цвет вверху, цвет внизу]
  [0, [255, 214, 232], [255, 244, 249]],
  [0.3, [208, 191, 255], [255, 214, 232]],
  [0.65, [95, 61, 196], [177, 151, 252]],
  [1, [27, 16, 64], [75, 42, 153]],
];
const JP_PLAT = { n: ['#ffa8cf', '#ff5fa2'], m: ['#d0bfff', '#9775fa'], b: ['#e9c9a8', '#c99b74'], v: ['#ffffff', '#ffe3ef'] };
const JP_FONT = '900 18px ui-rounded, system-ui, sans-serif';
const jpImg = new Image();
jpImg.src = 'img/pinky.svg';
let jpQuality = 0;   // 0 — лучшее качество; снижается само, если телефон не успевает
const jpCache = { sc: 0, map: new Map(), sheet: null, ctx: null, cx: 0, cy: 0, rowH: 0 };
const JP_SHEET = 512;   // сторона общего листа с картинками

function jpSky(k) {
  let i = 0;
  while (i < JP_SKY.length - 2 && k > JP_SKY[i + 1][0]) i++;
  const [a, t0, b0] = JP_SKY[i], [b, t1, b1] = JP_SKY[i + 1], f = Math.max(0, Math.min(1, (k - a) / (b - a)));
  const mix = (x, y) => `rgb(${x.map((v, j) => Math.round(v + (y[j] - v) * f)).join(',')})`;
  return [mix(t0, t1), mix(b0, b1)];
}
function jpRound(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ═════════════ Картинки, нарисованные заранее ═════════════
function jpCanvas(w, h, sc) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * sc));
  c.height = Math.max(1, Math.ceil(h * sc));
  const x = c.getContext('2d');
  x.scale(sc, sc);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  return [c, x];
}
// отдельная большая картинка
function jpBig(w, h, sc, paint) {
  const [c, x] = jpCanvas(w, h, sc);
  paint(x);
  return { c, sx: 0, sy: 0, sw: c.width, sh: c.height, w, h };
}
// маленькая картинка: кладётся на общий лист. Один лист телефону обрабатывать проще, чем десятки отдельных холстов.
function jpSprite(w, h, sc, paint) {
  const a = jpCache, bw = Math.ceil(w) + 3, bh = Math.ceil(h) + 3;
  if (!a.sheet) { [a.sheet, a.ctx] = jpCanvas(JP_SHEET, JP_SHEET, sc); a.cx = a.cy = a.rowH = 0; }
  if (a.cx + bw > JP_SHEET) { a.cx = 0; a.cy += a.rowH; a.rowH = 0; }
  if (a.cy + bh > JP_SHEET) return jpBig(w, h, sc, paint); // лист заполнен
  const x0 = a.cx + 1, y0 = a.cy + 1, x = a.ctx;
  a.cx += bw; a.rowH = Math.max(a.rowH, bh);
  x.save();
  x.beginPath(); x.rect(x0, y0, w, h); x.clip();
  x.translate(x0, y0);
  paint(x);
  x.restore();
  return { c: a.sheet, sx: x0 * sc, sy: y0 * sc, sw: w * sc, sh: h * sc, w, h };
}
// один раз на ключ: повторные игры берут готовое
function jpOnce(sc, key, make) {
  if (jpCache.sc !== sc) { jpCache.sc = sc; jpCache.map.clear(); jpCache.sheet = null; }
  let s = jpCache.map.get(key);
  if (!s) { s = make(); jpCache.map.set(key, s); }
  return s;
}
const jpPlat = (t, w, sc) => jpOnce(sc, 'p' + t + w, () => jpSprite(w + 4, 18, sc, x => {
  x.translate(2, 2);
  const col = JP_PLAT[t], g = x.createLinearGradient(0, 0, 0, 14);
  g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
  x.fillStyle = g; jpRound(x, 0, 0, w, 14, 7); x.fill();
  if (t === 'v') { x.strokeStyle = '#ff9cc7'; x.setLineDash([4, 4]); x.lineWidth = 2; x.stroke(); x.setLineDash([]); }
  x.fillStyle = 'rgba(255,255,255,.55)'; jpRound(x, 6, 2, w - 12, 3, 1.5); x.fill();
  if (t === 'b') { x.strokeStyle = 'rgba(120,70,40,.5)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(w / 2, 1); x.lineTo(w / 2 - 4, 7); x.lineTo(w / 2 + 3, 13); x.stroke(); }
}));
const jpEmoji = (e, size, sc, rot = 0) => jpOnce(sc, 'e' + e + size + rot, () => {
  const box = Math.ceil(size * 1.6);
  return jpSprite(box, box, sc, x => { x.translate(box / 2, box / 2); if (rot) x.rotate(rot); x.font = size + 'px system-ui, sans-serif'; x.fillText(e, 0, 0); });
});
const jpText = (txt, color, sc) => jpOnce(sc, 't' + txt + color, () => {
  const m = document.createElement('canvas').getContext('2d');
  m.font = JP_FONT;
  const w = Math.ceil(m.measureText(txt).width) + 14;
  return jpSprite(w, 30, sc, x => {
    x.font = JP_FONT; x.lineWidth = 4; x.lineJoin = 'round'; x.strokeStyle = '#fff';
    x.strokeText(txt, w / 2, 15);
    x.fillStyle = color; x.fillText(txt, w / 2, 15);
  });
});
const jpDot = (color, sc) => jpOnce(sc, 'd' + color, () => jpSprite(16, 16, sc, x => {
  const g = x.createRadialGradient(8, 8, 0, 8, 8, 8);
  g.addColorStop(0, color); g.addColorStop(0.6, color); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 16, 16);
}));
const jpCloud = sc => jpOnce(sc, 'cloud', () => jpSprite(128, 82, sc, x => {
  const s = 30;
  x.translate(32, 50);
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(0, 0, s, 0, 7); x.arc(s * 1.1, -s * 0.4, s * 1.2, 0, 7); x.arc(s * 2.2, 0, s * 0.9, 0, 7); x.fill();
}));
const jpCoil = sc => jpOnce(sc, 'coil', () => jpSprite(18, 22, sc, x => {
  x.strokeStyle = '#868e96'; x.lineWidth = 2.5;
  x.beginPath();
  for (let i = 0; i <= 4; i++) x.lineTo(i % 2 ? 4 : 14, 22 - 5.5 * i);
  x.stroke();
}));
const jpCap = sc => jpOnce(sc, 'cap', () => jpSprite(18, 6, sc, x => { x.fillStyle = '#ffd43b'; jpRound(x, 0, 0, 18, 6, 3); x.fill(); }));
// всё заранее, чтобы в игре ничего не рисовалось впервые посреди прыжка
function jpWarm(sc) {
  for (const t of ['n', 'm', 'b', 'v']) for (const w of [56, 60, 64, 68]) jpPlat(t, w, sc);
  for (const c of ['#ff8fc0', '#b197fc', '#ffc2dc', '#c99b74', '#ffd43b', '#ff922b']) jpDot(c, sc);
  jpEmoji('🍬', 24, sc); jpEmoji('🚀', 30, sc, -Math.PI / 4); jpEmoji('🚀', 34, sc, -Math.PI / 4);
  jpCloud(sc); jpCoil(sc); jpCap(sc);
  for (const [t, c] of [['Пружинка!', '#7048e8'], ['Ракета! 🚀', '#e8590c'], ['+1 🍬', '#e64993'], ['+1 ⭐', '#f08c00'], ['Новый рекорд! 🏆', '#e64993'], ['🏆 рекорд', '#e64993']]) jpText(t, c, sc);
}

// ═════════════ Стартовый экран ═════════════
function jump() {
  const st = (S.gm.jump = S.gm.jump || { best: 0, runs: 0 });
  app.innerHTML = `<div class="screen">${header('🚀 Прыжки Пинки', '#games')}
    <div class="jp-demo" aria-hidden="true"><i class="c1"></i><i class="c2"></i><i class="c3"></i><img src="img/pinky.svg" alt=""></div>
    ${mascotHTML('Прыгай по облачкам всё выше! Розовые — обычные, сиреневые ездят, коричневые ломаются, а белые исчезают. Пружинка и ракета подбросят высоко!')}
    <div class="card g-rules"><b>🏆 Рекорд: ${U.fmt(st.best || 0)} м</b><span>⭐ +1 за ${JP.MILES.map(U.fmt).join(', ')} м</span>
      <span>${gameStarsLeft() ? `Сегодня из игр для отдыха можно получить ещё ${gameStarsLeft()} ⭐` : 'Звёзды из игр на сегодня собраны — играем для удовольствия'}</span></div>
    <div class="tabs"><button class="tab ${st.tilt ? '' : 'on'}" data-ctrl="touch">👆 Пальцем</button><button class="tab ${st.tilt ? 'on' : ''}" data-ctrl="tilt">📱 Наклоном</button></div>
    <p class="muted center">${st.tilt ? 'Наклоняй телефон влево и вправо' : 'Держи палец на левой или правой половине экрана'}</p>
    <button class="btn big wide" data-act="play">Играть!</button></div>`;
  const askTilt = () => {
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === 'function') return D.requestPermission().then(r => r === 'granted').catch(() => false);
    return Promise.resolve(!!D);
  };
  later(() => jpWarm(Math.min(2, window.devicePixelRatio || 1)), 250); // картинки готовим, пока Лиза читает правила
  app.onclick = e => {
    const c = e.target.closest('[data-ctrl]');
    if (c) {
      sfx('tap');
      if (c.dataset.ctrl === 'touch') { st.tilt = false; save(); jump(); return; }
      askTilt().then(ok => { st.tilt = ok; save(); if (!ok) toast('Наклон не разрешён — играем пальцем'); jump(); });
      return;
    }
    if (e.target.closest('[data-act="play"]')) {
      sfx('tap');
      if (st.tilt) askTilt().then(() => jumpRun()); else jumpRun();
    }
  };
}

// ═════════════ Игра ═════════════
function jumpRun() {
  stopTimers(); leaveGame();
  const st = (S.gm.jump = S.gm.jump || { best: 0, runs: 0 });
  const best0 = st.best || 0;
  st.runs = (st.runs || 0) + 1; save();
  app.innerHTML = `<div class="screen jp-screen">
    <header class="top"><button class="icon-btn" data-go="#games" aria-label="Выйти">✕</button>
      <div class="g-score"><b id="jps">0 м</b><small>🏆 ${U.fmt(best0)} м</small></div><div class="pill">⭐ ${bal()}</div></header>
    <div class="g-goal" id="jpg"></div>
    <div class="jp-field" id="jpf"><canvas></canvas><div class="jp-hint l">◀</div><div class="jp-hint r">▶</div></div></div>`;
  const field = document.getElementById('jpf'), cv = field.querySelector('canvas'), ctx = cv.getContext('2d');
  const W = field.clientWidth || 360, H = field.clientHeight || Math.max(400, window.innerHeight - 150);
  const dpr = window.devicePixelRatio || 1, QS = [Math.min(2, dpr), Math.min(1.5, dpr), Math.min(1.25, dpr)], SC = QS[0];
  const applyQuality = () => {
    const sc = QS[jpQuality];
    cv.width = Math.round(W * sc); cv.height = Math.round(H * sc);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(sc, 0, 0, sc, 0, 0);
  };
  applyQuality();
  jpWarm(SC);

  const PS = JP.PS, startY = H - 40;
  const pl = { x: W / 2, y: startY, vx: 0, vy: -JP.JUMP, squash: 0, rocket: 0 };
  const plats = [{ x: -10, y: startY, w: W + 20, t: 'g', vx: 0, a: 1 }], items = [], texts = [];
  let topY = startY, cam = 0, score = 0, candies = 0, mile = 0, got = 0, over = false, alive = true, paused = false;
  let dir = 0, tilt = null, raf = 0, last = performance.now(), recShown = false, t = 0, hudT = 0, hudScore = -1;
  const sEl = document.getElementById('jps'), goalEl = document.getElementById('jpg');
  // счёт и полоску обновляем несколько раз в секунду: каждый кадр это лишний пересчёт страницы
  const hud = () => {
    if (score === hudScore) return;
    hudScore = score;
    sEl.textContent = U.fmt(score) + ' м';
    setGoal(goalEl, score, JP.MILES, mile, got, 'м');
  };
  setGoal(goalEl, 0, JP.MILES, 0, 0, 'м');
  later(() => field.querySelectorAll('.jp-hint').forEach(x => x.remove()), 4200);

  // заранее нарисованное для этой игры
  const cloud = jpCloud(SC), coil = jpCoil(SC), cap = jpCap(SC);
  const candy = jpEmoji('🍬', 24, SC), rocketItem = jpEmoji('🚀', 30, SC, -Math.PI / 4), rocketOn = jpEmoji('🚀', 34, SC, -Math.PI / 4), recText = jpText('🏆 рекорд', '#e64993', SC);
  const blit = (s, x, y, w, h) => ctx.drawImage(s.c, s.sx, s.sy, s.sw, s.sh, x, y, w, h);
  const ground = jpBig(W + 20, 60, SC, x => {
    const g = x.createLinearGradient(0, 0, 0, 40);
    g.addColorStop(0, '#ff8fc0'); g.addColorStop(1, '#ffc2dc');
    x.fillStyle = g; jpRound(x, 0, 0, W + 20, 60, 16); x.fill();
  });
  let pinky = null;
  const hat = (S.equip || {}).head && ITEM[S.equip.head] ? ITEM[S.equip.head].e : '';
  const getPinky = () => {
    if (pinky || !jpImg.complete) return pinky;
    try {
      pinky = jpOnce(SC, 'pinky' + hat, () => jpSprite(PS + 12, PS + 28, SC, x => {
        x.translate(PS / 2 + 6, PS + 24);
        x.drawImage(jpImg, -PS / 2, -PS, PS, PS);
        if (hat) { x.font = '20px system-ui, sans-serif'; x.fillText(hat, 0, -PS - 2); }
      }));
    } catch (e) { /* картинка ещё не готова */ }
    return pinky;
  };
  getPinky();

  // фон: облака и звёзды (повторяются по высоте)
  const clouds = Array.from({ length: 7 }, (_, i) => ({ x: Math.random() * W, y: i * 200 + Math.random() * 120, s: 0.6 + Math.random() * 0.8 }));
  const stars = Array.from({ length: 56 }, () => ({ x: Math.random() * W, y: Math.random() * 1000, r: 1.2 + Math.random() * 1.5 }));

  // частицы: постоянный запас, новые объекты в игре не создаются (меньше работы сборщику мусора — меньше рывков)
  const POOL = 36, parts = Array.from({ length: POOL }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, r: 0, img: null }));
  let pNext = 0;
  const spawn = (x, y, vx, vy, life, r, color) => {
    const q = parts[pNext];
    pNext = (pNext + 1) % POOL;
    q.x = x; q.y = y; q.vx = vx; q.vy = vy; q.life = q.max = life; q.r = r; q.img = jpDot(color, SC);
  };
  const puff = (x, y, color, n = 7, up = false) => {
    for (let i = 0; i < n; i++) {
      const a = up ? -Math.PI / 2 + (Math.random() - 0.5) * 1.6 : Math.PI + Math.random() * Math.PI;
      const v = 60 + Math.random() * 120;
      spawn(x, y, Math.cos(a) * v, Math.sin(a) * v * (up ? 1.4 : 0.5), 0.5, 3 + Math.random() * 3, color);
    }
  };
  const say = (txt, x, y, c = '#e64993') => texts.push({ s: jpText(txt, c, SC), x, y, life: 1 });
  const toScreen = (x, y) => { const r = field.getBoundingClientRect(); return { x: r.left + x, y: r.top + y - cam }; };

  const diff = () => Math.min(1, (startY - topY) / 25000);
  const gen = () => {
    const d = diff(), gap = 55 + d * 45 + Math.random() * (40 + d * 40);
    topY -= gap;
    const w = Math.round((66 - d * 12) / 4) * 4, r = Math.random();
    let tp = 'n';
    if (r < 0.06 + d * 0.28) tp = 'm';
    else if (startY - topY > 1500 && r < 0.1 + d * 0.38) tp = 'v';
    const p = { x: Math.random() * (W - w), y: topY, w, t: tp, vx: tp === 'm' ? (Math.random() < 0.5 ? -1 : 1) * (45 + d * 95) : 0, a: 1, img: jpPlat(tp, w, SC) };
    if (tp === 'n' && startY - topY > 400 && Math.random() < 0.08) p.spr = { dx: 8 + Math.random() * (w - 34), k: 0 };
    plats.push(p);
    if (startY - topY > 900 && Math.random() < 0.12 + d * 0.28) {
      plats.push({ x: Math.random() * (W - w), y: topY + gap * (0.35 + Math.random() * 0.3), w, t: 'b', vx: 0, a: 1, img: jpPlat('b', w, SC) });
    }
    if (Math.random() < 0.16) items.push({ k: 'candy', x: 20 + Math.random() * (W - 40), y: topY - 40 - Math.random() * 30, ph: Math.random() * 6 });
    if (startY - topY > 2500 && Math.random() < 0.022) items.push({ k: 'rocket', x: p.x + p.w / 2, y: p.y - 26, ph: 0 });
  };

  // ── управление ──
  const pointers = new Map();
  const setDir = () => { const v = [...pointers.values()]; dir = v.length ? v[v.length - 1] : 0; };
  let fieldLeft = field.getBoundingClientRect().left;
  const side = e => (e.clientX - fieldLeft < W / 2 ? -1 : 1);
  const onDown = e => {
    if (paused) { paused = false; last = performance.now(); field.querySelectorAll('.jp-pause').forEach(x => x.remove()); return; }
    pointers.set(e.pointerId, side(e)); setDir();
  };
  const onMove = e => {
    if (!pointers.has(e.pointerId)) return;
    const s = side(e);
    if (pointers.get(e.pointerId) !== s) { pointers.set(e.pointerId, s); setDir(); }
  };
  const onUp = e => { pointers.delete(e.pointerId); setDir(); };
  const keys = {};
  const onKey = e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    keys[e.key] = e.type === 'keydown';
    dir = keys.ArrowLeft && !keys.ArrowRight ? -1 : keys.ArrowRight && !keys.ArrowLeft ? 1 : pointers.size ? dir : 0;
  };
  const onTilt = e => { if (typeof e.gamma === 'number') tilt = e.gamma; };
  const onVis = () => {
    if (document.visibilityState === 'hidden' && !over && !paused) {
      paused = true;
      const p = document.createElement('div');
      p.className = 'jp-pause'; p.innerHTML = '<b>Пауза</b><span>Нажми, чтобы продолжить</span>';
      field.appendChild(p);
    }
  };
  const onResize = () => { fieldLeft = field.getBoundingClientRect().left; };
  field.addEventListener('pointerdown', onDown);
  field.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  window.addEventListener('resize', onResize);
  if (st.tilt) window.addEventListener('deviceorientation', onTilt);
  document.addEventListener('visibilitychange', onVis);
  onLeave(() => {
    alive = false; cancelAnimationFrame(raf);
    window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
    window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('deviceorientation', onTilt);
    document.removeEventListener('visibilitychange', onVis);
  });

  // ── шаг игры ──
  const update = dt => {
    t += dt;
    if (!over) {
      let target = dir * JP.VX;
      if (!dir && tilt !== null) target = Math.max(-1, Math.min(1, tilt / 22)) * JP.VX;
      pl.vx += (target - pl.vx) * Math.min(1, dt * 9);
      pl.x += pl.vx * dt;
      if (pl.x < 0) pl.x += W;
      if (pl.x > W) pl.x -= W;
      const oldY = pl.y;
      if (pl.rocket > 0) {
        pl.rocket -= dt; pl.vy = -JP.ROCKET; pl.y += pl.vy * dt;
        if (Math.random() < 0.8) spawn(pl.x + (Math.random() - 0.5) * 10, pl.y + 4, (Math.random() - 0.5) * 60, 160 + Math.random() * 120, 0.45, 4 + Math.random() * 3, Math.random() < 0.5 ? '#ffd43b' : '#ff922b');
      } else {
        // точная формула: высота прыжка не зависит от частоты кадров
        pl.y += pl.vy * dt + 0.5 * JP.G * dt * dt;
        pl.vy += JP.G * dt;
      }
      pl.squash = Math.max(0, pl.squash - dt * 5);
      // приземление на облачко
      if (pl.vy > 0) {
        for (let i = 0; i < plats.length; i++) {
          const p = plats[i];
          if (p.gone || p.broken || p.vanish) continue;
          if (oldY <= p.y && pl.y >= p.y && pl.x + 15 > p.x && pl.x - 15 < p.x + p.w) {
            if (p.t === 'b') { p.broken = true; sfx('wrong'); puff(p.x + p.w / 2, p.y + 6, '#c99b74', 6); continue; }
            pl.y = p.y;
            const onSpring = p.spr && pl.x > p.x + p.spr.dx - 8 && pl.x < p.x + p.spr.dx + 26;
            pl.vy = -(onSpring ? JP.SPRING : JP.JUMP);
            pl.squash = 1;
            if (onSpring) { p.spr.k = 1; sfx('spring'); say('Пружинка!', pl.x, p.y - 70, '#7048e8'); }
            else sfx('jump');
            puff(pl.x, p.y, p.t === 'm' ? '#b197fc' : p.t === 'v' ? '#ffc2dc' : '#ff8fc0');
            if (p.t === 'v') p.vanish = true;
            break;
          }
        }
      }
      // конфеты и ракета
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.got) continue;
        if (Math.abs(pl.x - it.x) < 28 && Math.abs(pl.y - PS / 2 - it.y) < 34) {
          it.got = true;
          if (it.k === 'candy') { candies++; sfx('candy'); puff(it.x, it.y, '#ffd43b', 8, true); say('+1 🍬', it.x, it.y - 20); }
          else { pl.rocket = Math.max(pl.rocket, JP.ROCKET_T); sfx('spring', 0.7); say('Ракета! 🚀', W / 2, pl.y - 90, '#e8590c'); }
        }
      }
      // камера и высота
      const want = pl.y - H * 0.42;
      if (want < cam) cam = want;
      const h = Math.max(0, Math.floor((startY - pl.y) / 10));
      if (h > score) {
        score = h;
        while (mile < JP.MILES.length && score >= JP.MILES[mile]) {
          mile++;
          const sp = toScreen(pl.x, pl.y - PS / 2);
          if (giveGameStar(sp)) { got++; sfx('star'); say('+1 ⭐', pl.x, pl.y - 80, '#f08c00'); }
          hudT = 0;
        }
        if (!recShown && best0 > 0 && score > best0) { recShown = true; say('Новый рекорд! 🏆', W / 2, pl.y - 110, '#e64993'); sfx('win'); }
      }
      if (t - hudT > 0.14) { hudT = t; hud(); }
      if (pl.y - PS > cam + H) finish();
    }
    // облачка
    for (let i = 0; i < plats.length; i++) {
      const p = plats[i];
      if (p.t === 'm') { p.x += p.vx * dt; if (p.x < 0) { p.x = 0; p.vx *= -1; } if (p.x + p.w > W) { p.x = W - p.w; p.vx *= -1; } }
      if (p.broken) { p.fall = (p.fall || 0) + dt; p.y += 260 * dt; p.a = Math.max(0, 1 - p.fall * 1.4); }
      if (p.vanish) { p.a -= dt * 3.5; if (p.a <= 0) p.gone = true; }
      if (p.spr && p.spr.k > 0) p.spr.k = Math.max(0, p.spr.k - dt * 3);
    }
    while (topY > cam - 120) gen();
    for (let i = plats.length - 1; i >= 0; i--) if (plats[i].y > cam + H + 80 || plats[i].gone) plats.splice(i, 1);
    for (let i = items.length - 1; i >= 0; i--) if (items[i].y > cam + H + 80 || items[i].got) items.splice(i, 1);
    for (let i = 0; i < POOL; i++) {
      const q = parts[i];
      if (q.life <= 0) continue;
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 300 * dt; q.life -= dt;
    }
    for (let i = texts.length - 1; i >= 0; i--) { texts[i].y -= 40 * dt; texts[i].life -= dt * 0.8; if (texts[i].life <= 0) texts.splice(i, 1); }
  };

  // ── рисование ──
  let skyQ = -1;
  const drawPinky = x => {
    const s = getPinky(), y = pl.y - cam, sq = pl.squash, st2 = pl.vy < 0 ? Math.min(1, -pl.vy / JP.JUMP) * 0.08 : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((pl.vx / JP.VX) * 0.2);
    ctx.scale(1 + 0.25 * sq - st2, 1 - 0.22 * sq + st2);
    if (pl.rocket > 0) blit(rocketOn, -rocketOn.w / 2, -12 - rocketOn.h / 2, rocketOn.w, rocketOn.h);
    if (s) blit(s, -(PS / 2 + 6), -(PS + 24), s.w, s.h);
    else { ctx.fillStyle = '#ff8fc0'; ctx.beginPath(); ctx.arc(0, -PS / 2, PS / 2.2, 0, 7); ctx.fill(); }
    ctx.restore();
  };
  const draw = () => {
    const k = Math.max(0, Math.min(1, (startY - (cam + H)) / 22000));
    // небо — это фон поля под прозрачным холстом: он меняется редко и не рисуется в каждом кадре
    const kq = Math.round(k * 160);
    if (kq !== skyQ) {
      skyQ = kq;
      const [c0, c1] = jpSky(kq / 160);
      field.style.background = `linear-gradient(${c0}, ${c1})`;
    }
    ctx.clearRect(0, 0, W, H);
    // звёзды (появляются высоко); две группы мерцают по очереди
    const sa = Math.max(0, Math.min(1, (k - 0.35) / 0.3));
    if (sa > 0) {
      const off = Math.abs(cam) * 0.15;
      ctx.fillStyle = '#fff';
      for (let g = 0; g < 2; g++) {
        ctx.globalAlpha = sa * (0.6 + 0.4 * Math.sin(t * 2 + g * 3.14));
        for (let i = g; i < stars.length; i += 2) {
          const s = stars[i], y = (s.y + off) % 1000;
          if (y < H) ctx.fillRect(s.x, y, s.r, s.r);
        }
      }
    }
    // облака на фоне (на самом низком качестве не рисуем)
    if (jpQuality < 2) {
      ctx.globalAlpha = 0.5 * (1 - sa * 0.75);
      for (let i = 0; i < clouds.length; i++) {
        const c = clouds[i], y = ((c.y - cam * 0.35) % 1400 + 1400) % 1400 - 100;
        if (y > H + 60) continue;
        const f = c.s * 22 / 30, x = (c.x + t * 8 * c.s) % (W + 160) - 80;
        blit(cloud, x - 32 * f, y - 50 * f, cloud.w * f, cloud.h * f);
      }
    }
    ctx.globalAlpha = 1;
    // линия рекорда
    if (best0 > 0) {
      const ry = startY - best0 * 10 - cam;
      if (ry > -10 && ry < H) {
        ctx.fillStyle = 'rgba(230,73,147,.55)';
        for (let x = 0; x < W; x += 16) ctx.fillRect(x, ry - 1, 8, 2);
        blit(recText, W - recText.w - 2, ry - recText.h + 4, recText.w, recText.h);
      }
    }
    // облачка-платформы
    for (let i = 0; i < plats.length; i++) {
      const p = plats[i], y = p.y - cam;
      if (y < -30 || y > H + 30) continue;
      if (p.t === 'g') { blit(ground, p.x, y, ground.w, ground.h); continue; }
      if (p.a < 1) ctx.globalAlpha = Math.max(0, p.a);
      if (p.spr) {
        const sx = p.x + p.spr.dx, hgt = 8 + p.spr.k * 14;
        blit(coil, sx, y - hgt, 18, hgt);
        blit(cap, sx, y - hgt - 5, 18, 6);
      }
      const s = p.img;
      if (p.broken) {
        const tl = Math.min(0.6, (p.fall || 0) * 1.5), hw = s.sw / 2;
        ctx.save(); ctx.translate(p.x + p.w * 0.25, y + 7); ctx.rotate(-tl); ctx.drawImage(s.c, s.sx, s.sy, hw, s.sh, -p.w * 0.25 - 2, -9, s.w / 2, s.h); ctx.restore();
        ctx.save(); ctx.translate(p.x + p.w * 0.75, y + 7); ctx.rotate(tl); ctx.drawImage(s.c, s.sx + hw, s.sy, hw, s.sh, -p.w * 0.25, -9, s.w / 2, s.h); ctx.restore();
      } else blit(s, p.x - 2, y - 2, s.w, s.h);
      if (p.a < 1) ctx.globalAlpha = 1;
    }
    // конфеты и ракеты
    for (let i = 0; i < items.length; i++) {
      const it = items[i], y = it.y - cam + Math.sin(t * 3 + it.ph) * 4;
      if (y < -30 || y > H + 30) continue;
      const s = it.k === 'candy' ? candy : rocketItem;
      blit(s, it.x - s.w / 2, y - s.h / 2, s.w, s.h);
    }
    // частицы
    for (let i = 0; i < POOL; i++) {
      const q = parts[i];
      if (q.life <= 0) continue;
      ctx.globalAlpha = q.life / q.max;
      blit(q.img, q.x - q.r, q.y - cam - q.r, q.r * 2, q.r * 2);
    }
    ctx.globalAlpha = 1;
    // Пинки
    drawPinky(pl.x);
    if (pl.x < PS / 2) drawPinky(pl.x + W);
    if (pl.x > W - PS / 2) drawPinky(pl.x - W);
    // надписи
    for (let i = 0; i < texts.length; i++) {
      const x = texts[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, x.life * 1.5));
      blit(x.s, x.x - x.s.w / 2, x.y - cam - x.s.h / 2, x.s.w, x.s.h);
    }
    ctx.globalAlpha = 1;
  };

  const finish = () => {
    over = true;
    hud();
    sfx('lose');
    const rec = score > best0;
    st.best = Math.max(st.best || 0, score);
    save();
    later(() => {
      alive = false; // окно итогов закрывает поле: кадры больше не нужны
      gameOverBox(`<div class="cele-e">${rec ? '🏆' : '🙀'}</div><h1>${rec ? 'Новый рекорд!' : 'Пинки упала!'}</h1>
        <p class="g-final">${U.fmt(score)} <small>м</small></p>
        ${candies ? `<p>Собрано конфет: ${candies} 🍬</p>` : ''}
        ${starsLine(got, `Допрыгни до ${U.fmt(JP.MILES[mile] || JP.MILES[0])} м — получишь ⭐`)}
        <div class="nav-col"><button class="btn big wide" data-act="again">Ещё раз 🔄</button><button class="btn ghost wide" data-go="#games">К играм</button></div>`);
      if (rec && best0 > 0) confetti();
    }, 700);
  };
  app.onclick = e => { if (e.target.closest('[data-act="again"]')) { sfx('tap'); jumpRun(); } };

  // следим за плавностью: если кадры неровные и долгие, снижаем чёткость картинки.
  // Ровные 30 кадров в секунду (режим энергосбережения) качество не снижают.
  const frames = new Float32Array(90);
  let fN = 0;
  const watch = raw => {
    frames[fN++] = raw;
    if (fN < frames.length) return;
    fN = 0;
    let avg = 0, dev = 0;
    for (let i = 0; i < frames.length; i++) avg += frames[i];
    avg /= frames.length;
    for (let i = 0; i < frames.length; i++) dev += Math.abs(frames[i] - avg);
    dev /= frames.length;
    if (avg > 1 / 42 && dev > 0.004 && jpQuality < 2) { jpQuality++; applyQuality(); }
  };
  let sdt = 1 / 60;
  const loop = now => {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const raw = (now - last) / 1000;
    last = now;
    if (paused) return;
    if (raw > 0 && raw < 0.25) watch(raw);
    // ровный шаг времени: мелкая дрожь таймера не превращается в дрожь картинки
    sdt += (Math.min(0.05, Math.max(0.002, raw)) - sdt) * 0.3;
    if (!over) lastAct = Date.now(); // время в игре считается, даже если играет наклоном
    update(sdt);
    draw();
  };
  while (topY > cam - 120) gen();
  draw();
  raf = requestAnimationFrame(loop);
  // для проверок: шаг игры вручную и управление без пальца
  window.__jp = { pl, plats, W, get cam() { return cam; }, get over() { return over; }, get score() { return score; }, set dir(v) { dir = v; }, step: dt => { update(dt); draw(); } };
}

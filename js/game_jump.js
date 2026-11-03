'use strict';
// Игра для отдыха «Прыжки Пинки»: прыгай по облачкам всё выше.
// Управление: держи палец на левой/правой половине поля или наклоняй телефон (стрелки на клавиатуре — для компьютера).
// Звёзды: +1 ⭐ за 300, 1000 и 2000 м в одной игре (общий дневной предел ECON.cap на все игры для отдыха).
// Подключается до app.js.

const JP = { G: 1900, JUMP: 900, SPRING: 1500, ROCKET: 1250, ROCKET_T: 2.2, VX: 400, PS: 52, MILES: [300, 1000, 2000] };
const JP_SKY = [ // [доля высоты, цвет вверху, цвет внизу]
  [0, [255, 214, 232], [255, 244, 249]],
  [0.3, [208, 191, 255], [255, 214, 232]],
  [0.65, [95, 61, 196], [177, 151, 252]],
  [1, [27, 16, 64], [75, 42, 153]],
];
const jpImg = new Image();
jpImg.src = 'img/pinky.svg';

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
  const W = field.clientWidth || 360, H = field.clientHeight || Math.max(400, window.innerHeight - 150), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const startY = H - 40;
  const pl = { x: W / 2, y: startY, vx: 0, vy: -JP.JUMP, squash: 0, rocket: 0 };
  const plats = [{ x: -10, y: startY, w: W + 20, t: 'g', vx: 0, a: 1 }], items = [], parts = [], texts = [];
  let topY = startY, cam = 0, score = 0, candies = 0, mile = 0, got = 0, over = false, alive = true, paused = false;
  let dir = 0, tilt = null, raf = 0, last = performance.now(), recShown = false, t = 0;
  const sEl = document.getElementById('jps');
  const drawGoal = () => { document.getElementById('jpg').innerHTML = goalHTML(score, JP.MILES, mile, got, 'м'); };
  drawGoal();

  // фон: звёзды и облака (повторяются по высоте)
  const stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * 1600, r: 0.6 + Math.random() * 1.6, ph: Math.random() * 6 }));
  const clouds = Array.from({ length: 7 }, (_, i) => ({ x: Math.random() * W, y: i * 200 + Math.random() * 120, s: 0.6 + Math.random() * 0.8 }));

  const diff = () => Math.min(1, (startY - topY) / 25000);
  const gen = () => {
    const d = diff(), gap = 55 + d * 45 + Math.random() * (40 + d * 40);
    topY -= gap;
    const w = 66 - d * 12, r = Math.random();
    let tp = 'n';
    if (r < 0.06 + d * 0.28) tp = 'm';
    else if (startY - topY > 1500 && r < 0.1 + d * 0.38) tp = 'v';
    const p = { x: Math.random() * (W - w), y: topY, w, t: tp, vx: tp === 'm' ? (Math.random() < 0.5 ? -1 : 1) * (45 + d * 95) : 0, a: 1 };
    if (tp === 'n' && startY - topY > 400 && Math.random() < 0.08) p.spr = { dx: 8 + Math.random() * (w - 34), k: 0 };
    plats.push(p);
    if (startY - topY > 900 && Math.random() < 0.12 + d * 0.28) {
      plats.push({ x: Math.random() * (W - w), y: topY + gap * (0.35 + Math.random() * 0.3), w, t: 'b', vx: 0, a: 1 });
    }
    if (Math.random() < 0.16) items.push({ k: 'candy', x: 20 + Math.random() * (W - 40), y: topY - 40 - Math.random() * 30, ph: Math.random() * 6 });
    if (startY - topY > 2500 && Math.random() < 0.022) items.push({ k: 'rocket', x: p.x + p.w / 2, y: p.y - 26, ph: 0 });
  };
  const puff = (x, y, color, n = 7, up = false) => {
    for (let i = 0; i < n; i++) {
      const a = up ? -Math.PI / 2 + (Math.random() - 0.5) * 1.6 : Math.PI + Math.random() * Math.PI;
      const v = 60 + Math.random() * 120;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * (up ? 1.4 : 0.5), life: 0.5, max: 0.5, c: color, s: 2 + Math.random() * 3 });
    }
  };
  const say = (txt, x, y, c = '#e64993') => texts.push({ txt, x, y, life: 1, c });
  const toScreen = (x, y) => { const r = field.getBoundingClientRect(); return { x: r.left + x, y: r.top + y - cam }; };

  // ── управление ──
  const pointers = new Map();
  const setDir = () => { const v = [...pointers.values()]; dir = v.length ? v[v.length - 1] : 0; };
  const onDown = e => {
    if (paused) { paused = false; last = performance.now(); field.querySelectorAll('.jp-pause').forEach(x => x.remove()); return; }
    const r = field.getBoundingClientRect();
    pointers.set(e.pointerId, e.clientX - r.left < W / 2 ? -1 : 1); setDir();
  };
  const onMove = e => { if (!pointers.has(e.pointerId)) return; const r = field.getBoundingClientRect(); pointers.set(e.pointerId, e.clientX - r.left < W / 2 ? -1 : 1); setDir(); };
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
  field.addEventListener('pointerdown', onDown);
  field.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  if (st.tilt) window.addEventListener('deviceorientation', onTilt);
  document.addEventListener('visibilitychange', onVis);
  onLeave(() => {
    alive = false; cancelAnimationFrame(raf);
    window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
    window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey);
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
        pl.rocket -= dt; pl.vy = -JP.ROCKET;
        if (Math.random() < 0.8) parts.push({ x: pl.x + (Math.random() - 0.5) * 10, y: pl.y + 4, vx: (Math.random() - 0.5) * 60, vy: 160 + Math.random() * 120, life: 0.45, max: 0.45, c: Math.random() < 0.5 ? '#ffd43b' : '#ff922b', s: 3 + Math.random() * 3 });
      } else pl.vy += JP.G * dt;
      pl.y += pl.vy * dt;
      pl.squash = Math.max(0, pl.squash - dt * 5);
      // приземление на облачко
      if (pl.vy > 0) {
        for (const p of plats) {
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
      for (const it of items) {
        if (it.got) continue;
        if (Math.abs(pl.x - it.x) < 28 && Math.abs(pl.y - JP.PS / 2 - it.y) < 34) {
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
        sEl.textContent = U.fmt(score) + ' м';
        while (mile < JP.MILES.length && score >= JP.MILES[mile]) {
          mile++;
          const sp = toScreen(pl.x, pl.y - JP.PS / 2);
          if (giveGameStar(sp)) { got++; sfx('star'); say('+1 ⭐', pl.x, pl.y - 80, '#f08c00'); }
          drawGoal();
        }
        if (mile < JP.MILES.length && Math.floor(score / 10) !== Math.floor((score - 1) / 10)) drawGoal();
        if (!recShown && best0 > 0 && score > best0) { recShown = true; say('Новый рекорд! 🏆', W / 2, pl.y - 110, '#e64993'); sfx('win'); }
      }
      if (pl.y - JP.PS > cam + H) finish();
    }
    // облачка
    for (const p of plats) {
      if (p.t === 'm') { p.x += p.vx * dt; if (p.x < 0) { p.x = 0; p.vx *= -1; } if (p.x + p.w > W) { p.x = W - p.w; p.vx *= -1; } }
      if (p.broken) { p.fall = (p.fall || 0) + dt; p.y += 260 * dt; p.a = Math.max(0, 1 - p.fall * 1.4); }
      if (p.vanish) { p.a -= dt * 3.5; if (p.a <= 0) p.gone = true; }
      if (p.spr && p.spr.k > 0) p.spr.k = Math.max(0, p.spr.k - dt * 3);
    }
    while (topY > cam - 120) gen();
    for (let i = plats.length - 1; i >= 0; i--) if (plats[i].y > cam + H + 80 || plats[i].gone) plats.splice(i, 1);
    for (let i = items.length - 1; i >= 0; i--) if (items[i].y > cam + H + 80 || items[i].got) items.splice(i, 1);
    for (let i = parts.length - 1; i >= 0; i--) {
      const q = parts[i];
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 300 * dt; q.life -= dt;
      if (q.life <= 0) parts.splice(i, 1);
    }
    for (let i = texts.length - 1; i >= 0; i--) { texts[i].y -= 40 * dt; texts[i].life -= dt * 0.8; if (texts[i].life <= 0) texts.splice(i, 1); }
  };

  // ── рисование ──
  const draw = () => {
    const k = Math.min(1, (startY - (cam + H)) / 22000);
    const [c0, c1] = jpSky(Math.max(0, k));
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // звёзды (появляются высоко)
    const sa = Math.max(0, Math.min(1, (k - 0.35) / 0.3));
    if (sa > 0) {
      ctx.fillStyle = '#fff';
      for (const s of stars) {
        const y = ((s.y - cam * 0.15) % 1600 + 1600) % 1600;
        if (y > H) continue;
        ctx.globalAlpha = sa * (0.5 + 0.5 * Math.sin(t * 2 + s.ph));
        ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // облака на фоне
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.5 * (1 - sa * 0.75);
    for (const c of clouds) {
      const y = ((c.y - cam * 0.35) % 1400 + 1400) % 1400 - 100;
      if (y > H + 60) continue;
      const x = (c.x + t * 8 * c.s) % (W + 160) - 80, s = c.s * 22;
      ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.arc(x + s * 1.1, y - s * 0.4, s * 1.2, 0, 7); ctx.arc(x + s * 2.2, y, s * 0.9, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // линия рекорда
    if (best0 > 0) {
      const ry = startY - best0 * 10 - cam;
      if (ry > -10 && ry < H) {
        ctx.strokeStyle = 'rgba(230,73,147,.55)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(W, ry); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#e64993'; ctx.font = '800 13px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText('🏆 рекорд', W - 8, ry - 3);
      }
    }
    // облачка-платформы
    for (const p of plats) {
      const y = p.y - cam;
      if (y < -30 || y > H + 30) continue;
      ctx.globalAlpha = Math.max(0, p.a);
      if (p.t === 'g') {
        const gg = ctx.createLinearGradient(0, y, 0, y + 40); gg.addColorStop(0, '#ff8fc0'); gg.addColorStop(1, '#ffc2dc');
        ctx.fillStyle = gg; jpRound(ctx, p.x, y, p.w, 60, 16); ctx.fill();
        continue;
      }
      if (p.spr) {
        const sx = p.x + p.spr.dx, hgt = 8 + p.spr.k * 14;
        ctx.strokeStyle = '#868e96'; ctx.lineWidth = 2.5; ctx.beginPath();
        for (let i = 0; i <= 4; i++) ctx.lineTo(sx + (i % 2 ? 4 : 14), y - (hgt * i) / 4);
        ctx.stroke();
        ctx.fillStyle = '#ffd43b'; jpRound(ctx, sx, y - hgt - 5, 18, 6, 3); ctx.fill();
      }
      const col = { n: ['#ffa8cf', '#ff5fa2'], m: ['#d0bfff', '#9775fa'], b: ['#e9c9a8', '#c99b74'], v: ['#ffffff', '#ffe3ef'] }[p.t];
      const pg = ctx.createLinearGradient(0, y, 0, y + 14); pg.addColorStop(0, col[0]); pg.addColorStop(1, col[1]);
      ctx.fillStyle = pg;
      if (p.broken) {
        const tilt2 = Math.min(0.6, (p.fall || 0) * 1.5);
        ctx.save(); ctx.translate(p.x + p.w * 0.25, y + 7); ctx.rotate(-tilt2); jpRound(ctx, -p.w * 0.25, -7, p.w / 2 - 2, 14, 7); ctx.fill(); ctx.restore();
        ctx.save(); ctx.translate(p.x + p.w * 0.75, y + 7); ctx.rotate(tilt2); jpRound(ctx, -p.w * 0.25 + 2, -7, p.w / 2 - 2, 14, 7); ctx.fill(); ctx.restore();
      } else {
        jpRound(ctx, p.x, y, p.w, 14, 7); ctx.fill();
        if (p.t === 'v') { ctx.strokeStyle = '#ff9cc7'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); }
        ctx.fillStyle = 'rgba(255,255,255,.55)'; jpRound(ctx, p.x + 6, y + 2, p.w - 12, 3, 1.5); ctx.fill();
        if (p.t === 'b') { ctx.strokeStyle = 'rgba(120,70,40,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x + p.w / 2, y + 1); ctx.lineTo(p.x + p.w / 2 - 4, y + 7); ctx.lineTo(p.x + p.w / 2 + 3, y + 13); ctx.stroke(); }
      }
    }
    ctx.globalAlpha = 1;
    // конфеты и ракеты
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const it of items) {
      const y = it.y - cam + Math.sin(t * 3 + it.ph) * 4;
      if (y < -30 || y > H + 30) continue;
      ctx.font = (it.k === 'candy' ? 24 : 30) + 'px system-ui, sans-serif';
      if (it.k === 'rocket') { ctx.save(); ctx.translate(it.x, y); ctx.rotate(-Math.PI / 4); ctx.fillText('🚀', 0, 0); ctx.restore(); }
      else ctx.fillText('🍬', it.x, y);
    }
    // частицы
    for (const q of parts) { ctx.globalAlpha = Math.max(0, q.life / q.max); ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y - cam, q.s, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    // Пинки
    const drawPinky = x => {
      const y = pl.y - cam, sq = pl.squash, st2 = pl.vy < 0 ? Math.min(1, -pl.vy / JP.JUMP) * 0.08 : 0;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((pl.vx / JP.VX) * 0.2);
      ctx.scale(1 + 0.25 * sq - st2, 1 - 0.22 * sq + st2);
      if (pl.rocket > 0) { ctx.save(); ctx.font = '34px system-ui, sans-serif'; ctx.translate(0, -12); ctx.rotate(-Math.PI / 4); ctx.fillText('🚀', 0, 0); ctx.restore(); }
      if (jpImg.complete && jpImg.naturalWidth) ctx.drawImage(jpImg, -JP.PS / 2, -JP.PS, JP.PS, JP.PS);
      else { ctx.fillStyle = '#ff8fc0'; ctx.beginPath(); ctx.arc(0, -JP.PS / 2, JP.PS / 2.2, 0, 7); ctx.fill(); }
      const eq = S.equip || {};
      if (eq.head && ITEM[eq.head]) { ctx.font = '20px system-ui, sans-serif'; ctx.fillText(ITEM[eq.head].e, 0, -JP.PS - 2); }
      ctx.restore();
    };
    drawPinky(pl.x);
    if (pl.x < JP.PS / 2) drawPinky(pl.x + W);
    if (pl.x > W - JP.PS / 2) drawPinky(pl.x - W);
    // надписи
    ctx.font = '900 18px ui-rounded, system-ui, sans-serif';
    for (const x of texts) {
      ctx.globalAlpha = Math.max(0, Math.min(1, x.life * 1.5));
      ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.strokeText(x.txt, x.x, x.y - cam);
      ctx.fillStyle = x.c; ctx.fillText(x.txt, x.x, x.y - cam);
    }
    ctx.globalAlpha = 1;
  };

  const finish = () => {
    over = true;
    sfx('lose');
    const rec = score > best0;
    st.best = Math.max(st.best || 0, score);
    save();
    later(() => {
      gameOverBox(`<div class="cele-e">${rec ? '🏆' : '🙀'}</div><h1>${rec ? 'Новый рекорд!' : 'Пинки упала!'}</h1>
        <p class="g-final">${U.fmt(score)} <small>м</small></p>
        ${candies ? `<p>Собрано конфет: ${candies} 🍬</p>` : ''}
        ${starsLine(got, `Допрыгни до ${U.fmt(JP.MILES[mile] || JP.MILES[0])} м — получишь ⭐`)}
        <div class="nav-col"><button class="btn big wide" data-act="again">Ещё раз 🔄</button><button class="btn ghost wide" data-go="#games">К играм</button></div>`);
      if (rec && best0 > 0) confetti();
    }, 700);
  };
  app.onclick = e => { if (e.target.closest('[data-act="again"]')) { sfx('tap'); jumpRun(); } };

  const loop = now => {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.033, Math.max(0, (now - last) / 1000));
    last = now;
    if (paused) return;
    if (!over) lastAct = Date.now(); // время в игре считается, даже если играет наклоном
    update(dt);
    draw();
  };
  while (topY > cam - 120) gen();
  draw();
  raf = requestAnimationFrame(loop);
  // для проверок: поднять Пинки повыше
  window.__jp = { pl, plats, W, get cam() { return cam; }, get over() { return over; }, get score() { return score; }, set dir(v) { dir = v; }, step: dt => { update(dt); draw(); } };
}

'use strict';
// Заставка при открытии: ночное небо, ракета Пинки оставляет искры, искры складываются в надпись,
// потом совушка Луна здоровается по времени суток. Всё на одном холсте (на телефоне это легче всего).
//  • Полная версия (≈3,8 с) — первый запуск за день, короткая (≈1,7 с) — остальные. Любое касание пропускает.
//  • showIntro({ full, seek }) — seek в секундах нужен для снимков экрана: заставка замирает на этом моменте.
// Подключается до app.js; запускается из app.js после первого route().

const INTRO = { full: 3.8, short: 1.7, fade: 0.35 };

function introGreeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Доброй ночи, Лизок!' : h < 12 ? 'Доброе утро, Лизок!' : h < 18 ? 'Добрый день, Лизок!' : 'Добрый вечер, Лизок!';
}
// точки надписи: рисуем текст на скрытом холсте и собираем закрашенные пиксели
function introTextPoints(W, cy) {
  const c = document.createElement('canvas'), x = c.getContext('2d');
  c.width = W; c.height = 200;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
  const big = Math.min(74, Math.floor(W * 0.2)), small = Math.min(30, Math.floor(W * 0.082));
  x.font = `900 ${big}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
  x.fillText('Лизок', W / 2, 70);
  x.font = `800 ${small}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
  x.fillText('и математика', W / 2, 150);
  const d = x.getImageData(0, 0, W, 200).data, pts = [], step = 3;
  for (let yy = 0; yy < 200; yy += step) for (let xx = 0; xx < W; xx += step) if (d[(yy * W + xx) * 4 + 3] > 140) pts.push([xx, yy - 100 + cy]);
  return { pts: U.shuffle(pts), big, small };
}

function showIntro(opt = {}) {
  const full = opt.full !== false, DUR = full ? INTRO.full : INTRO.short;
  const W = window.innerWidth, H = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
  const cv = document.createElement('canvas');
  cv.className = 'intro';
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d', { alpha: false });
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // ── картинки, нарисованные заранее ──
  const sprite = (w, h, paint) => { const c = document.createElement('canvas'); c.width = w * dpr; c.height = h * dpr; const x = c.getContext('2d'); x.scale(dpr, dpr); paint(x); return c; };
  const glow = color => sprite(24, 24, x => { const g = x.createRadialGradient(12, 12, 0, 12, 12, 12); g.addColorStop(0, '#fff'); g.addColorStop(0.3, color); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 24, 24); });
  const COLORS = ['#ff8fc0', '#ffd43b', '#d0bfff', '#fff3bf', '#ff5fa2', '#b197fc'];
  const glows = COLORS.map(glow);
  const starS = glow('#e5dbff');
  const rocketS = sprite(110, 110, x => { x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '72px system-ui, sans-serif'; x.fillText('🚀', 55, 55); });
  const pinkyImg = new Image(); pinkyImg.src = 'img/pinky.svg';
  const lunaImg = new Image(); lunaImg.src = 'img/luna.svg';

  const cy = H * 0.4, text = introTextPoints(W, cy);
  const N = Math.min(text.pts.length, full ? 650 : 520);
  const parts = [];
  for (let i = 0; i < N; i++) {
    const [tx, ty] = text.pts[i];
    parts.push({ tx, ty, x: tx + (Math.random() - 0.5) * W * 1.4, y: ty + (Math.random() - 0.5) * H, vx: 0, vy: 0, born: -1, ax: 0, ay: 0, c: glows[i % glows.length], s: 7 + Math.random() * 8, ph: Math.random() * 6.3 });
  }
  const stars = Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 1.8, ph: Math.random() * 6.3, sp: 0.5 + Math.random() * 1.5 }));
  const meteor = { t0: 0.3 + Math.random() * 0.6, x: W * (0.6 + Math.random() * 0.3), y: H * 0.08 };

  // путь ракеты: кривая снизу слева вверх направо через середину
  const P0 = [-90, H * 0.9], P1 = [W * 0.25, H * 0.95], P2 = [W * 0.55, H * 0.05], P3 = [W + 110, H * 0.12];
  const bez = k => { const u = 1 - k; return [u * u * u * P0[0] + 3 * u * u * k * P1[0] + 3 * u * k * k * P2[0] + k * k * k * P3[0], u * u * u * P0[1] + 3 * u * u * k * P1[1] + 3 * u * k * k * P2[1] + k * k * k * P3[1]]; };
  const ROCKET_END = 1.45, GATHER0 = full ? 1.25 : 0, GATHER1 = full ? 2.25 : 0.85, LUNA0 = 2.35;
  const ease = k => 1 - Math.pow(1 - k, 3), clamp = v => Math.max(0, Math.min(1, v)), back = k => 1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2);
  let emitted = 0, lastT = 0;

  const draw = t => {
    const dt = Math.max(0, Math.min(0.05, t - lastT));
    lastT = t;
    // небо
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1b1040'); g.addColorStop(0.65, '#4b2a99'); g.addColorStop(1, '#8f6ff0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // звёзды
    for (const s of stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(t * s.sp + s.ph));
      ctx.globalAlpha = a;
      ctx.drawImage(starS, s.x - s.r * 2, s.y - s.r * 2, s.r * 4, s.r * 4);
    }
    ctx.globalAlpha = 1;
    // падающая звезда
    if (full && t > meteor.t0 && t < meteor.t0 + 0.7) {
      const k = (t - meteor.t0) / 0.7, mx = meteor.x - k * 260, my = meteor.y + k * 150;
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(mx + 70, my - 40); ctx.lineTo(mx, my); ctx.stroke();
    }
    // ракета и искры
    let rx = -999, ry = 0, ang = 0;
    if (full && t < ROCKET_END + 0.3) {
      const k = clamp(t / ROCKET_END), [x, y] = bez(k), [x2, y2] = bez(Math.min(1, k + 0.01));
      rx = x; ry = y; ang = Math.atan2(y2 - y, x2 - x);
      if (k < 1) {
        const want = Math.floor(k * N);
        while (emitted < want && emitted < N) {
          const p = parts[emitted++];
          p.x = x - Math.cos(ang) * 30; p.y = y - Math.sin(ang) * 30; p.born = t;
          p.vx = -Math.cos(ang) * (60 + Math.random() * 120) + (Math.random() - 0.5) * 90;
          p.vy = -Math.sin(ang) * (60 + Math.random() * 120) + (Math.random() - 0.5) * 90;
        }
      }
    }
    if (!full) emitted = N;
    const gk = ease(clamp((t - GATHER0) / (GATHER1 - GATHER0)));
    for (let i = 0; i < emitted; i++) {
      const p = parts[i];
      if (full && t < GATHER0) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy = p.vy * 0.96 + 40 * dt; p.ax = p.x; p.ay = p.y; }
      else if (!full && p.ax === 0 && p.ay === 0) { p.ax = p.x; p.ay = p.y; }
      const px = p.ax + (p.tx - p.ax) * gk + Math.sin(t * 3 + p.ph) * (1 - gk) * 6, py = p.ay + (p.ty - p.ay) * gk + Math.cos(t * 2.6 + p.ph) * (1 - gk) * 6;
      const age = full ? t - p.born : t + 0.3, a = Math.min(1, age * 3) * (gk > 0.98 ? 0.55 + 0.45 * Math.abs(Math.sin(t * 4 + p.ph)) : 1);
      ctx.globalAlpha = a;
      const s = p.s * (1 - gk * 0.45);
      ctx.drawImage(p.c, px - s / 2, py - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    // сама надпись проступает под искрами
    const ta = clamp((gk - 0.75) / 0.25);
    if (ta > 0) {
      ctx.save();
      ctx.globalAlpha = ta; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ff8fc0'; ctx.shadowBlur = 24;
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${text.big}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
      ctx.fillText('Лизок', W / 2, cy - 30);
      ctx.font = `800 ${text.small}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
      ctx.fillStyle = '#ffe3ef';
      ctx.fillText('и математика', W / 2, cy + 50);
      ctx.restore();
    }
    if (rx > -500) {
      ctx.save();
      ctx.translate(rx, ry); ctx.rotate(ang - Math.PI / 4);
      ctx.drawImage(rocketS, -55, -55, 110, 110);
      if (pinkyImg.complete && pinkyImg.naturalWidth) { ctx.rotate(Math.PI / 4); ctx.drawImage(pinkyImg, -12, -40, 30, 30); }
      ctx.restore();
    }
    // Луна здоровается
    if (full && t > LUNA0) {
      const k = clamp((t - LUNA0) / 0.6), ly = H + 40 - back(k) * 210, lx = W * 0.5;
      const bob = Math.sin(t * 4) * 3;
      if (lunaImg.complete && lunaImg.naturalWidth) ctx.drawImage(lunaImg, lx - 70, ly + bob, 140, 140);
      const bk = clamp((t - LUNA0 - 0.45) / 0.3);
      if (bk > 0) {
        const msg = introGreeting();
        ctx.save();
        ctx.font = '800 20px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
        const tw = ctx.measureText(msg).width + 36, bx = lx - tw / 2, by = ly - 56 + bob, bw = tw, bh = 46;
        ctx.globalAlpha = bk;
        ctx.translate(lx, by + bh / 2); ctx.scale(0.6 + 0.4 * back(bk), 0.6 + 0.4 * back(bk)); ctx.translate(-lx, -(by + bh / 2));
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 18); ctx.fill();
        ctx.beginPath(); ctx.moveTo(lx - 10, by + bh); ctx.lineTo(lx, by + bh + 12); ctx.lineTo(lx + 10, by + bh); ctx.fill();
        ctx.fillStyle = '#7048e8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(msg, lx, by + bh / 2 + 1);
        ctx.restore();
      }
    }
  };

  let raf = 0, t0 = 0, done = false, out = false;
  const finish = () => {
    if (out) return;
    out = true;
    cv.classList.add('out');
    setTimeout(() => { cancelAnimationFrame(raf); cv.remove(); done = true; }, INTRO.fade * 1000);
  };
  const loop = now => {
    if (done) return;
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    draw(t);
    if (t >= DUR) finish();
    raf = requestAnimationFrame(loop);
  };
  const skip = e => { e.preventDefault(); finish(); };
  cv.addEventListener('pointerdown', skip);
  window.addEventListener('keydown', skip, { once: true });
  const ready = Promise.all([pinkyImg, lunaImg].map(im => new Promise(r => { if (im.complete) r(); else { im.onload = r; im.onerror = r; } })));
  if (typeof opt.seek === 'number') { // для снимков: замереть на нужной секунде
    ready.then(() => { let s = 0; while (s < opt.seek) { s += 1 / 60; draw(s); } draw(opt.seek); });
    return { finish };
  }
  draw(0);
  ready.then(() => { if (!done) raf = requestAnimationFrame(loop); });
  return { finish };
}

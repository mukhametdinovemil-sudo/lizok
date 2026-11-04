'use strict';
// Игра для отдыха «Блоки»: перетаскивай фигурки на поле 8×8, собирай полные ряды и столбики.
// Звёзды: +1 ⭐ за 500, 1500 и 3000 очков в одной игре (общий дневной предел ECON.cap на все игры для отдыха).
// Подключается до app.js.

const BB = { N: 8, MILES: [500, 1500, 3000], LINE: [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600], LIFT: 30 };
const BB_COLORS = ['#ff5fa2', '#b197fc', '#ffc93c', '#38d9a9', '#4dabf7', '#ff922b', '#f783ac', '#9775fa'];
// фигуры: «#» — клетка; число — как часто выпадает
const BB_SHAPES = [
  ['#', 6], ['##', 5], ['#\n#', 5], ['###', 5], ['#\n#\n#', 5], ['####', 3], ['#\n#\n#\n#', 3], ['#####', 1], ['#\n#\n#\n#\n#', 1],
  ['##\n##', 5], ['###\n###\n###', 1], ['##\n#.', 3], ['##\n.#', 3], ['#.\n##', 3], ['.#\n##', 3],
  ['###\n#..', 2], ['###\n..#', 2], ['#..\n###', 2], ['..#\n###', 2], ['##\n#.\n#.', 2], ['##\n.#\n.#', 2], ['#.\n#.\n##', 2], ['.#\n.#\n##', 2],
  ['###\n.#.', 2], ['.#.\n###', 2], ['#.\n##\n#.', 2], ['.#\n##\n.#', 2],
  ['##.\n.##', 1], ['.##\n##.', 1], ['#.\n##\n.#', 1], ['.#\n##\n#.', 1],
  ['###\n###', 2], ['##\n##\n##', 2],
  ['###\n#..\n#..', 1], ['###\n..#\n..#', 1], ['#..\n#..\n###', 1], ['..#\n..#\n###', 1],
].map(([s, weight]) => {
  const rows = s.split('\n'), cells = [];
  rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') cells.push([r, c]); }));
  return { cells, h: rows.length, w: Math.max(...rows.map(x => x.length)), weight };
});
const BB_TOTAL = BB_SHAPES.reduce((s, x) => s + x.weight, 0);

function bbPick() {
  let r = Math.random() * BB_TOTAL;
  return BB_SHAPES.find(x => (r -= x.weight) < 0) || BB_SHAPES[0];
}
function bbFits(grid, p, r, c) {
  for (const [dr, dc] of p.cells) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || cc < 0 || rr >= BB.N || cc >= BB.N || grid[rr][cc]) return false;
  }
  return true;
}
function bbCanPlace(grid, p) {
  for (let r = 0; r <= BB.N - p.h; r++) for (let c = 0; c <= BB.N - p.w; c++) if (bbFits(grid, p, r, c)) return true;
  return false;
}
// полные ряды и столбики
function bbLines(grid) {
  const rows = [], cols = [];
  for (let i = 0; i < BB.N; i++) {
    if (grid[i].every(Boolean)) rows.push(i);
    if (grid.every(row => row[i])) cols.push(i);
  }
  return { rows, cols };
}
// три новые фигурки; хотя бы одна обязательно помещается (если это вообще возможно)
function bbTray(grid) {
  let set = null;
  for (let k = 0; k < 60; k++) {
    set = [bbPick(), bbPick(), bbPick()];
    if (set.some(p => bbCanPlace(grid, p))) break;
  }
  const cols = U.shuffle(BB_COLORS);
  return set.map((p, i) => ({ ...p, color: cols[i] }));
}
const bbPieceHTML = (p, cs, g) => `<div class="bb-piece" style="width:${p.w * (cs + g) - g}px;height:${p.h * (cs + g) - g}px">${p.cells
  .map(([r, c]) => `<i style="left:${c * (cs + g)}px;top:${r * (cs + g)}px;width:${cs}px;height:${cs}px;--c:${p.color}"></i>`).join('')}</div>`;

// ═════════════ Эффекты на одном холсте ═════════════
// Исчезающие клетки, искры и вспышки рядов рисуются на холсте поверх поля. Для телефона это намного легче,
// чем десятки отдельных элементов страницы с анимацией. Холст работает только пока есть что показывать.
function bbFxLayer(wrap) {
  const PAD = 36, dpr = Math.min(2, window.devicePixelRatio || 1);
  const cv = document.createElement('canvas');
  cv.className = 'bb-fx';
  wrap.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, raf = 0;
  const sprites = new Map(), cells = [], sparks = [], bands = [];
  const fit = () => {
    W = wrap.clientWidth + PAD * 2; H = wrap.clientHeight + PAD * 2;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.cssText = `left:${-PAD}px;top:${-PAD}px;width:${W}px;height:${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sprites.clear();
  };
  const sprite = (key, size, paint) => {
    let s = sprites.get(key);
    if (!s) {
      s = document.createElement('canvas');
      s.width = s.height = Math.ceil(size * dpr);
      const x = s.getContext('2d');
      x.scale(dpr, dpr);
      paint(x);
      sprites.set(key, s);
    }
    return s;
  };
  // клетка-конфетка, как на поле
  const cellSprite = (color, cs) => sprite('c' + color + cs, cs, x => {
    const r = cs * 0.24;
    x.beginPath();
    x.moveTo(r, 0); x.arcTo(cs, 0, cs, cs, r); x.arcTo(cs, cs, 0, cs, r); x.arcTo(0, cs, 0, 0, r); x.arcTo(0, 0, cs, 0, r);
    x.closePath(); x.clip();
    x.fillStyle = color; x.fillRect(0, 0, cs, cs);
    const g = x.createLinearGradient(0, 0, cs * 0.75, cs);
    g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.55, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, cs, cs);
    x.fillStyle = 'rgba(0,0,0,.14)'; x.fillRect(0, cs - 4, cs, 4);
    x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(0, 0, cs, 2);
  });
  // мягкая искорка
  const dotSprite = color => sprite('d' + color, 16, x => {
    const g = x.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, '#fff'); g.addColorStop(0.35, color); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 16, 16);
  });
  const tick = now => {
    raf = 0;
    ctx.clearRect(0, 0, W, H);
    let live = false;
    for (let i = bands.length - 1; i >= 0; i--) {
      const b = bands[i], k = (now - b.t0) / 240;
      if (k >= 1) { bands.splice(i, 1); continue; }
      live = true;
      if (k < 0) continue;
      ctx.globalAlpha = 0.7 * (1 - k);
      ctx.fillStyle = '#fff';
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    for (let i = cells.length - 1; i >= 0; i--) {
      const c = cells[i], k = (now - c.t0) / 340;
      if (k >= 1) { cells.splice(i, 1); continue; }
      live = true;
      const u = k < 0 ? 0 : k, s = u < 0.3 ? 1 + 0.6 * u : 1.18 * (1 - (u - 0.3) / 0.7), a = c.rot * u, co = Math.cos(a) * s, si = Math.sin(a) * s;
      ctx.globalAlpha = u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4;
      ctx.setTransform(co * dpr, si * dpr, -si * dpr, co * dpr, c.x * dpr, c.y * dpr);
      ctx.drawImage(c.spr, -c.cs / 2, -c.cs / 2, c.cs, c.cs);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i], k = (now - p.t0) / 560;
      if (k >= 1) { sparks.splice(i, 1); continue; }
      live = true;
      if (k < 0) continue;
      const e = 1 - (1 - k) * (1 - k), sz = p.s * (1 - k * 0.7);
      ctx.globalAlpha = 1 - k;
      ctx.drawImage(p.spr, p.x + p.dx * e - sz / 2, p.y + p.dy * e + 26 * k * k - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
    if (live) raf = requestAnimationFrame(tick);
    else cv.style.visibility = 'hidden';
  };
  const run = () => { if (!raf) { cv.style.visibility = 'visible'; raf = requestAnimationFrame(tick); } };
  fit();
  return {
    fit,
    tick, // для снимков экрана: показать эффект в нужный момент
    // list: [{x, y, color, delay}] — центры клеток внутри поля; lines: [{x, y, w, h}] — ряды для вспышки
    burst(list, lines, cs) {
      const t = performance.now();
      lines.forEach(l => bands.push({ x: l.x + PAD, y: l.y + PAD, w: l.w, h: l.h, t0: t }));
      for (const c of list) {
        const x = c.x + PAD, y = c.y + PAD, t0 = t + c.delay;
        cells.push({ x, y, cs, spr: cellSprite(c.color, cs), t0, rot: (Math.random() - 0.5) * 1.4 });
        for (let k = 0; k < 3; k++) {
          const a = Math.random() * 6.283, d = 24 + Math.random() * 36;
          sparks.push({ x, y, dx: Math.cos(a) * d, dy: Math.sin(a) * d, s: 9 + Math.random() * 7, spr: dotSprite(c.color), t0: t0 + 70 });
        }
      }
      run();
    },
    stop() { cancelAnimationFrame(raf); raf = 0; cells.length = sparks.length = bands.length = 0; cv.style.visibility = 'hidden'; },
  };
}

// ═════════════ Стартовый экран ═════════════
function blocks() {
  const st = S.gm.blocks || { best: 0 };
  const demo = [
    '.ab..', 'c.a.d', 'eeee*', '.b.dd', 'cc.a.',
  ].map((row, r) => [...row].map((ch, c) => {
    const col = { a: '#ff5fa2', b: '#b197fc', c: '#4dabf7', d: '#38d9a9', e: '#ffc93c', '*': '#ffc93c' }[ch];
    return `<i class="${ch === 'e' ? 'rw' : ch === '*' ? 'rw drop' : col ? 'on' : ''}" style="${col ? `--c:${col};` : ''}--d:${(r + c) * 0.05}s"></i>`;
  }).join('')).join('');
  app.innerHTML = `<div class="screen">${header('🧱 Блоки', '#games')}
    <div class="bb-demo" aria-hidden="true">${demo}</div>
    ${mascotHTML('Перетаскивай фигурки на поле. Заполни целый ряд или столбик — он исчезнет! Игра закончится, когда фигурки будет некуда поставить.')}
    <div class="card g-rules"><b>🏆 Рекорд: ${U.fmt(st.best || 0)}</b><span>⭐ +1 за ${BB.MILES.map(U.fmt).join(', ')} очков</span>
      <span>${gameStarsLeft() ? `Сегодня из игр для отдыха можно получить ещё ${gameStarsLeft()} ⭐` : 'Звёзды из игр на сегодня собраны — играем для удовольствия'}</span></div>
    <button class="btn big wide" data-act="play">Играть!</button></div>`;
  app.onclick = e => { if (e.target.closest('[data-act="play"]')) { sfx('tap'); blocksRun(); } };
}

// ═════════════ Игра ═════════════
function blocksRun() {
  stopTimers(); leaveGame();
  const st = (S.gm.blocks = S.gm.blocks || { best: 0, runs: 0 });
  const best0 = st.best || 0;
  st.runs = (st.runs || 0) + 1; save();
  const N = BB.N, grid = Array.from({ length: N }, () => Array(N).fill(null));
  let score = 0, shown = 0, combo = 0, idle = 0, over = false, got = 0, mile = 0, recShown = false, tray = [], drag = null, raf = 0;
  let marked = [], mvRaf = 0, mvX = 0, mvY = 0, flipT = 0;

  app.innerHTML = `<div class="screen bb-screen">
    <header class="top"><button class="icon-btn" data-go="#games" aria-label="Выйти">✕</button>
      <div class="g-score"><b id="bbs">0</b><small>🏆 ${U.fmt(best0)}</small></div><div class="pill">⭐ ${bal()}</div></header>
    <div class="g-goal" id="bbg"></div>
    <div class="bb-wrap"><div class="bb-board" id="bbb">${Array.from({ length: N * N }, (_, i) => `<div class="bb-cell" data-i="${i}"></div>`).join('')}</div></div>
    <div class="bb-tray" id="bbt">${[0, 1, 2].map(i => `<div class="bb-slot" data-i="${i}"></div>`).join('')}</div></div>`;
  const board = document.getElementById('bbb'), wrap = board.parentNode, trayEl = document.getElementById('bbt');
  const sEl = document.getElementById('bbs'), goalEl = document.getElementById('bbg');
  const cellEl = [...board.children], slots = [...trayEl.children], el = (r, c) => cellEl[r * N + c];
  const fx = bbFxLayer(wrap);

  // размеры поля считаем один раз: чтение размеров в разгар анимации заставляет браузер пересчитывать страницу
  let geo = null;
  const measureBoard = () => {
    const w = wrap.getBoundingClientRect(), a = cellEl[0].getBoundingClientRect(), b = cellEl[1].getBoundingClientRect();
    geo = { x: a.left - w.left, y: a.top - w.top, cs: a.width, pitch: b.left - a.left };
  };
  measureBoard();
  const cellX = c => geo.x + c * geo.pitch + geo.cs / 2, cellY = r => geo.y + r * geo.pitch + geo.cs / 2;

  const paint = (r, c, extra) => {
    const e = el(r, c), col = grid[r][c];
    e.className = col ? (extra ? 'bb-cell f ' + extra : 'bb-cell f') : 'bb-cell';
    if (e.style.animationDelay) e.style.animationDelay = '';
    if (col) e.style.setProperty('--c', col); else e.style.removeProperty('--c');
  };
  const drawGoal = () => setGoal(goalEl, score, BB.MILES, mile, got, 'очков');
  const bumpScore = () => {
    cancelAnimationFrame(raf);
    const from = shown, to = score, t0 = performance.now();
    const step = t => {
      const k = Math.max(0, Math.min(1, (t - t0) / 450)), v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (v !== shown) { shown = v; sEl.textContent = U.fmt(v); }
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    if (sEl.animate) sEl.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }], 300);
  };
  // всплывающие надписи
  const floatText = (text, r, c, cls = '') => {
    const f = document.createElement('div');
    f.className = 'bb-float-t ' + cls; f.textContent = text; f.style.left = cellX(c) + 'px'; f.style.top = cellY(r) + 'px';
    wrap.appendChild(f); later(() => f.remove(), 1100);
  };
  const praise = text => {
    const f = document.createElement('div');
    f.className = 'bb-praise'; f.textContent = text;
    wrap.appendChild(f); later(() => f.remove(), 1300);
  };

  // ── лоток с фигурками ──
  const refreshTray = () => slots.forEach((s, i) => s.classList.toggle('no', !!tray[i] && !bbCanPlace(grid, tray[i])));
  const fillTray = () => {
    const cs = Math.max(14, Math.min(22, Math.floor(trayEl.clientWidth / 3 / 5.8)));
    slots.forEach((s, i) => {
      const p = tray[i];
      s.innerHTML = p ? bbPieceHTML(p, cs, 3) : '';
      if (p) { s.firstChild.style.animationDelay = i * 0.09 + 's'; s.firstChild.classList.add('enter'); }
    });
    refreshTray();
  };

  // ── перетаскивание ──
  const metrics = () => {
    const a = cellEl[0].getBoundingClientRect(), b = cellEl[1].getBoundingClientRect();
    return { x0: a.left, y0: a.top, cs: a.width, pitch: b.left - a.left };
  };
  const clearGhost = () => {
    for (const i of marked) paint(Math.floor(i / N), i % N);
    marked = [];
  };
  const showGhost = (p, r, c) => {
    clearGhost();
    if (r === null) return;
    const tmp = grid.map(row => row.slice());
    p.cells.forEach(([dr, dc]) => { tmp[r + dr][c + dc] = p.color; });
    const { rows, cols } = bbLines(tmp);
    p.cells.forEach(([dr, dc]) => { const i = (r + dr) * N + c + dc; cellEl[i].classList.add('gh'); cellEl[i].style.setProperty('--c', p.color); marked.push(i); });
    const mark = i => { cellEl[i].classList.add('hl'); cellEl[i].style.setProperty('--hc', p.color); marked.push(i); };
    rows.forEach(rr => { for (let cc = 0; cc < N; cc++) mark(rr * N + cc); });
    cols.forEach(cc => { for (let rr = 0; rr < N; rr++) mark(rr * N + cc); });
  };
  const move = (x, y) => {
    const d = drag, left = x - d.pw / 2, top = y - d.ph - BB.LIFT;
    d.fl.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    const fr = (top - d.m.y0) / d.m.pitch, fc = (left - d.m.x0) / d.m.pitch;
    const cand = [[Math.floor(fr), Math.floor(fc)], [Math.floor(fr), Math.ceil(fc)], [Math.ceil(fr), Math.floor(fc)], [Math.ceil(fr), Math.ceil(fc)]]
      .map(([r, c]) => ({ r, c, d: Math.hypot(r - fr, c - fc) })).sort((a, b) => a.d - b.d);
    const hit = cand.find(k => k.d < 0.8 && bbFits(grid, d.p, k.r, k.c));
    const key = hit ? hit.r + ',' + hit.c : '';
    if (key !== d.key) {
      d.key = key; d.pos = hit ? [hit.r, hit.c] : null;
      showGhost(d.p, hit ? hit.r : null, hit ? hit.c : 0);
      const now = performance.now();
      if (hit && now - flipT > 90) { flipT = now; sfx('flip'); }
    }
  };
  const onDown = e => {
    if (over || drag) return;
    const slot = e.target.closest('.bb-slot');
    if (!slot) return;
    const i = Number(slot.dataset.i), p = tray[i];
    if (!p || !slot.firstChild) return;
    e.preventDefault();
    const m = metrics(), g = m.pitch - m.cs;
    const fl = document.createElement('div');
    fl.className = 'bb-float';
    fl.innerHTML = bbPieceHTML(p, m.cs, g);
    document.body.appendChild(fl);
    const pw = p.w * m.pitch - g, ph = p.h * m.pitch - g, sr = slot.firstChild.getBoundingClientRect();
    drag = { i, p, fl, pw, ph, m, slot, pos: null, key: null, id: e.pointerId, sx: sr.left, sy: sr.top, k: sr.width / pw };
    fl.style.transform = `translate3d(${sr.left}px, ${sr.top}px, 0) scale(${drag.k})`;
    void fl.offsetWidth;
    fl.classList.add('grow');
    slot.classList.add('lift');
    move(e.clientX, e.clientY);
    later(() => fl.classList.remove('grow'), 160);
    sfx('tap');
  };
  // палец сообщает о движении чаще, чем обновляется экран: двигаем фигурку один раз за кадр
  const onMove = e => {
    if (!drag || e.pointerId !== drag.id) return;
    e.preventDefault();
    mvX = e.clientX; mvY = e.clientY;
    if (!mvRaf) mvRaf = requestAnimationFrame(() => { mvRaf = 0; if (drag) move(mvX, mvY); });
  };
  const onUp = e => {
    if (!drag || e.pointerId !== drag.id) return;
    cancelAnimationFrame(mvRaf); mvRaf = 0;
    if (e.type === 'pointerup') move(e.clientX, e.clientY);
    const d = drag;
    drag = null;
    clearGhost();
    if (d.pos && e.type === 'pointerup') { d.fl.remove(); d.slot.classList.remove('lift'); place(d.i, d.pos[0], d.pos[1]); return; }
    d.fl.classList.add('back');
    d.fl.style.transform = `translate3d(${d.sx}px, ${d.sy}px, 0) scale(${d.k})`;
    setTimeout(() => { d.fl.remove(); d.slot.classList.remove('lift'); }, 230);
  };

  // ── ход ──
  const place = (i, r, c) => {
    const p = tray[i];
    tray[i] = null;
    slots[i].textContent = '';
    p.cells.forEach(([dr, dc], k) => {
      grid[r + dr][c + dc] = p.color;
      paint(r + dr, c + dc, 'new');
      el(r + dr, c + dc).style.animationDelay = k * 0.025 + 's';
    });
    score += p.cells.length;
    sfx('place');
    const { rows, cols } = bbLines(grid), n = rows.length + cols.length;
    const pr = r + (p.h - 1) / 2, pc = c + (p.w - 1) / 2;
    if (n) {
      combo++; idle = 0;
      const pts = Math.round(BB.LINE[Math.min(n, BB.LINE.length - 1)] * (1 + (combo - 1) * 0.5));
      score += pts;
      // клетки сразу пустеют на поле, а исчезают уже на холсте эффектов
      const seen = new Set(), list = [], lines = [], len = geo.pitch * (N - 1) + geo.cs;
      const add = (rr, cc) => {
        const k = rr * N + cc;
        if (seen.has(k)) return;
        seen.add(k);
        list.push({ x: cellX(cc), y: cellY(rr), color: grid[rr][cc], delay: Math.hypot(rr - pr, cc - pc) * 32 });
      };
      rows.forEach(rr => { for (let cc = 0; cc < N; cc++) add(rr, cc); lines.push({ x: geo.x, y: geo.y + rr * geo.pitch, w: len, h: geo.cs }); });
      cols.forEach(cc => { for (let rr = 0; rr < N; rr++) add(rr, cc); lines.push({ x: geo.x + cc * geo.pitch, y: geo.y, w: geo.cs, h: len }); });
      seen.forEach(k => { const rr = Math.floor(k / N), cc = k % N; grid[rr][cc] = null; paint(rr, cc); });
      fx.burst(list, lines, geo.cs);
      sfx('clear', 1 + Math.min(combo - 1, 6) * 0.08);
      floatText('+' + pts, pr, pc, 'big');
      const words = ['', '', 'Отлично! ✨', 'Супер! 🌟', 'Великолепно! 💖', 'Невероятно! 🚀'];
      if (n >= 2) praise(words[Math.min(n, 5)]);
      else if (combo >= 2) praise(`Комбо ×${combo}! 🔥`);
      if (grid.every(row => row.every(x => !x))) { score += 300; later(() => praise('Чистое поле! +300 ✨'), 650); }
    } else {
      if (++idle >= 3) combo = 0;
      floatText('+' + p.cells.length, pr, pc);
    }
    bumpScore();
    while (mile < BB.MILES.length && score >= BB.MILES[mile]) {
      mile++;
      if (giveGameStar(board)) { got++; later(() => { sfx('star'); floatText('+1 ⭐', 3.5, 3.5, 'star'); }, 250); }
    }
    if (!recShown && best0 > 0 && score > best0) { recShown = true; later(() => praise('Новый рекорд! 🏆'), 900); }
    drawGoal();
    if (tray.every(x => !x)) { tray = bbTray(grid); later(fillTray, 200); } else refreshTray();
    if (!tray.some(x => x && bbCanPlace(grid, x))) gameOver();
  };

  const gameOver = () => {
    over = true;
    const rec = score > best0;
    st.best = Math.max(st.best || 0, score);
    save();
    later(() => {
      sfx('lose');
      cellEl.forEach((e, i) => { if (grid[Math.floor(i / N)][i % N]) { e.style.animationDelay = (Math.floor(i / N) * 0.07).toFixed(2) + 's'; e.classList.add('dead'); } });
    }, 700);
    later(() => {
      gameOverBox(`<div class="cele-e">${rec ? '🏆' : '🧱'}</div><h1>${rec ? 'Новый рекорд!' : 'Ходов больше нет'}</h1>
        <p class="g-final">${U.fmt(score)} <small>${U.plural(score, 'очко', 'очка', 'очков')}</small></p>
        ${starsLine(got, `Набери ${U.fmt(BB.MILES[mile] || BB.MILES[0])} очков — получишь ⭐`)}
        <div class="nav-col"><button class="btn big wide" data-act="again">Ещё раз 🔄</button><button class="btn ghost wide" data-go="#games">К играм</button></div>`);
      if (rec && best0 > 0) confetti();
    }, 1900);
  };

  const onResize = () => { measureBoard(); fx.fit(); };
  app.onclick = e => { if (e.target.closest('[data-act="again"]')) { sfx('tap'); blocksRun(); } };
  trayEl.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  window.addEventListener('resize', onResize);
  onLeave(() => {
    cancelAnimationFrame(raf); cancelAnimationFrame(mvRaf);
    fx.stop();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    window.removeEventListener('resize', onResize);
    if (drag) drag.fl.remove();
    document.querySelectorAll('.bb-float').forEach(x => x.remove());
  });
  // для проверок: поставить фигурку без пальца
  window.__bb = { grid, get tray() { return tray; }, place, paint, fx, get score() { return score; } };

  tray = bbTray(grid);
  fillTray();
  drawGoal();
}

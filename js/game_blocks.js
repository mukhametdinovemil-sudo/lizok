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

  app.innerHTML = `<div class="screen bb-screen">
    <header class="top"><button class="icon-btn" data-go="#games" aria-label="Выйти">✕</button>
      <div class="g-score"><b id="bbs">0</b><small>🏆 ${U.fmt(best0)}</small></div><div class="pill">⭐ ${bal()}</div></header>
    <div class="g-goal" id="bbg"></div>
    <div class="bb-wrap"><div class="bb-board" id="bbb">${Array.from({ length: N * N }, (_, i) => `<div class="bb-cell" data-i="${i}"></div>`).join('')}</div></div>
    <div class="bb-tray" id="bbt">${[0, 1, 2].map(i => `<div class="bb-slot" data-i="${i}"></div>`).join('')}</div></div>`;
  const board = document.getElementById('bbb'), wrap = board.parentNode, trayEl = document.getElementById('bbt'), sEl = document.getElementById('bbs');
  const cellEl = [...board.children], el = (r, c) => cellEl[r * N + c];

  const paint = (r, c, extra) => {
    const e = el(r, c), col = grid[r][c];
    e.className = 'bb-cell' + (col ? ' f' : '') + (extra ? ' ' + extra : '');
    e.style.animationDelay = '';
    if (col) e.style.setProperty('--c', col); else e.style.removeProperty('--c');
  };
  const drawGoal = () => { document.getElementById('bbg').innerHTML = goalHTML(score, BB.MILES, mile, got, 'очков'); };
  const bumpScore = () => {
    cancelAnimationFrame(raf);
    const from = shown, to = score, t0 = performance.now();
    const step = t => {
      const k = Math.min(1, (t - t0) / 450);
      shown = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      sEl.textContent = U.fmt(shown);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    sEl.classList.remove('bump'); void sEl.offsetWidth; sEl.classList.add('bump');
  };
  // всплывающие надписи
  const cellXY = (r, c) => { const w = wrap.getBoundingClientRect(), b = el(Math.max(0, Math.min(N - 1, Math.round(r))), Math.max(0, Math.min(N - 1, Math.round(c)))).getBoundingClientRect(); return [b.left - w.left + b.width / 2, b.top - w.top + b.height / 2]; };
  const floatText = (text, r, c, cls = '') => {
    const [x, y] = cellXY(r, c), f = document.createElement('div');
    f.className = 'bb-float-t ' + cls; f.textContent = text; f.style.left = x + 'px'; f.style.top = y + 'px';
    wrap.appendChild(f); later(() => f.remove(), 1100);
  };
  const praise = text => {
    const f = document.createElement('div');
    f.className = 'bb-praise'; f.textContent = text;
    wrap.appendChild(f); later(() => f.remove(), 1300);
  };
  const sparkle = (r, c, color) => {
    const [x, y] = cellXY(r, c);
    for (let k = 0; k < 3; k++) {
      const s = document.createElement('i'), ang = Math.random() * Math.PI * 2, dist = 22 + Math.random() * 34;
      s.className = 'bb-spark';
      s.style.cssText = `left:${x}px;top:${y}px;--dx:${(Math.cos(ang) * dist).toFixed(1)}px;--dy:${(Math.sin(ang) * dist).toFixed(1)}px;background:${color}`;
      wrap.appendChild(s); later(() => s.remove(), 750);
    }
  };

  const drawTray = anim => {
    const cs = Math.max(14, Math.min(22, Math.floor(trayEl.clientWidth / 3 / 5.8))), g = 3;
    [...trayEl.children].forEach((slot, i) => {
      const p = tray[i];
      slot.innerHTML = p ? bbPieceHTML(p, cs, g) : '';
      slot.classList.toggle('no', !!p && !bbCanPlace(grid, p));
      if (anim && p) { const pc = slot.firstChild; pc.style.animationDelay = i * 0.09 + 's'; pc.classList.add('enter'); }
    });
  };

  // ── перетаскивание ──
  const metrics = () => {
    const a = cellEl[0].getBoundingClientRect(), b = cellEl[1].getBoundingClientRect();
    return { x0: a.left, y0: a.top, cs: a.width, pitch: b.left - a.left };
  };
  const clearGhost = () => {
    board.querySelectorAll('.gh, .hl').forEach(e => { const i = Number(e.dataset.i); paint(Math.floor(i / N), i % N); });
  };
  const showGhost = (p, r, c) => {
    clearGhost();
    if (r === null) return;
    const tmp = grid.map(row => row.slice());
    p.cells.forEach(([dr, dc]) => { tmp[r + dr][c + dc] = p.color; });
    const { rows, cols } = bbLines(tmp);
    p.cells.forEach(([dr, dc]) => { const e = el(r + dr, c + dc); e.classList.add('gh'); e.style.setProperty('--c', p.color); });
    rows.forEach(rr => { for (let cc = 0; cc < N; cc++) { const e = el(rr, cc); e.classList.add('hl'); e.style.setProperty('--hc', p.color); } });
    cols.forEach(cc => { for (let rr = 0; rr < N; rr++) { const e = el(rr, cc); e.classList.add('hl'); e.style.setProperty('--hc', p.color); } });
  };
  const move = (x, y) => {
    const d = drag, left = x - d.pw / 2, top = y - d.ph - BB.LIFT;
    d.fl.style.transform = `translate(${left}px, ${top}px)`;
    const fr = (top - d.m.y0) / d.m.pitch, fc = (left - d.m.x0) / d.m.pitch;
    const cand = [[Math.floor(fr), Math.floor(fc)], [Math.floor(fr), Math.ceil(fc)], [Math.ceil(fr), Math.floor(fc)], [Math.ceil(fr), Math.ceil(fc)]]
      .map(([r, c]) => ({ r, c, d: Math.hypot(r - fr, c - fc) })).sort((a, b) => a.d - b.d);
    const hit = cand.find(k => k.d < 0.8 && bbFits(grid, d.p, k.r, k.c));
    const key = hit ? hit.r + ',' + hit.c : '';
    if (key !== d.key) {
      d.key = key; d.pos = hit ? [hit.r, hit.c] : null;
      showGhost(d.p, hit ? hit.r : null, hit ? hit.c : 0);
      if (hit) sfx('flip');
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
    fl.style.transform = `translate(${sr.left}px, ${sr.top}px) scale(${drag.k})`;
    void fl.offsetWidth;
    fl.classList.add('grow');
    slot.classList.add('lift');
    move(e.clientX, e.clientY);
    later(() => fl.classList.remove('grow'), 160);
    sfx('tap');
  };
  const onMove = e => { if (drag && e.pointerId === drag.id) { e.preventDefault(); move(e.clientX, e.clientY); } };
  const onUp = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    clearGhost();
    if (d.pos) { d.fl.remove(); d.slot.classList.remove('lift'); place(d.i, d.pos[0], d.pos[1]); return; }
    d.fl.classList.add('back');
    d.fl.style.transform = `translate(${d.sx}px, ${d.sy}px) scale(${d.k})`;
    setTimeout(() => { d.fl.remove(); d.slot.classList.remove('lift'); }, 230);
  };

  // ── ход ──
  const place = (i, r, c) => {
    const p = tray[i];
    tray[i] = null;
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
      const set = new Map();
      rows.forEach(rr => { for (let cc = 0; cc < N; cc++) set.set(rr * N + cc, [rr, cc]); });
      cols.forEach(cc => { for (let rr = 0; rr < N; rr++) set.set(rr * N + cc, [rr, cc]); });
      const cl = [];
      set.forEach(([rr, cc]) => { cl.push([rr, cc, grid[rr][cc]]); });
      cl.forEach(([rr, cc]) => { grid[rr][cc] = null; });
      cl.forEach(([rr, cc, col]) => {
        const e = el(rr, cc), delay = Math.hypot(rr - pr, cc - pc) * 0.035;
        e.classList.remove('new'); e.classList.add('clr');
        e.style.animationDelay = delay.toFixed(3) + 's';
        later(() => sparkle(rr, cc, col), delay * 1000 + 120);
        later(() => { if (!grid[rr][cc] && e.classList.contains('clr')) paint(rr, cc); }, delay * 1000 + 520);
      });
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
    if (tray.every(x => !x)) { tray = bbTray(grid); later(() => drawTray(true), 200); } else drawTray(false);
    if (!tray.some(x => x && bbCanPlace(grid, x))) gameOver();
  };

  const gameOver = () => {
    over = true;
    const rec = score > best0;
    st.best = Math.max(st.best || 0, score);
    save();
    later(() => {
      sfx('lose');
      cellEl.forEach((e, i) => { if (e.classList.contains('f')) { e.style.animationDelay = (Math.floor(i / N) * 0.07).toFixed(2) + 's'; e.classList.add('dead'); } });
    }, 700);
    later(() => {
      gameOverBox(`<div class="cele-e">${rec ? '🏆' : '🧱'}</div><h1>${rec ? 'Новый рекорд!' : 'Ходов больше нет'}</h1>
        <p class="g-final">${U.fmt(score)} <small>${U.plural(score, 'очко', 'очка', 'очков')}</small></p>
        ${starsLine(got, `Набери ${U.fmt(BB.MILES[mile] || BB.MILES[0])} очков — получишь ⭐`)}
        <div class="nav-col"><button class="btn big wide" data-act="again">Ещё раз 🔄</button><button class="btn ghost wide" data-go="#games">К играм</button></div>`);
      if (rec && best0 > 0) confetti();
    }, 1900);
  };

  app.onclick = e => { if (e.target.closest('[data-act="again"]')) { sfx('tap'); blocksRun(); } };
  trayEl.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  onLeave(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    if (drag) drag.fl.remove();
    document.querySelectorAll('.bb-float').forEach(x => x.remove());
  });
  // для проверок: поставить фигурку без пальца
  window.__bb = { grid, get tray() { return tray; }, place, get score() { return score; } };

  tray = bbTray(grid);
  drawTray(true);
  drawGoal();
}

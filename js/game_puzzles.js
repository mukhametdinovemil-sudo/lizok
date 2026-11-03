'use strict';
// Головоломки для отдыха (тренируют логику): Судоку, Фонарики, «Что дальше?», Пятнашки.
// За каждую решённую головоломку +1 ⭐ (общий дневной предел ECON.cap на все игры для отдыха).
// Уровень растёт сам: чем больше решено, тем сложнее. Подключается до app.js.

const PUZ = [
  { id: 'sudoku', e: '🔢', t: 'Судоку', s: 'Все значки разные', cls: 'pz1' },
  { id: 'lights', e: '💡', t: 'Фонарики', s: 'Зажги все фонарики', cls: 'pz2' },
  { id: 'next', e: '🔮', t: 'Что дальше?', s: 'Найди закономерность', cls: 'pz3' },
  { id: 'slide', e: '🧩', t: 'Пятнашки', s: 'Расставь по порядку', cls: 'pz4' },
];
const puzSolved = id => ((S.gm.puz || {})[id] || 0);

function puzzles(arg) {
  stopTimers(); leaveGame();
  S.gm.puz = S.gm.puz || {};
  const runs = { sudoku: sudokuRun, lights: lightsRun, next: nextRun, slide: slideRun };
  if (runs[arg]) return runs[arg]();
  app.innerHTML = `<div class="screen">${header('🧠 Головоломки', '#games')}
    ${mascotHTML('Головоломки тренируют логику — как у настоящих учёных! За каждую решённую — звёздочка.')}
    <div class="g-grid">${PUZ.map(p => gcard('#puzzles/' + p.id, p.e, p.t, `${p.s}<br>Уровень ${puzSolved(p.id) + 1}`, '', 'pz ' + p.cls)).join('')}</div>
    <p class="muted center">${gameStarsLeft() ? `Сегодня из игр для отдыха можно получить ещё ${gameStarsLeft()} ⭐` : 'Звёзды из игр на сегодня собраны — решаем для удовольствия 💖'}</p></div>`;
}
function puzFrame(id, body) {
  const p = PUZ.find(x => x.id === id);
  app.innerHTML = `<div class="screen pz-screen">${header(`${p.e} ${p.t}`, '#puzzles')}
    <div class="pz-lvl">Уровень ${puzSolved(id) + 1}</div>${body}</div>`;
  app.onclick = e => { if (e.target.closest('[data-act="more"]')) { sfx('tap'); puzzles(id); } };
}
function puzWin(id, from, msg) {
  S.gm.puz[id] = puzSolved(id) + 1;
  const got = giveGameStar(from);
  save();
  sfx('win');
  later(confetti, 300);
  later(() => gameOverBox(`<div class="cele-e">🎉</div><h1>Решено!</h1><p>${msg}</p>${starsLine(got, '')}
    <div class="nav-col"><button class="btn big wide" data-act="more">Следующая ➜</button><button class="btn ghost wide" data-go="#puzzles">К головоломкам</button></div>`), 1200);
}

// ═════════════ Судоку ═════════════
const SDK_FRUIT = ['🍓', '🍋', '🍇', '🍏', '🍊', '🍒'];
function sdkLevel(n) {
  if (n < 3) return { N: 4, br: 2, bc: 2, holes: 6, fruit: true };
  if (n < 6) return { N: 4, br: 2, bc: 2, holes: 9, fruit: true };
  if (n < 9) return { N: 4, br: 2, bc: 2, holes: 11, fruit: false };
  if (n < 13) return { N: 6, br: 2, bc: 3, holes: 15, fruit: true };
  if (n < 18) return { N: 6, br: 2, bc: 3, holes: 20, fruit: false };
  return { N: 6, br: 2, bc: 3, holes: 24, fruit: false };
}
// готовое решение: N×N, квадратики br строк × bc столбиков
function sdkSolution(N, br, bc) {
  const perm = U.shuffle([...Array(N).keys()]);
  const rows = U.shuffle([...Array(bc).keys()]).flatMap(b => U.shuffle([...Array(br).keys()]).map(i => b * br + i));
  const cols = U.shuffle([...Array(br).keys()]).flatMap(s => U.shuffle([...Array(bc).keys()]).map(j => s * bc + j));
  const base = (r, c) => (bc * (r % br) + Math.floor(r / br) + c) % N;
  return rows.flatMap(r => cols.map(c => perm[base(r, c)]));
}
const sdkOk = (cells, N, br, bc, i, v) => {
  const r = Math.floor(i / N), c = i % N;
  for (let k = 0; k < N; k++) if ((k !== c && cells[r * N + k] === v) || (k !== r && cells[k * N + c] === v)) return false;
  const r0 = r - r % br, c0 = c - c % bc;
  for (let a = 0; a < br; a++) for (let b = 0; b < bc; b++) { const j = (r0 + a) * N + c0 + b; if (j !== i && cells[j] === v) return false; }
  return true;
};
// сколько решений (считаем до limit)
function sdkCount(grid, N, br, bc, limit = 2) {
  const cells = grid.slice();
  let count = 0;
  const rec = () => {
    const i = cells.indexOf(-1);
    if (i < 0) return ++count >= limit;
    for (let v = 0; v < N; v++) {
      if (!sdkOk(cells, N, br, bc, i, v)) continue;
      cells[i] = v;
      if (rec()) { cells[i] = -1; return true; }
      cells[i] = -1;
    }
    return false;
  };
  rec();
  return count;
}
// головоломка с единственным решением
function sdkMake(N, br, bc, holes) {
  const sol = sdkSolution(N, br, bc), puz = sol.slice();
  let removed = 0;
  for (const i of U.shuffle([...Array(N * N).keys()])) {
    if (removed >= holes) break;
    const keep = puz[i];
    puz[i] = -1;
    if (sdkCount(puz, N, br, bc) === 1) removed++; else puz[i] = keep;
  }
  return { sol, puz };
}
function sudokuRun() {
  stopTimers(); leaveGame();
  const L = sdkLevel(puzSolved('sudoku')), { N, br, bc } = L;
  const { sol, puz } = sdkMake(N, br, bc, L.holes);
  const cur = puz.slice(), fixed = puz.map(v => v >= 0);
  const sym = v => (v < 0 ? '' : L.fruit ? SDK_FRUIT[v] : String(v + 1));
  let sel = fixed.indexOf(false), hints = 3, done = false;
  const cells = cur.map((v, i) => {
    const r = Math.floor(i / N), c = i % N;
    const cls = ['sdk-c in', fixed[i] ? 'fx' : '', (c + 1) % bc === 0 && c < N - 1 ? 'br' : '', (r + 1) % br === 0 && r < N - 1 ? 'bb' : '', c === N - 1 ? 'lc' : '', r === N - 1 ? 'lr' : ''].join(' ');
    return `<button class="${cls}" data-i="${i}" style="--d:${((r + c) * 0.04).toFixed(2)}s">${sym(v)}</button>`;
  }).join('');
  const boxName = br === bc ? `квадратике ${br}×${bc}` : `прямоугольнике ${br}×${bc}`;
  puzFrame('sudoku', `${mascotHTML(`В каждом ряду, столбике и ${boxName} все ${L.fruit ? 'значки' : 'числа'} разные. Нажми на пустую клетку, потом на ${L.fruit ? 'значок' : 'число'} внизу.`)}
    <div class="sdk n${N}" id="sdk" style="--n:${N}">${cells}</div>
    <div class="sdk-pad" style="--n:${N + 1}">${[...Array(N).keys()].map(v => `<button class="sdk-k" data-v="${v}">${sym(v)}</button>`).join('')}<button class="sdk-k del" data-v="-1" aria-label="Стереть">⌫</button></div>
    <button class="btn ghost wide" data-act="hint" id="sdh">💡 Подсказка (${hints})</button>`);
  const box = document.getElementById('sdk'), cEl = [...box.children];
  const peers = (a, b) => {
    const ra = Math.floor(a / N), ca = a % N, rb = Math.floor(b / N), cb = b % N;
    return ra === rb || ca === cb || (Math.floor(ra / br) === Math.floor(rb / br) && Math.floor(ca / bc) === Math.floor(cb / bc));
  };
  const draw = () => {
    cEl.forEach((e, i) => {
      e.textContent = sym(cur[i]);
      e.classList.toggle('sel', i === sel);
      e.classList.toggle('peer', sel >= 0 && i !== sel && peers(i, sel));
      e.classList.toggle('same', sel >= 0 && cur[sel] >= 0 && cur[i] === cur[sel] && i !== sel);
      e.classList.toggle('bad', cur[i] >= 0 && !sdkOk(cur, N, br, bc, i, cur[i]));
    });
  };
  const setVal = (i, v, cls = 'pop') => {
    cur[i] = v;
    const e = cEl[i];
    e.classList.remove('pop', 'hinted'); void e.offsetWidth;
    if (v >= 0) e.classList.add(cls);
    draw();
    if (cur.every(x => x >= 0) && cur.every((x, j) => sdkOk(cur, N, br, bc, j, x))) {
      done = true; sel = -1; draw();
      cEl.forEach(x => x.classList.add('win'));
      puzWin('sudoku', box, N === 4 ? 'Все значки на своих местах!' : 'Большое судоку решено — ты настоящий мастер логики!');
    }
  };
  draw();
  later(() => cEl.forEach(x => x.classList.remove('in')), 1300);
  const prevClick = app.onclick;
  app.onclick = e => {
    prevClick(e);
    if (done) return;
    const c = e.target.closest('.sdk-c'), k = e.target.closest('.sdk-k'), h = e.target.closest('[data-act="hint"]');
    if (c) { sel = Number(c.dataset.i); sfx('tap'); draw(); return; }
    if (k && sel >= 0 && !fixed[sel]) {
      const v = Number(k.dataset.v);
      setVal(sel, v);
      if (v >= 0) sfx(cEl[sel] && cEl[sel].classList.contains('bad') ? 'wrong' : 'place');
      return;
    }
    if (h && hints > 0) {
      const wrong = i => !fixed[i] && cur[i] !== sol[i];
      const i = sel >= 0 && wrong(sel) ? sel : cur.findIndex((x, j) => wrong(j));
      if (i < 0) return;
      hints--; sel = i;
      document.getElementById('sdh').textContent = `💡 Подсказка (${hints})`;
      if (!hints) document.getElementById('sdh').disabled = true;
      sfx('candy');
      setVal(i, sol[i], 'hinted');
    }
  };
}

// ═════════════ Фонарики ═════════════
function lightsLevel(n) {
  if (n < 2) return { N: 3, k: 2 };
  if (n < 5) return { N: 3, k: 3 };
  if (n < 9) return { N: 4, k: 4 };
  if (n < 14) return { N: 5, k: 5 };
  return { N: 5, k: 7 };
}
function lightsRun() {
  stopTimers(); leaveGame();
  const { N, k } = lightsLevel(puzSolved('lights'));
  const on = Array(N * N).fill(true);
  const around = i => {
    const r = Math.floor(i / N), c = i % N;
    return [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [r + a, c + b]).filter(([y, x]) => y >= 0 && y < N && x >= 0 && x < N).map(([y, x]) => y * N + x);
  };
  const press = (arr, i) => around(i).forEach(j => { arr[j] = !arr[j]; });
  let orig = [];
  do { on.fill(true); orig = U.shuffle([...Array(N * N).keys()]).slice(0, k); orig.forEach(i => press(on, i)); } while (on.every(Boolean));
  const need = new Set(orig); // какие фонарики ещё надо нажать (подсказка)
  let moves = 0, done = false;
  puzFrame('lights', `${mascotHTML('Нажми на фонарик — переключатся он и его соседи сверху, снизу, слева и справа. Зажги все фонарики!')}
    <div class="lights" id="lt" style="--n:${N}">${on.map((v, i) => `<button class="lamp in ${v ? 'on' : ''}" data-i="${i}" style="--d:${((Math.floor(i / N) + i % N) * 0.05).toFixed(2)}s"><i></i></button>`).join('')}</div>
    <div class="pz-row"><span class="pill" id="ltm">Ходов: 0</span><button class="btn ghost small" data-act="hint">💡 Подсказка</button></div>`);
  const box = document.getElementById('lt'), lEl = [...box.children];
  later(() => lEl.forEach(x => x.classList.remove('in')), 1300);
  const draw = changed => {
    lEl.forEach((e, i) => {
      e.classList.toggle('on', on[i]);
      if (changed && changed.includes(i)) { e.classList.remove('flip'); void e.offsetWidth; e.classList.add('flip'); }
    });
    document.getElementById('ltm').textContent = 'Ходов: ' + moves;
  };
  const prevClick = app.onclick;
  app.onclick = e => {
    prevClick(e);
    if (done) return;
    const b = e.target.closest('.lamp');
    if (b) {
      const i = Number(b.dataset.i), ch = around(i);
      press(on, i);
      if (need.has(i)) need.delete(i); else need.add(i);
      moves++;
      lEl.forEach(x => x.classList.remove('tip'));
      draw(ch);
      sfx('flip', on[i] ? 1.3 : 0.9);
      if (on.every(Boolean)) {
        done = true;
        lEl.forEach(x => x.classList.add('win'));
        puzWin('lights', box, `Все фонарики горят! Ходов: ${moves}.`);
      }
      return;
    }
    if (e.target.closest('[data-act="hint"]') && need.size) {
      const i = [...need][0];
      lEl.forEach(x => x.classList.remove('tip'));
      lEl[i].classList.add('tip');
      sfx('candy');
    }
  };
}

// ═════════════ Что дальше? (закономерности) ═════════════
const NX_SHAPES = [['🔴', '🟠', '🟡', '🟢', '🔵', '🟣'], ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪'], ['❤️', '🧡', '💛', '💚', '💙', '💜']];
const NX_THEMES = [['🐱', '🐶', '🐰', '🐻', '🦊', '🐼'], ['🍓', '🍋', '🍇', '🍏', '🍊', '🍒'], ['🌸', '🌻', '🌷', '🍀', '🌼', '🍄'], ['⭐', '🌙', '☀️', '☁️', '⚡', '❄️'], NX_SHAPES[0], NX_SHAPES[2]];
const NX_ARROWS = ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'];
function nextGen(n) {
  const lvl = n < 2 ? 1 : n < 5 ? 2 : n < 9 ? 3 : 4;
  const kind = U.pick({ 1: ['motif'], 2: ['motif', 'motif', 'arrow'], 3: ['two', 'two', 'motif', 'arrow'], 4: ['two', 'motif', 'arrow', 'two'] }[lvl]);
  const seq = [];
  let pool = [], ask, distract = null;
  if (kind === 'motif') {
    const motif = U.pick(lvl === 1 ? ['AB', 'AAB', 'ABB', 'AB'] : ['ABC', 'AABB', 'ABCB', 'ABAC', 'AABC', 'ABBC']);
    const letters = [...new Set(motif)], theme = U.shuffle(U.pick(NX_THEMES)), map = {};
    letters.forEach((l, i) => { map[l] = theme[i]; });
    const len = Math.min(9, Math.max(6, motif.length * 2 + 1));
    for (let i = 0; i <= len; i++) seq.push(map[motif[i % motif.length]]);
    pool = theme.slice(0, letters.length + 2);
  } else if (kind === 'arrow') {
    const step = U.pick(lvl === 2 ? [2, 6] : [2, 6, 1, 7, 3]), s0 = U.rnd(0, 7);
    for (let i = 0; i <= 6; i++) seq.push(NX_ARROWS[(s0 + i * step) % 8]);
    pool = NX_ARROWS;
  } else {
    const [p1, p2] = U.pick([[2, 3], [3, 2]]);
    const sh = U.shuffle([0, 1, 2]).slice(0, p1), co = U.shuffle([0, 1, 2, 3, 4, 5]).slice(0, p2);
    for (let i = 0; i <= 7; i++) seq.push(NX_SHAPES[sh[i % p1]][co[i % p2]]);
    pool = NX_SHAPES.flat();
    // похожие ответы: та же фигура другого цвета, тот же цвет другой фигуры
    distract = i => [NX_SHAPES[sh[i % p1]][co[(i + 1) % p2]], NX_SHAPES[sh[(i + 1) % p1]][co[i % p2]], NX_SHAPES[sh[(i + 1) % p1]][co[(i + 1) % p2]]];
  }
  ask = seq.length - 1;
  if (lvl === 4 && kind !== 'arrow' && Math.random() < 0.5) ask = U.rnd(2, seq.length - 3);
  const ans = seq[ask];
  const opts = [ans];
  const add = x => { if (opts.length < 4 && !opts.includes(x)) opts.push(x); };
  if (distract) distract(ask).forEach(add);
  U.shuffle(pool).forEach(add);
  return { seq, ask, ans, opts: U.shuffle(opts), kind };
}
function nextRun() {
  stopTimers(); leaveGame();
  const n = puzSolved('next'), total = 5;
  let q = 0, cur = null, lock = false, slips = 0, done = false;
  puzFrame('next', `${mascotHTML('Посмотри на ряд и найди правило. Какая картинка должна стоять вместо «?»')}
    <div class="dots" id="nxd"></div>
    <div class="card nx-card" id="nx"></div>`);
  const drawQ = () => {
    cur = nextGen(n); lock = false;
    document.getElementById('nxd').innerHTML = Array.from({ length: total }, (_, i) => `<i class="${i < q ? 'past' : i === q ? 'on' : ''}"></i>`).join('');
    const show = cur.ask === cur.seq.length - 1 ? cur.seq.slice(0, -1).concat(['?']) : cur.seq.map((x, i) => (i === cur.ask ? '?' : x));
    document.getElementById('nx').innerHTML = `<div class="nx-seq">${show.map((x, i) => `<span class="nx-i ${x === '?' ? 'q' : ''}" style="--d:${(i * 0.07).toFixed(2)}s">${x}</span>`).join('')}</div>
      <div class="nx-opts">${cur.opts.map((x, i) => `<button class="nx-o" data-o="${i}" style="--d:${(0.5 + i * 0.08).toFixed(2)}s">${x}</button>`).join('')}</div>`;
  };
  drawQ();
  window.__nx = { get cur() { return cur; } }; // для автопроверки
  const prevClick = app.onclick;
  app.onclick = e => {
    prevClick(e);
    const b = e.target.closest('.nx-o');
    if (!b || lock || done || b.disabled) return;
    if (cur.opts[Number(b.dataset.o)] === cur.ans) {
      lock = true;
      b.classList.add('good');
      const qs = document.querySelector('.nx-i.q');
      qs.textContent = cur.ans; qs.classList.remove('q'); qs.classList.add('got');
      sfx('clear');
      q++;
      if (q >= total) {
        done = true;
        document.getElementById('nxd').innerHTML = Array.from({ length: total }, () => '<i class="past"></i>').join('');
        puzWin('next', document.getElementById('nx'), slips ? `Все ${total} закономерностей найдены!` : `Все ${total} — без единой ошибки! 🌟`);
      } else later(drawQ, 900);
    } else {
      slips++;
      b.classList.add('nope'); b.disabled = true;
      sfx('wrong');
    }
  };
}

// ═════════════ Пятнашки ═════════════
function slideLevel(n) {
  if (n < 3) return { N: 3, mv: 10 };
  if (n < 6) return { N: 3, mv: 24 };
  if (n < 10) return { N: 3, mv: 60 };
  return { N: 4, mv: 40 + Math.min(40, (n - 10) * 5) };
}
function slideRun() {
  stopTimers(); leaveGame();
  const { N, mv } = slideLevel(puzSolved('slide')), NN = N * N;
  const goal = [...Array(NN).keys()].map(i => (i + 1) % NN); // 1, 2, …, NN-1, пусто
  const b = goal.slice();
  const nb = i => { const r = Math.floor(i / N), c = i % N, out = []; if (r > 0) out.push(i - N); if (r < N - 1) out.push(i + N); if (c > 0) out.push(i - 1); if (c < N - 1) out.push(i + 1); return out; };
  let empty = NN - 1;
  do {
    let prev = -1;
    for (let k = 0; k < mv; k++) { const j = U.pick(nb(empty).filter(x => x !== prev)); b[empty] = b[j]; b[j] = 0; prev = empty; empty = j; }
  } while (b.every((v, i) => v === goal[i]));
  let moves = 0, done = false;
  const pos = t => b.indexOf(t);
  puzFrame('slide', `${mascotHTML(`Нажимай на плитки рядом с пустым местом, чтобы числа встали по порядку: 1, 2, 3… Пустое место — в правом нижнем углу.`)}
    <div class="slide n${N}" id="sl" style="--n:${N}">${[...Array(NN - 1).keys()].map(k => `<button class="sl-t" data-t="${k + 1}" style="--c:${BB_COLORS[k % BB_COLORS.length]};--d:${(k * 0.04).toFixed(2)}s"><span>${k + 1}</span></button>`).join('')}</div>
    <div class="pz-row"><span class="pill" id="slm">Ходов: 0</span></div>`);
  const box = document.getElementById('sl'), tEl = {};
  box.querySelectorAll('.sl-t').forEach(e => { tEl[e.dataset.t] = e; });
  const draw = () => {
    for (let t = 1; t < NN; t++) {
      const i = pos(t), e = tEl[t];
      e.style.left = (i % N) * (100 / N) + '%';
      e.style.top = Math.floor(i / N) * (100 / N) + '%';
      e.classList.toggle('ok', i === t - 1);
    }
    document.getElementById('slm').textContent = 'Ходов: ' + moves;
  };
  draw();
  const prevClick = app.onclick;
  app.onclick = e => {
    prevClick(e);
    const t = e.target.closest('.sl-t');
    if (!t || done) return;
    const i = pos(Number(t.dataset.t)), ri = Math.floor(i / N), ci = i % N, re = Math.floor(empty / N), ce = empty % N;
    if (ri !== re && ci !== ce) { t.classList.remove('nope'); void t.offsetWidth; t.classList.add('nope'); return; }
    // двигаем все плитки между пустым местом и нажатой
    const step = ri === re ? (ci < ce ? -1 : 1) : (ri < re ? -N : N);
    while (empty !== i) { const j = empty + step; b[empty] = b[j]; b[j] = 0; empty = j; }
    moves++;
    sfx('flip');
    draw();
    if (b.every((v, k) => v === goal[k])) {
      done = true;
      later(() => Object.values(tEl).forEach(x => x.classList.add('win')), 200);
      puzWin('slide', box, `Все числа по порядку! Ходов: ${moves}.`);
    }
  };
}

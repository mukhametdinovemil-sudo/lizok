'use strict';
// Развлечения: комната Пинки (магазин), приз от брата, сундучок дня, игра «Шарики», анимации.
// Подключается раньше app.js; использует S, app, save, header, toast, confetti, beep и др. из app.js во время вызова.

const SHOP = [
  // наряды: слоты head | face | neck | hand
  { id: 'bow', kind: 'wear', slot: 'head', e: '🎀', name: 'Бантик', price: 15 },
  { id: 'flower', kind: 'wear', slot: 'head', e: '🌸', name: 'Цветочек', price: 20 },
  { id: 'phones', kind: 'wear', slot: 'head', e: '🎧', name: 'Наушники', price: 35 },
  { id: 'hat', kind: 'wear', slot: 'head', e: '🎩', name: 'Шляпа', price: 40 },
  { id: 'crown', kind: 'wear', slot: 'head', e: '👑', name: 'Корона', price: 80 },
  { id: 'glasses', kind: 'wear', slot: 'face', e: '👓', name: 'Очки отличницы', price: 25 },
  { id: 'sun', kind: 'wear', slot: 'face', e: '🕶️', name: 'Тёмные очки', price: 35 },
  { id: 'scarf', kind: 'wear', slot: 'neck', e: '🧣', name: 'Шарфик', price: 20 },
  { id: 'beads', kind: 'wear', slot: 'neck', e: '📿', name: 'Бусы', price: 30 },
  { id: 'gem', kind: 'wear', slot: 'neck', e: '💎', name: 'Кулон', price: 60 },
  { id: 'lolly', kind: 'wear', slot: 'hand', e: '🍭', name: 'Леденец', price: 10 },
  { id: 'balloon', kind: 'wear', slot: 'hand', e: '🎈', name: 'Шарик', price: 15 },
  { id: 'book', kind: 'wear', slot: 'hand', e: '📘', name: 'Учебник', price: 20 },
  { id: 'wand', kind: 'wear', slot: 'hand', e: '🪄', name: 'Волшебная палочка', price: 50 },
  // мебель: слоты ceil | wallL | wallR | floorL | floorR | rug
  { id: 'lamp', kind: 'room', slot: 'ceil', e: '💡', name: 'Лампа', price: 15 },
  { id: 'disco', kind: 'room', slot: 'ceil', e: '🪩', name: 'Диско-шар', price: 60 },
  { id: 'pic', kind: 'room', slot: 'wallL', e: '🖼️', name: 'Картина', price: 25 },
  { id: 'clock', kind: 'room', slot: 'wallL', e: '🕰️', name: 'Часы', price: 25 },
  { id: 'rainbow', kind: 'room', slot: 'wallR', e: '🌈', name: 'Радуга', price: 40 },
  { id: 'planet', kind: 'room', slot: 'wallR', e: '🪐', name: 'Планета', price: 45 },
  { id: 'bed', kind: 'room', slot: 'floorL', e: '🛏️', name: 'Кроватка', price: 50 },
  { id: 'piano', kind: 'room', slot: 'floorL', e: '🎹', name: 'Пианино', price: 70 },
  { id: 'plant', kind: 'room', slot: 'floorR', e: '🪴', name: 'Цветок в горшке', price: 20 },
  { id: 'teddy', kind: 'room', slot: 'floorR', e: '🧸', name: 'Мишка', price: 30 },
  { id: 'cup', kind: 'room', slot: 'floorR', e: '🏆', name: 'Кубок', price: 90 },
  { id: 'rug', kind: 'room', slot: 'rug', e: '🟣', name: 'Коврик', price: 15 },
  // обои
  { id: 'w-pink', kind: 'wall', e: '🩷', name: 'Розовые', price: 0, bg: 'linear-gradient(#ffe3ef,#ffc2dc)' },
  { id: 'w-lav', kind: 'wall', e: '💜', name: 'Лавандовые', price: 20, bg: 'linear-gradient(#efe4ff,#d0bfff)' },
  { id: 'w-mint', kind: 'wall', e: '💚', name: 'Мятные', price: 20, bg: 'linear-gradient(#e6fcf5,#b2f2bb)' },
  { id: 'w-sky', kind: 'wall', e: '💙', name: 'Небо', price: 30, bg: 'linear-gradient(#e7f5ff,#a5d8ff)' },
  { id: 'w-space', kind: 'wall', e: '🌌', name: 'Космос', price: 50, bg: 'radial-gradient(circle at 30% 20%,#7048e8,#2b1a5a)' },
];
const ITEM = Object.fromEntries(SHOP.map(i => [i.id, i]));
const bal = () => Math.max(0, S.stars - S.spent);

// ═════════════ Пинки в нарядах ═════════════
function pinkyHTML(cls = '') {
  const eq = S.equip || {};
  return `<div class="pinky ${cls}"><img src="img/pinky.svg" alt="Пинки">${['head', 'face', 'neck', 'hand']
    .map(s => (eq[s] && ITEM[eq[s]] ? `<span class="acc acc-${s}">${ITEM[eq[s]].e}</span>` : '')).join('')}</div>`;
}

// ═════════════ Общие анимации ═════════════
function overlay(html, ms, cb) {
  const o = document.createElement('div');
  o.className = 'overlay';
  o.innerHTML = html;
  document.body.appendChild(o);
  let done = false;
  const close = () => {
    if (done) return;
    done = true;
    o.classList.add('out');
    setTimeout(() => o.remove(), 300);
    if (cb) cb();
  };
  o.addEventListener('click', close);
  if (ms) setTimeout(close, ms);
  return o;
}
function rocketTo(t) {
  overlay(`<div class="sky"><i class="st s1">✦</i><i class="st s2">✦</i><i class="st s3">✦</i>
    <div class="rocket"><span class="rk">🚀</span><img src="img/pinky.svg" alt=""></div>
    <div class="ov-text">Летим на остров<br><b>«${t.title}»</b> ${t.emoji}</div></div>`, 2300);
}
function celebrate(emoji, title, sub) {
  overlay(`<div class="cele"><div class="cele-e">${emoji}</div><h1>${title}</h1><p>${sub}</p><button class="btn big">Ура! 🎉</button></div>`, 0);
  confetti();
}
function flyStar() {
  const from = document.querySelector('.ans-row, .choices'), to = document.querySelector('.top .pill');
  if (!from || !to) return;
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
  const s = document.createElement('div');
  s.className = 'fly-star';
  s.textContent = '⭐';
  s.style.left = x0 + 'px';
  s.style.top = y0 + 'px';
  document.body.appendChild(s);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    s.style.transform = `translate(${b.left + b.width / 2 - x0}px, ${b.top + b.height / 2 - y0}px) scale(.5) rotate(360deg)`;
    s.style.opacity = '0.4';
  }));
  setTimeout(() => {
    s.remove();
    to.textContent = '⭐ ' + bal();
    to.classList.remove('bump'); void to.offsetWidth; to.classList.add('bump');
  }, 750);
}

// ═════════════ Комната Пинки ═════════════
const ownedIt = it => it.price === 0 || S.owned.includes(it.id);
const isOn = it => (it.kind === 'wear' ? S.equip[it.slot] === it.id : it.kind === 'room' ? S.room[it.slot] === it.id : (S.wall || 'w-pink') === it.id);
function toggleIt(it) {
  if (it.kind === 'wear') S.equip[it.slot] = S.equip[it.slot] === it.id ? null : it.id;
  else if (it.kind === 'room') S.room[it.slot] = S.room[it.slot] === it.id ? null : it.id;
  else S.wall = it.id;
}
function roomScene() {
  const wall = ITEM[S.wall] || ITEM['w-pink'];
  const spot = slot => {
    const it = ITEM[S.room[slot]];
    if (!it) return '';
    return slot === 'rug' ? '<div class="rug ri-rug"></div>' : `<span class="ri ri-${slot}">${it.e}</span>`;
  };
  return `<div class="room" style="background:${wall.bg}"><div class="floor"></div>
    ${['rug', 'ceil', 'wallL', 'wallR', 'floorL', 'floorR'].map(spot).join('')}${pinkyHTML('big')}</div>`;
}
let roomTab = 'wear';
function room() {
  const draw = popSel => {
    const list = SHOP.filter(i => i.kind === roomTab);
    app.innerHTML = `<div class="screen">${header('🏠 Комната Пинки', '#home')}
      ${roomScene()}
      <div class="bank">В копилке: <b>⭐ ${bal()}</b></div>
      <div class="tabs">${[['wear', '👗 Наряды'], ['room', '🛋️ Мебель'], ['wall', '🎨 Обои']].map(([k, t]) => `<button class="tab ${k === roomTab ? 'on' : ''}" data-tab="${k}">${t}</button>`).join('')}</div>
      <div class="shop">${list.map(it => {
        const own = ownedIt(it), on = isOn(it);
        const lab = on ? (it.kind === 'wall' ? '✓ сейчас' : '✓ снять') : own ? (it.kind === 'wear' ? 'надеть' : it.kind === 'room' ? 'поставить' : 'выбрать') : '⭐ ' + it.price;
        return `<button class="item ${own ? 'own' : ''} ${on ? 'on' : ''} ${!own && it.price > bal() ? 'dear' : ''}" data-item="${it.id}"><span class="ie">${it.e}</span><b>${it.name}</b><small>${lab}</small></button>`;
      }).join('')}</div></div>`;
    if (popSel) { const el = app.querySelector(popSel); if (el) el.classList.add('pop'); }
  };
  draw();
  app.onclick = e => {
    const tb = e.target.closest('[data-tab]');
    if (tb) { roomTab = tb.dataset.tab; draw(); return; }
    const b = e.target.closest('[data-item]');
    if (!b) return;
    const it = ITEM[b.dataset.item];
    const sel = it.kind === 'wear' ? `.acc-${it.slot}` : it.kind === 'room' ? `.ri-${it.slot}` : '.room';
    if (ownedIt(it)) { toggleIt(it); save(); draw(isOn(it) ? sel : null); return; }
    if (bal() < it.price) { toast(`Нужно ещё ${it.price - bal()} ⭐ — реши пару заданий!`); return; }
    S.spent += it.price; S.owned.push(it.id);
    if (!isOn(it)) toggleIt(it);
    save(); beep(true);
    draw(sel);
    toast(`${it.e} ${it.name} — теперь у Пинки!`);
  };
}

// ═════════════ Приз от брата ═════════════
function prizeProgress() {
  const p = S.prize;
  if (!p) return null;
  const got = Math.max(0, S.stars - p.start);
  return { got: Math.min(got, p.goal), goal: p.goal, done: got >= p.goal, name: p.name };
}
function prizeHTML() {
  const p = prizeProgress();
  if (!p) return '';
  if (p.done) return `<div class="prize done"><span class="pz-e">🎉</span><div class="pz-body"><b>Приз заработан: ${U.esc(p.name)}!</b><span>Покажи этот экран брату 💖</span></div></div>`;
  return `<div class="prize"><span class="pz-e">🎁</span><div class="pz-body"><b>${U.esc(p.name)}</b>
    <div class="bar"><i style="width:${Math.round(100 * p.got / p.goal)}%"></i></div>
    <span>${p.got} из ${p.goal} ⭐ · осталось ${p.goal - p.got}</span></div></div>`;
}
function prizeAdmin() {
  const p = prizeProgress();
  return `<div class="card"><h3>🎁 Приз для Лизы</h3>
    ${p ? `<p>Сейчас: <b>${U.esc(p.name)}</b> — ${p.got} из ${p.goal} ⭐ ${p.done ? '<b class="good">— заработан!</b>' : ''}</p>
      ${p.done ? '<button class="btn wide" data-act="prize-given">Приз выдан ✓</button>' : ''}
      <button class="btn ghost wide" data-act="prize-del">Отменить приз</button>`
    : `<p class="muted">Назначьте настоящую награду. Лиза увидит на главном экране полоску «сколько осталось». Звёзды считаются с момента назначения, покупки в комнате Пинки на приз не влияют.</p>
      <label class="muted">Какой приз:</label>
      <input id="pz-name" class="inp" maxlength="40" placeholder="Например: поход в кино">
      <label class="muted">Сколько звёзд нужно собрать:</label>
      <input id="pz-goal" class="inp" type="number" inputmode="numeric" min="10" max="5000" value="300">
      <p class="muted">Ориентир: урок даёт до 10 ⭐, сундучок — 5–12 ⭐. 300 ⭐ — это примерно 2–3 недели занятий.</p>
      <button class="btn wide" data-act="prize-set">Назначить приз</button>`}
    ${S.prizesDone.length ? `<p class="muted">Выданные призы: ${S.prizesDone.map(x => U.esc(x.name)).join(', ')}</p>` : ''}</div>`;
}
function prizeAction(a) {
  if (a === 'prize-set') {
    const name = (document.getElementById('pz-name').value || '').trim(), goal = parseInt(document.getElementById('pz-goal').value, 10);
    if (!name) { toast('Напишите, какой будет приз'); return true; }
    if (!(goal >= 10 && goal <= 5000)) { toast('Число звёзд — от 10 до 5000'); return true; }
    S.prize = { name, goal, start: S.stars, set: Date.now() };
    save(); toast('Приз назначен 🎁');
    return true;
  }
  if (a === 'prize-del') { if (confirm('Отменить приз?')) { S.prize = null; save(); } return true; }
  if (a === 'prize-given') { S.prizesDone.unshift({ name: S.prize.name, goal: S.prize.goal, t: Date.now() }); S.prize = null; save(); toast('Отлично! Можно назначить новый приз'); return true; }
  return false;
}

// ═════════════ Сундучок дня ═════════════
const chestReady = () => (S.chest || {}).date !== U.today();
function chest() {
  if (!chestReady()) {
    app.innerHTML = `<div class="screen result">${header('🎁 Сундучок дня', '#home')}
      <div class="chest-big open">🎁</div>
      ${mascotHTML('Сегодняшний сундучок уже открыт! Новый будет завтра. А пока можно поиграть или пройти урок.')}
      <button class="btn big wide" data-go="#home">На главную</button></div>`;
    return;
  }
  app.innerHTML = `<div class="screen result">${header('🎁 Сундучок дня', '#home')}
    <div class="chest-big wobble">🎁</div>
    ${mascotHTML('Реши 5 заданий — и сундучок откроется! Внутри сюрприз: звёздочки, наклейка или подарок для меня.')}
    <button class="btn big wide" data-act="go">Открыть задания ✨</button></div>`;
  app.onclick = e => { if (e.target.closest('[data-act="go"]')) startDaily(); };
}
function startDaily() {
  const all = Object.values(LESSON_BY_ID), done = all.filter(l => (S.lessons[l.id] || {}).runs);
  const pool = done.length >= 2 ? done : all;
  const items = [1, 2, 2, 2, 3].map(level => {
    const L = U.pick(pool);
    return { lessonId: L.id, level, gi: U.rnd(0, L.gens[level].length - 1) };
  });
  startSession({ mode: 'daily', title: 'Задание дня', items, back: '#home' });
}
function chestReward() {
  const r = Math.random(), free = SHOP.filter(i => i.price > 0 && i.price <= 40 && !S.owned.includes(i.id));
  if (r < 0.3 && free.length) { const it = U.pick(free); S.owned.push(it.id); return { e: it.e, text: `Подарок для Пинки: ${it.name}! Найди его в комнате Пинки.` }; }
  if (r < 0.55) { const s = giveSticker(); return { e: s, text: 'Новая наклейка в альбом!' }; }
  const n = U.rnd(5, 12); S.stars += n;
  return { e: '⭐', text: `${n} ${U.plural(n, 'звёздочка', 'звёздочки', 'звёздочек')} в копилку!` };
}
function chestOpen() {
  S.chest = { date: U.today() };
  S.tokens = Math.min(5, (S.tokens || 0) + 1);
  const rw = chestReward();
  save();
  app.innerHTML = `<div class="screen result">
    <h1>Задание дня выполнено!</h1>
    <p class="w-text">Ты решила ${P.firstOk} из ${P.items.length} с первого раза.</p>
    <button class="chest-big shake" data-act="open" aria-label="Открыть сундучок">🎁</button>
    <p class="w-text" id="ch-hint">Нажми на сундучок!</p>
    <div id="ch-prize"></div></div>`;
  app.onclick = e => {
    if (!e.target.closest('[data-act="open"]')) return;
    const c = app.querySelector('.chest-big');
    if (c.classList.contains('open')) return;
    c.classList.remove('shake'); c.classList.add('open');
    beep(true); confetti();
    document.getElementById('ch-hint').remove();
    document.getElementById('ch-prize').innerHTML = `<div class="new-sticker"><div>Внутри:</div><span>${rw.e}</span><p>${rw.text}</p><p>🎈 И ещё одна игра «Шарики»!</p></div>
      <div class="nav-col"><button class="btn big wide" data-go="#home">Ура! На главную</button></div>`;
  };
}

// ═════════════ Игра «Шарики» ═════════════
const BAL_COLORS = ['#ff5fa2', '#b197fc', '#ffd43b', '#63e6be', '#ff8787', '#74c0fc'];
function balloons() {
  const best = S.balloonBest || 0;
  if (!S.tokens) {
    app.innerHTML = `<div class="screen">${header('🎈 Шарики', '#home')}
      ${mascotHTML('Игра открывается в награду: за каждый пройденный урок и за сундучок дня. Пройди урок — и возвращайся!')}
      <div class="big-emoji center">🎈🎈🎈</div>
      <p class="center">Рекорд: <b>${best}</b></p>
      <button class="btn big wide" data-go="#home">К урокам</button></div>`;
    return;
  }
  app.innerHTML = `<div class="screen">${header('🎈 Шарики', '#home')}
    ${mascotHTML('Наверху пример. Лопай шарик с правильным ответом, пока он не улетел! Ошибёшься — потеряешь сердечко.')}
    <div class="big-emoji center">🎈🎈🎈</div>
    <p class="center">Игр в запасе: <b>${S.tokens}</b> · Рекорд: <b>${best}</b></p>
    <button class="btn big wide" data-act="play">Играть!</button></div>`;
  app.onclick = e => { if (e.target.closest('[data-act="play"]')) balloonRun(); };
}
function balloonOptions(ans) {
  const set = new Set([ans]);
  const cands = U.shuffle([ans + 1, ans - 1, ans + 10, ans - 10, ans + 2, ans - 2, ans * 2, Math.floor(ans / 2), ans + 5]);
  for (const c of cands) { if (set.size >= 4) break; if (c > 0 && c !== ans) set.add(c); }
  while (set.size < 4) set.add(ans + set.size * 3);
  return U.shuffle([...set]);
}
function balloonRun() {
  S.tokens--; save();
  let score = 0, lives = 3, round = 0, dur = 7, busy = false;
  app.innerHTML = `<div class="screen bal-screen">
    <header class="top"><button class="icon-btn" data-go="#home" aria-label="Выйти">✕</button>
      <div class="bal-q" id="bq"></div><div class="pill" id="bs">🎈 0</div></header>
    <div class="lives" id="bl"></div>
    <div class="sky-field" id="bf"></div></div>`;
  const f = document.getElementById('bf');
  const drawLives = () => { document.getElementById('bl').textContent = '❤️'.repeat(lives) + '🤍'.repeat(3 - lives); };
  const end = () => {
    stopTimers();
    const rec = score > (S.balloonBest || 0);
    S.balloonBest = Math.max(S.balloonBest || 0, score);
    const add = Math.floor(score / 4);
    S.stars += add;
    save();
    app.innerHTML = `<div class="screen result"><h1>${rec ? 'Новый рекорд! 🏆' : 'Игра окончена!'}</h1>
      <div class="big-emoji">🎈</div>
      ${mascotHTML(`Ты лопнула ${score} ${U.plural(score, 'шарик', 'шарика', 'шариков')}!${add ? ` +${add} ⭐ в копилку.` : ''}`, 'happy')}
      <div class="nav-col">${S.tokens ? `<button class="btn big wide" data-go="#balloons">Ещё раз (осталось ${S.tokens})</button>` : ''}
      <button class="btn ghost wide" data-go="#home">На главную</button></div></div>`;
    if (rec) confetti();
  };
  const lose = () => {
    lives--; drawLives(); beep(false);
    if (lives <= 0) { later(end, 400); return true; }
    return false;
  };
  const next = () => {
    round++;
    const my = round;
    const g = U.pick([SPEED_MODES.mul, SPEED_MODES.div, SPEED_MODES.mix]).gen();
    document.getElementById('bq').textContent = g[0] + ' = ?';
    const opts = balloonOptions(g[1]);
    f.innerHTML = opts.map((v, i) => `<button class="bal" data-v="${v}" style="left:${4 + i * 24}%;background:${BAL_COLORS[(i + round) % BAL_COLORS.length]};animation-duration:${(dur + Math.random() * 1.2).toFixed(2)}s;animation-delay:${(Math.random() * 0.5).toFixed(2)}s">${U.fmt(v)}</button>`).join('');
    f.querySelectorAll('.bal').forEach(b => {
      b.addEventListener('animationend', ev => {
        if (ev.animationName !== 'rise' || my !== round || busy) return;
        if (Number(b.dataset.v) === g[1]) { if (!lose()) next(); }
      });
      b.addEventListener('click', () => {
        if (my !== round || busy || b.classList.contains('popped')) return;
        if (Number(b.dataset.v) === g[1]) {
          busy = true; b.classList.add('popped'); beep(true);
          score++; document.getElementById('bs').textContent = '🎈 ' + score;
          dur = Math.max(3.6, dur - 0.18);
          later(() => { busy = false; next(); }, 280);
        } else {
          b.classList.add('nope');
          if (lose()) { busy = true; }
        }
      });
    });
  };
  drawLives();
  next();
}

'use strict';
// ═════════════ Сохранение прогресса (только на этом телефоне) ═════════════
const KEY = 'lizok_math_v1';
const fresh = () => ({
  v: 1, mascot: null, stars: 0, stickers: [], lessons: {}, gens: {}, mistakes: [],
  speed: {}, days: {}, pin: null, sound: true, created: Date.now(),
});
let S;
function load() {
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = fresh(); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* память переполнена */ } }
function day() { const k = U.today(); return S.days[k] || (S.days[k] = { sec: 0, tasks: 0, ok: 0 }); }

const MASCOTS = {
  cat: { e: '🐱', name: 'Мурка', who: 'котёнок' },
  uni: { e: '🦄', name: 'Искорка', who: 'единорожка' },
  bunny: { e: '🐰', name: 'Пушинка', who: 'зайка' },
  pinky: { e: '<img class="m-img" src="img/pinky.svg" alt="Пинки">', name: 'Пинки', who: 'инопланетянка' },
};
const twoPart = t => t.type === 'rem' || t.type === 'pair';
const PRAISE = ['Умница, Лизок!', 'Верно! Так держать!', 'Отлично!', 'Супер, Лизок!', 'Ты молодец!', 'Правильно! 💖', 'Вот это да!', 'Блестяще!', 'Ты настоящая отличница!'];
const SUPPORT = ['Почти! Попробуй ещё раз 💪', 'Не страшно! Посмотри подсказку и попробуй снова.', 'Подумай ещё чуть-чуть — у тебя получится!'];
const STICKERS = ['🦄', '🌸', '🍓', '🧁', '🎀', '🌈', '🍭', '🦋', '🐰', '💎', '👑', '🍩', '🌷', '🐼', '🍒', '🐱', '🌟', '🎈', '🍦', '🦊', '🐬', '🌺', '🍰', '🐨', '🪄', '🫧', '🎠', '🐣', '🍉', '🌙'];
const LEVELS = { 1: ['🌱', 'Разминка'], 2: ['🌷', 'Посложнее'], 3: ['👑', 'Со звёздочкой'] };

const app = document.getElementById('app');
const mascot = () => MASCOTS[S.mascot] || MASCOTS.cat;

// ═════════════ Мелочи: звук, всплывашки, конфетти ═════════════
let AC = null;
function beep(ok) {
  if (!S.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    (ok ? [660, 880, 1320] : [330, 247]).forEach((f, i) => {
      const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + i * 0.09;
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(g).connect(AC.destination); o.start(t); o.stop(t + 0.3);
    });
  } catch (e) { /* без звука */ }
}
let toastTimer = null;
function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = text; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
function confetti() {
  const box = document.createElement('div');
  box.className = 'confetti';
  const colors = ['#ff5fa2', '#ffb3d1', '#b197fc', '#ffd43b', '#63e6be', '#ff8fab'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + '%';
    p.style.background = U.pick(colors);
    p.style.animationDelay = Math.random() * 0.6 + 's';
    p.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3800);
}
function mascotHTML(text, mood = '') {
  return `<div class="mascot ${mood}"><div class="m-face">${mascot().e}</div><div class="bubble">${text}</div></div>`;
}
function header(title, back) {
  return `<header class="top">
    ${back ? `<button class="icon-btn" data-go="${back}" aria-label="Назад">←</button>` : '<span class="icon-spacer"></span>'}
    <div class="top-title">${title}</div>
    <div class="pill">⭐ ${S.stars}</div></header>`;
}
function starsHTML(n, total = 3) {
  let h = '';
  for (let i = 0; i < total; i++) h += `<span class="${i < n ? 'on' : 'off'}">★</span>`;
  return `<span class="stars">${h}</span>`;
}
function giveSticker() {
  const s = STICKERS.find(x => !S.stickers.includes(x)) || U.pick(STICKERS);
  S.stickers.push(s);
  return s;
}
function calcStreak() {
  let n = 0;
  const d = new Date();
  const key = dt => dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  if (!(S.days[key(d)] && S.days[key(d)].tasks)) d.setDate(d.getDate() - 1);
  while (S.days[key(d)] && S.days[key(d)].tasks) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// ═════════════ Переходы между экранами ═════════════
let timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const every = (fn, ms) => timers.push(setInterval(fn, ms));
function stopTimers() { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; }
function go(hash) { if (location.hash !== hash) location.hash = hash; else route(); }
function route() {
  const h = location.hash.replace(/^#/, '') || 'home';
  const [name, arg] = h.split('/');
  stopTimers();
  app.onclick = null;
  if (!S.mascot) return welcome();
  const screens = { home, topic, lesson, practice, review, speed, stickers, parent };
  (screens[name] || home)(arg);
  window.scrollTo(0, 0);
}
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g && !g.disabled) { e.preventDefault(); go(g.dataset.go); }
});

// ═════════════ Приветствие: выбор помощника ═════════════
function welcome() {
  app.innerHTML = `<div class="screen welcome">
    <div class="w-hero">👋</div>
    <h1>Привет, Лизок!</h1>
    <p class="w-text">Здесь мы будем учить математику — понятно, интересно и с наградами. Выбери себе помощника, который будет подсказывать и хвалить тебя:</p>
    <div class="w-choices four">
      ${Object.entries(MASCOTS).map(([k, m]) => `<button class="w-card" data-act="pick" data-m="${k}"><span>${m.e}</span><b>${m.name}</b><small>${m.who}</small></button>`).join('')}
    </div></div>`;
  app.onclick = e => {
    const b = e.target.closest('[data-act="pick"]');
    if (!b) return;
    S.mascot = b.dataset.m; save();
    toast(`${mascot().name} теперь твой помощник!`);
    go('#home');
  };
}

// ═════════════ Главный экран ═════════════
function reviewKeys() { return Object.keys(S.gens).filter(k => S.gens[k].bank > 0 && LESSON_BY_ID[k.split(':')[0]]); }
function topicProgress(t) {
  if (!t.lessons.length) return null;
  const got = t.lessons.reduce((s, l) => s + ((S.lessons[l.id] || {}).best || 0), 0);
  return { got, max: t.lessons.length * 3 };
}
function home() {
  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Доброе утро' : hr < 18 ? 'Привет' : 'Добрый вечер';
  const review = reviewKeys().length, streak = calcStreak();
  app.innerHTML = `<div class="screen home">
    ${mascotHTML(`${greet}, Лизок! ${U.pick(['Чем займёмся сегодня?', 'Готова к приключениям?', 'Вместе мы станем отличницей!', 'Я по тебе скучала!'])}`)}
    <div class="stats-row">
      <div class="stat"><b>⭐ ${S.stars}</b><span>${U.plural(S.stars, 'звёздочка', 'звёздочки', 'звёздочек')}</span></div>
      <div class="stat"><b>🎀 ${S.stickers.length}</b><span>${U.plural(S.stickers.length, 'наклейка', 'наклейки', 'наклеек')}</span></div>
      <div class="stat"><b>🔥 ${streak}</b><span>${U.plural(streak, 'день', 'дня', 'дней')} подряд</span></div>
    </div>
    <div class="quick">
      <button class="qbtn q1" data-go="#speed"><span>⚡</span>Тренажёр на скорость</button>
      <button class="qbtn q2" data-go="#review" ${review ? '' : 'disabled'}><span>🩹</span>Работа над ошибками${review ? ` <em>${review}</em>` : ''}</button>
      <button class="qbtn q3" data-go="#stickers"><span>🎀</span>Мои наклейки</button>
    </div>
    <h2 class="sec">Острова знаний</h2>
    <div class="islands">${TOPICS.map(t => {
      const p = topicProgress(t);
      if (!p) return `<button class="island soon" data-act="soon"><div class="isl-emoji">${t.emoji}</div><div class="isl-body"><div class="isl-title">${t.title}</div><div class="isl-sub">${t.sub}</div><div class="isl-soon">Скоро откроется ✨</div></div></button>`;
      return `<button class="island" data-go="#topic/${t.id}"><div class="isl-emoji">${t.emoji}</div><div class="isl-body"><div class="isl-title">${t.title}</div><div class="isl-sub">${t.sub}</div>
        <div class="bar"><i style="width:${Math.round(100 * p.got / p.max)}%"></i></div><div class="isl-prog">★ ${p.got} из ${p.max}</div></div></button>`;
    }).join('')}</div>
    <div class="home-foot">
      <button class="link" data-act="sound">${S.sound ? '🔔 Звук' : '🔕 Без звука'}</button>
      <button class="link" data-act="mascot">🐾 Сменить помощника</button>
      <button class="link" data-go="#parent">🔒 Для брата</button>
    </div></div>`;
  app.onclick = e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'sound') { S.sound = !S.sound; save(); home(); }
    if (b.dataset.act === 'mascot') welcome();
    if (b.dataset.act === 'soon') toast('Этот остров скоро откроется! 🌸');
  };
}

// ═════════════ Тема: список уроков ═════════════
function topic(id) {
  const t = TOPICS.find(x => x.id === id);
  if (!t || !t.lessons.length) return go('#home');
  app.innerHTML = `<div class="screen">${header(t.emoji + ' ' + t.title, '#home')}
    ${mascotHTML('В каждом уроке сначала короткая теория, потом задания. Звёздочки ставлю за ответы с первого раза!')}
    <div class="lessons">${t.lessons.map((l, i) => {
      const r = S.lessons[l.id] || {};
      return `<button class="lesson-card" data-go="#lesson/${l.id}">
        <div class="lc-num">${l.emoji}</div>
        <div class="lc-body"><div class="lc-title">Урок ${i + 1}. ${l.title}</div>
        <div class="lc-sub">${r.runs ? `Пройден ${r.runs} ${U.plural(r.runs, 'раз', 'раза', 'раз')}` : 'Ещё не пройден'}</div></div>
        <div class="lc-stars">${starsHTML(r.best || 0)}</div></button>`;
    }).join('')}</div></div>`;
}

// ═════════════ Урок: теория по карточкам ═════════════
function lesson(id) {
  const L = LESSON_BY_ID[id];
  if (!L) return go('#home');
  let idx = 0;
  const done = (S.lessons[id] || {}).runs > 0;
  const draw = () => {
    const c = L.theory[idx], last = idx === L.theory.length - 1;
    app.innerHTML = `<div class="screen">${header(L.title, '#topic/' + L.topic)}
      <div class="dots">${L.theory.map((_, i) => `<i class="${i === idx ? 'on' : i < idx ? 'past' : ''}"></i>`).join('')}</div>
      <div class="card theory"><h2>${c.title}</h2>${c.html}<div id="demo"></div></div>
      <div class="nav-row">
        <button class="btn ghost" data-act="prev">← Назад</button>
        ${last ? '<button class="btn big" data-act="start">Начать задания ✨</button>' : '<button class="btn" data-act="next">Дальше →</button>'}
      </div>
      ${done && !last ? '<button class="link center" data-act="start">Я помню теорию — сразу к заданиям →</button>' : ''}
    </div>`;
    if (c.demo) {
      document.getElementById('demo').appendChild(Column.viewer(Column.model(c.demo)));
    }
    window.scrollTo(0, 0);
  };
  app.onclick = e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'next') { idx++; draw(); }
    if (a === 'prev') { if (idx === 0) go('#topic/' + L.topic); else { idx--; draw(); } }
    if (a === 'start') go('#practice/' + id);
  };
  draw();
}

// ═════════════ Задания ═════════════
let P = null; // текущая серия заданий
const genKey = it => `${it.lessonId}:${it.level}:${it.gi}`;
const genOf = it => LESSON_BY_ID[it.lessonId].gens[it.level][it.gi];
function pickGi(L, level, avoid) {
  const n = L.gens[level].length;
  let gi = U.rnd(0, n - 1);
  if (n > 1 && avoid.includes(gi)) gi = U.rnd(0, n - 1);
  if (n > 1 && avoid.includes(gi)) gi = (gi + 1) % n;
  return gi;
}
function practice(id) {
  const L = LESSON_BY_ID[id];
  if (!L) return go('#home');
  const items = [], used = { 1: [], 2: [], 3: [] };
  L.plan.forEach(level => {
    if (used[level].length >= L.gens[level].length) used[level] = [];
    const gi = pickGi(L, level, used[level]);
    used[level].push(gi);
    items.push({ lessonId: id, level, gi });
  });
  startSession({ mode: 'lesson', title: L.title, items, back: '#topic/' + L.topic, lesson: L });
}
function review() {
  const keys = reviewKeys().sort((a, b) => S.gens[b].bank - S.gens[a].bank);
  if (!keys.length) { toast('Ошибок для повторения нет — ты молодец!'); return go('#home'); }
  const items = [];
  for (let i = 0; items.length < Math.min(8, Math.max(4, keys.length * 2)); i++) {
    const [lessonId, level, gi] = keys[i % keys.length].split(':');
    items.push({ lessonId, level: Number(level), gi: Number(gi) });
  }
  startSession({ mode: 'review', title: 'Работа над ошибками', items: U.shuffle(items), back: '#home' });
}
function startSession(o) {
  P = Object.assign(o, { pos: 0, firstOk: 0, earned: 0, extra: 0, startedAt: Date.now() });
  showTask();
}
function showTask() {
  const it = P.items[P.pos];
  P.task = genOf(it).fn();
  P.tries = 0; P.input = { a: '', b: '' }; P.field = 'a'; P.locked = false;
  drawTask();
}
function ansText(t) {
  if (t.type === 'rem') return `${U.fmt(t.answer.q)} (ост. ${t.answer.r})`;
  if (t.type === 'pair') return `${U.fmt(t.answer.q)} ${t.labels[0]} ${t.answer.r} ${t.labels[1]}`;
  if (t.type === 'num') return U.fmt(t.answer) + (t.unit ? ' ' + t.unit : '');
  return t.answer;
}
function drawTask(msg) {
  const t = P.task, it = P.items[P.pos], lv = LEVELS[it.level];
  const pct = Math.round(100 * P.pos / P.items.length);
  let answer = '';
  if (t.type === 'num') {
    answer = `<div class="ans-row"><div class="ans-box active">${P.input.a ? U.fmt(P.input.a) : '<span class="ph">?</span>'}</div>${t.unit ? `<div class="ans-unit">${t.unit}</div>` : ''}</div>`;
  } else if (t.type === 'pair') {
    answer = `<div class="ans-row pair">
      <div class="ans-box ${P.field === 'a' ? 'active' : ''}" data-act="field" data-f="a">${P.input.a ? U.fmt(P.input.a) : '<span class="ph">?</span>'}</div><div class="ans-unit">${t.labels[0]}</div>
      <div class="ans-box small ${P.field === 'b' ? 'active' : ''}" data-act="field" data-f="b">${P.input.b || '<span class="ph">?</span>'}</div><div class="ans-unit">${t.labels[1]}</div></div>`;
  } else if (t.type === 'rem') {
    answer = `<div class="ans-row rem">
      <div class="ans-col"><small>частное</small><div class="ans-box ${P.field === 'a' ? 'active' : ''}" data-act="field" data-f="a">${P.input.a ? U.fmt(P.input.a) : '<span class="ph">?</span>'}</div></div>
      <div class="ans-ost">ост.</div>
      <div class="ans-col"><small>остаток</small><div class="ans-box small ${P.field === 'b' ? 'active' : ''}" data-act="field" data-f="b">${P.input.b || '<span class="ph">?</span>'}</div></div></div>`;
  } else {
    answer = `<div class="choices">${t.options.map(o => `<button class="choice" data-act="choice" data-v="${U.esc(o)}">${o}</button>`).join('')}</div>`;
  }
  const keypad = t.type === 'choice' ? '' : `<div class="keypad">
    ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<button data-act="key" data-k="${k}">${k}</button>`).join('')}
    <button class="k-del" data-act="key" data-k="del">⌫</button><button data-act="key" data-k="0">0</button>
    <button class="k-ok" data-act="key" data-k="ok">✓</button></div>`;
  app.innerHTML = `<div class="screen practice">
    <header class="top">
      <button class="icon-btn" data-go="${P.back}" aria-label="Выйти">✕</button>
      <div class="pbar"><i style="width:${pct}%"></i><span>${P.pos + 1} / ${P.items.length}</span></div>
      <div class="pill">⭐ ${S.stars}</div></header>
    <div class="card task">
      <div class="lvl lvl${it.level}">${lv[0]} ${lv[1]}</div>
      <div class="q">${t.q}</div>
      ${msg ? `<div class="retry">${mascot().e} ${msg}</div>` : ''}
      ${P.tries > 0 || P.showHint ? `<div class="hint">💡 ${t.hint}</div>` : ''}
    </div>
    ${answer}
    ${P.tries === 0 && !P.showHint ? '<button class="link center" data-act="hint">💡 Подсказка</button>' : ''}
    ${keypad}
    <div id="sheet"></div></div>`;
  app.onclick = onPracticeClick;
}
function onPracticeClick(e) {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.act;
  if (a === 'next') return nextTask();
  if (a === 'sol') {
    b.replaceWith(Column.viewer(Column.model(P.task.sol)));
    return;
  }
  if (P.locked) return;
  if (a === 'hint') { P.showHint = true; drawTask(); return; }
  if (a === 'field') { P.field = b.dataset.f; drawTask(); return; }
  if (a === 'choice') return check(b.dataset.v);
  if (a === 'key') {
    const k = b.dataset.k, f = P.field;
    if (k === 'del') P.input[f] = P.input[f].slice(0, -1);
    else if (k === 'ok') {
      if (twoPart(P.task) && P.input.a && !P.input.b) { P.field = 'b'; drawTask(); return; }
      if (twoPart(P.task) && !P.input.a && P.input.b) { P.field = 'a'; drawTask(); return; }
      if (P.input.a === '' && (!twoPart(P.task) || P.input.b === '')) { toast('Сначала введи ответ'); return; }
      return check();
    } else if (P.input[f].length < 9) {
      P.input[f] = (P.input[f] === '0' ? '' : P.input[f]) + k;
    }
    drawTask();
  }
}
function genStat(it) {
  const k = genKey(it), g = genOf(it);
  return S.gens[k] || (S.gens[k] = { n: g.name, l: LESSON_BY_ID[it.lessonId].title, tries: 0, wrong: 0, bank: 0 });
}
function check(choiceVal) {
  const t = P.task, it = P.items[P.pos];
  let ok, given;
  if (t.type === 'num') { ok = Number(P.input.a) === t.answer; given = P.input.a; }
  else if (twoPart(t)) {
    ok = Number(P.input.a) === t.answer.q && Number(P.input.b || 0) === t.answer.r;
    given = t.type === 'rem' ? `${P.input.a || 0} (ост. ${P.input.b || 0})` : `${P.input.a || 0} ${t.labels[0]} ${P.input.b || 0} ${t.labels[1]}`;
  } else { ok = choiceVal === t.answer; given = choiceVal; }
  const gs = genStat(it), d = day();
  if (P.tries === 0) gs.tries++;
  if (ok) {
    beep(true);
    d.tasks++; d.ok++;
    if (P.tries === 0) {
      P.firstOk++; P.earned++; S.stars++;
      if (gs.bank > 0) gs.bank--;
    }
    save();
    P.locked = true;
    const first = P.tries === 0;
    document.getElementById('sheet').innerHTML = `<div class="sheet good" data-act="next">
      ${mascotHTML(first ? U.pick(PRAISE) : 'Верно! Со второй попытки тоже здорово 👍', 'happy')}
      ${first ? '<div class="plus">+1 ⭐</div>' : ''}</div>`;
    later(nextTask, first ? 1100 : 1400);
    return;
  }
  beep(false);
  if (P.tries === 0) {
    gs.wrong++; gs.bank = Math.min(3, gs.bank + 1);
    S.mistakes.unshift({ t: Date.now(), l: LESSON_BY_ID[it.lessonId].title, q: U.plain(t.q), a: given, r: ansText(t) });
    S.mistakes = S.mistakes.slice(0, 40);
  }
  P.tries++;
  if (P.tries === 1) {
    save();
    P.input = { a: '', b: '' }; P.field = 'a';
    drawTask(U.pick(SUPPORT));
    const box = app.querySelector('.ans-row, .choices');
    if (box) box.classList.add('shake');
    return;
  }
  // вторая ошибка — показываем решение
  d.tasks++;
  if (P.extra < 3) { P.items.push({ lessonId: it.lessonId, level: it.level, gi: it.gi }); P.extra++; }
  save();
  P.locked = true;
  document.getElementById('sheet').innerHTML = `<div class="sheet bad">
    ${mascotHTML('Ничего страшного! Давай разберём вместе.', 'calm')}
    <div class="right-ans">Правильный ответ: <b>${ansText(t)}</b></div>
    <div class="explain">${t.explain || ''}</div>
    ${t.sol ? '<button class="btn ghost wide" data-act="sol">👀 Посмотреть решение по шагам</button>' : ''}
    ${P.extra <= 3 ? '<p class="note">Похожее задание будет ещё раз в конце — закрепим!</p>' : ''}
    <button class="btn big wide" data-act="next">Понятно, дальше →</button></div>`;
}
function nextTask() {
  stopTimers();
  P.showHint = false;
  P.pos++;
  if (P.pos >= P.items.length) return finish();
  showTask();
}
function finish() {
  const total = P.items.length, ratio = P.firstOk / total;
  const n = ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : 1;
  const got = [];
  let title, text;
  if (P.mode === 'lesson') {
    const r = S.lessons[P.lesson.id] || (S.lessons[P.lesson.id] = { best: 0, runs: 0, done: 0, ok: 0 });
    if (r.runs === 0) got.push(giveSticker());
    if (n === 3 && !r.got3) { r.got3 = true; got.push(giveSticker()); }
    r.runs++; r.best = Math.max(r.best, n); r.done += total; r.ok += P.firstOk; r.last = Date.now();
    title = 'Урок пройден!';
    text = n === 3 ? 'Ты настоящая отличница! 💖' : n === 2 ? 'Очень хорошо! Ещё чуть-чуть — и будет 3 звезды.' : 'Хорошее начало! Перечитай теорию и попробуй ещё раз — получится лучше.';
  } else {
    if (ratio === 1 && total >= 4) got.push(giveSticker());
    title = 'Ошибки исправлены!';
    text = ratio === 1 ? 'Все задания с первого раза! Ошибки побеждены 🏆' : 'Молодец! Те, что ещё не получились, повторим в следующий раз.';
  }
  save();
  app.innerHTML = `<div class="screen result">
    <h1>${title}</h1>
    ${P.mode === 'lesson' ? `<div class="big-stars">${starsHTML(n)}</div>` : '<div class="big-emoji">🏆</div>'}
    ${mascotHTML(text, 'happy')}
    <div class="res-stats">
      <div><b>${P.firstOk} из ${total}</b><span>с первого раза</span></div>
      <div><b>+${P.earned} ⭐</b><span>заработано</span></div>
    </div>
    ${got.length ? `<div class="new-sticker"><div>Новая наклейка!</div><span>${got.join(' ')}</span></div>` : ''}
    <div class="nav-col">
      ${P.mode === 'lesson' ? `<button class="btn big wide" data-go="#practice/${P.lesson.id}">🔁 Ещё раз</button>` : ''}
      ${P.mode === 'lesson' && n < 3 ? `<button class="btn ghost wide" data-go="#lesson/${P.lesson.id}">📖 Повторить теорию</button>` : ''}
      <button class="btn ghost wide" data-go="${P.back}">${P.mode === 'lesson' ? 'К урокам' : 'На главную'}</button>
    </div></div>`;
  if (n >= 2 || got.length) confetti();
}

// ═════════════ Тренажёр на скорость ═════════════
const SPEED_MODES = {
  mul: { title: 'Таблица умножения', emoji: '🌸', gen: () => { const a = U.rnd(2, 9), b = U.rnd(2, 9); return [`${a} · ${b}`, a * b]; } },
  div: { title: 'Табличное деление', emoji: '🍓', gen: () => { const a = U.rnd(2, 9), b = U.rnd(2, 9); return [`${a * b} : ${a}`, b]; } },
  mix: {
    title: 'Устный счёт', emoji: '💎', gen: () => {
      const f = U.rnd(1, 4), x = U.rnd(2, 9), b = U.rnd(2, 9), z = U.pick([10, 100]);
      if (f === 1) return [`${U.fmt(x * z)} · ${b}`, x * z * b];
      if (f === 2) return [`${U.fmt(x * b * z)} : ${b}`, x * z];
      if (f === 3) { const p = U.rnd(11, 89) * 10, q = U.rnd(11, 89) * 10; return [`${p} + ${q}`, p + q]; }
      const p = U.rnd(30, 99) * 10, q = U.rnd(11, p / 10 - 1) * 10;
      return [`${p} − ${q}`, p - q];
    },
  },
};
const SPEED_TIME = 60;
function speed(modeArg) {
  if (modeArg && SPEED_MODES[modeArg]) return speedRun(modeArg);
  app.innerHTML = `<div class="screen">${header('⚡ Тренажёр на скорость', '#home')}
    ${mascotHTML(`За ${SPEED_TIME} секунд реши как можно больше примеров. Ответ проверяется сам — просто набирай цифры!`)}
    <div class="modes">${Object.entries(SPEED_MODES).map(([k, m]) => {
      const r = S.speed[k] || {};
      return `<button class="mode-card" data-go="#speed/${k}"><span>${m.emoji}</span><b>${m.title}</b><small>${r.best ? `Рекорд: ${r.best}` : 'Рекорда пока нет'}</small></button>`;
    }).join('')}</div></div>`;
}
function speedRun(mode) {
  const M = SPEED_MODES[mode];
  let score = 0, wrong = 0, input = '', cur = null, left = SPEED_TIME, started = false, busy = false;
  const next = () => { let g; do { g = M.gen(); } while (cur && g[0] === cur[0]); cur = g; input = ''; };
  const draw = flash => {
    app.innerHTML = `<div class="screen practice speed">
      <header class="top"><button class="icon-btn" data-go="#speed" aria-label="Выйти">✕</button>
      <div class="pbar time"><i style="width:${100 * left / SPEED_TIME}%"></i><span>${Math.ceil(left)} с</span></div>
      <div class="pill">✅ ${score}</div></header>
      <div class="card task speed-card ${flash || ''}"><div class="q"><div class="expr huge">${cur[0]} = ${input ? U.fmt(input) : '?'}</div></div>
      ${flash === 'bad' ? `<div class="retry">Правильно: ${U.fmt(cur[1])}</div>` : ''}</div>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<button data-act="k" data-k="${k}">${k}</button>`).join('')}
      <button class="k-del" data-act="k" data-k="del">⌫</button><button data-act="k" data-k="0">0</button><button class="k-ok" data-act="k" data-k="skip">⏭</button></div></div>`;
  };
  const end = () => {
    stopTimers();
    const r = S.speed[mode] || (S.speed[mode] = { best: 0, runs: 0, last: [] });
    const record = score > r.best;
    let st = null;
    if (record && score >= 10) st = giveSticker();
    r.best = Math.max(r.best, score); r.runs++; r.last = [score, ...r.last].slice(0, 10);
    const d = day(); d.tasks += score + wrong; d.ok += score;
    S.stars += Math.floor(score / 5);
    save();
    app.innerHTML = `<div class="screen result">
      <h1>${record ? 'Новый рекорд! 🏆' : 'Время вышло!'}</h1>
      <div class="big-emoji">${M.emoji}</div>
      ${mascotHTML(record ? `Ура! ${score} — твой лучший результат!` : `Ты решила ${score}. Рекорд — ${r.best}. Попробуй его побить!`, 'happy')}
      <div class="res-stats"><div><b>${score}</b><span>верно</span></div><div><b>${wrong}</b><span>ошибок</span></div><div><b>+${Math.floor(score / 5)} ⭐</b><span>1 за каждые 5</span></div></div>
      ${st ? `<div class="new-sticker"><div>Новая наклейка!</div><span>${st}</span></div>` : ''}
      <div class="nav-col"><button class="btn big wide" data-go="#speed/${mode}">🔁 Ещё раз</button>
      <button class="btn ghost wide" data-go="#speed">Другой тренажёр</button></div></div>`;
    if (record) confetti();
  };
  // отсчёт 3-2-1
  let count = 3;
  const countdown = () => {
    app.innerHTML = `<div class="screen result"><h1>${M.title}</h1><div class="countdown">${count || 'Старт!'}</div></div>`;
  };
  countdown();
  every(() => {
    if (!started) {
      count--;
      if (count >= 0) { countdown(); return; }
      started = true; next(); draw();
      const t0 = Date.now();
      every(() => {
        left = Math.max(0, SPEED_TIME - (Date.now() - t0) / 1000);
        const bar = app.querySelector('.pbar i'), lab = app.querySelector('.pbar span');
        if (bar) { bar.style.width = (100 * left / SPEED_TIME) + '%'; lab.textContent = Math.ceil(left) + ' с'; }
        if (left <= 0) end();
      }, 200);
    }
  }, 800);
  app.onclick = e => {
    const b = e.target.closest('[data-act="k"]');
    if (!b || !started || busy || left <= 0) return;
    const k = b.dataset.k, ans = String(cur[1]);
    if (k === 'del') { input = input.slice(0, -1); draw(); return; }
    if (k === 'skip') { wrong++; busy = true; draw('bad'); later(() => { busy = false; next(); draw(); }, 700); return; }
    input += k;
    if (input === ans) { score++; beep(true); next(); draw('good'); return; }
    if (input.length >= ans.length) {
      wrong++; beep(false); busy = true; draw('bad');
      later(() => { busy = false; next(); draw(); }, 700);
      return;
    }
    draw();
  };
}

// ═════════════ Наклейки ═════════════
function stickers() {
  const owned = S.stickers;
  app.innerHTML = `<div class="screen">${header('🎀 Мои наклейки', '#home')}
    ${mascotHTML(owned.length ? `У тебя ${owned.length} ${U.plural(owned.length, 'наклейка', 'наклейки', 'наклеек')}! Наклейки дают за пройденные уроки, за 3 звезды и за рекорды в тренажёре.` : 'Пока наклеек нет. Пройди первый урок — и получишь первую!')}
    <div class="album">${STICKERS.map(s => `<div class="slot ${owned.includes(s) ? 'got' : ''}">${owned.includes(s) ? s : '?'}</div>`).join('')}</div>
    ${owned.length > STICKERS.length ? `<p class="center">И ещё ${owned.length - STICKERS.length} повторных!</p>` : ''}</div>`;
}

// ═════════════ Режим для брата ═════════════
let parentOk = false;
function parent() {
  if (parentOk) return parentDash();
  let pin = '', first = null;
  const setup = !S.pin;
  const draw = (msg = '') => {
    app.innerHTML = `<div class="screen">${header('🔒 Для брата', '#home')}
      <div class="card center">
        <h2>${setup ? (first ? 'Повторите ПИН-код' : 'Придумайте ПИН-код') : 'Введите ПИН-код'}</h2>
        <p class="muted">${setup ? 'Из 4 цифр. По нему вы будете заходить в статистику.' : 'Этот раздел для брата.'}</p>
        <div class="pin">${[0, 1, 2, 3].map(i => `<i class="${i < pin.length ? 'on' : ''}"></i>`).join('')}</div>
        <div class="err">${msg}</div></div>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<button data-act="p" data-k="${k}">${k}</button>`).join('')}
      <button class="k-del" data-act="p" data-k="del">⌫</button><button data-act="p" data-k="0">0</button><span></span></div></div>`;
  };
  draw();
  app.onclick = e => {
    const b = e.target.closest('[data-act="p"]');
    if (!b) return;
    if (b.dataset.k === 'del') { pin = pin.slice(0, -1); draw(); return; }
    if (pin.length >= 4) return;
    pin += b.dataset.k;
    if (pin.length < 4) { draw(); return; }
    if (setup && !first) { first = pin; pin = ''; draw(); return; }
    if (setup) {
      if (pin === first) { S.pin = pin; save(); parentOk = true; parentDash(); }
      else { first = null; pin = ''; draw('ПИН-коды не совпали, попробуйте снова'); }
      return;
    }
    if (pin === S.pin) { parentOk = true; parentDash(); } else { pin = ''; draw('Неверный ПИН-код'); }
  };
}
function parentDash() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    days.push({ k, label: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][d.getDay()] + ' ' + d.getDate(), v: S.days[k] || { sec: 0, tasks: 0, ok: 0 } });
  }
  const maxMin = Math.max(5, ...days.map(d => d.v.sec / 60));
  const all = Object.values(S.days).reduce((a, d) => ({ sec: a.sec + d.sec, tasks: a.tasks + d.tasks, ok: a.ok + d.ok }), { sec: 0, tasks: 0, ok: 0 });
  const weak = Object.values(S.gens).filter(g => g.tries >= 2 && g.wrong > 0)
    .sort((a, b) => b.wrong / b.tries - a.wrong / a.tries).slice(0, 6);
  const fmtDate = t => { const d = new Date(t); return d.getDate() + '.' + String(d.getMonth() + 1).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  app.innerHTML = `<div class="screen parent">${header('📊 Статистика Лизы', '#home')}
    <div class="card">
      <div class="kpis">
        <div><b>${Math.round(all.sec / 60)}</b><span>минут занятий</span></div>
        <div><b>${all.tasks}</b><span>заданий решено</span></div>
        <div><b>${all.tasks ? Math.round(100 * all.ok / all.tasks) : 0}%</b><span>решено верно</span></div>
        <div><b>${calcStreak()}</b><span>дней подряд</span></div>
      </div></div>
    <div class="card"><h3>Последние 7 дней (минуты)</h3>
      <div class="week">${days.map(d => `<div class="wd"><div class="wbar"><i style="height:${Math.round(100 * (d.v.sec / 60) / maxMin)}%"></i></div><b>${Math.round(d.v.sec / 60)}</b><small>${d.label}</small></div>`).join('')}</div>
      <p class="muted">Считается время, когда Лиза что-то нажимает в приложении.</p></div>
    <div class="card"><h3>Уроки</h3>
      <table class="tbl"><tr><th>Урок</th><th>Раз</th><th>Лучшее</th><th>С 1-го раза</th></tr>
      ${Object.values(LESSON_BY_ID).map(l => { const r = S.lessons[l.id] || {}; return `<tr><td>${l.title}</td><td>${r.runs || 0}</td><td>${starsHTML(r.best || 0)}</td><td>${r.done ? Math.round(100 * r.ok / r.done) + '%' : '—'}</td></tr>`; }).join('')}
      </table></div>
    <div class="card"><h3>Слабые места</h3>
      ${weak.length ? `<table class="tbl"><tr><th>Тип задания</th><th>Ошибок</th></tr>${weak.map(g => `<tr><td>${g.n}<br><small class="muted">${g.l}</small></td><td>${g.wrong} из ${g.tries}</td></tr>`).join('')}</table>` : '<p class="muted">Пока данных мало.</p>'}</div>
    <div class="card"><h3>Последние ошибки</h3>
      ${S.mistakes.length ? S.mistakes.slice(0, 20).map(m => `<div class="mist"><small class="muted">${fmtDate(m.t)} · ${m.l}</small><div>${U.esc(m.q)}</div><div>Ответ Лизы: <b class="bad">${U.esc(m.a)}</b> · Верно: <b class="good">${U.esc(m.r)}</b></div></div>`).join('') : '<p class="muted">Ошибок пока нет.</p>'}</div>
    <div class="card"><h3>Тренажёр на скорость</h3>
      <table class="tbl">${Object.entries(SPEED_MODES).map(([k, m]) => { const r = S.speed[k] || {}; return `<tr><td>${m.title}</td><td>рекорд ${r.best || 0}</td><td>${r.runs || 0} раз</td></tr>`; }).join('')}</table></div>
    <div class="card"><h3>Сохранение прогресса</h3>
      <p class="muted">Прогресс хранится только на этом телефоне. Код ниже — запасная копия: сохраните его себе, и прогресс можно будет восстановить.</p>
      <button class="btn ghost wide" data-act="export">Показать код прогресса</button>
      <button class="btn ghost wide" data-act="import">Восстановить из кода</button>
      <div id="io"></div></div>
    <div class="card"><h3>Настройки</h3>
      <button class="btn ghost wide" data-act="pin">Сменить ПИН-код</button>
      <button class="btn danger wide" data-act="reset">Сбросить весь прогресс</button>
      <button class="btn wide" data-act="exit">Выйти из режима брата</button></div></div>`;
  app.onclick = e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act, io = document.getElementById('io');
    if (a === 'export') {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
      io.innerHTML = `<textarea readonly class="code">${code}</textarea><button class="btn wide" data-act="copy">Скопировать</button>`;
    }
    if (a === 'copy') {
      const ta = io.querySelector('textarea'); ta.select();
      (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).then(() => toast('Скопировано'), () => { document.execCommand('copy'); toast('Скопировано'); });
    }
    if (a === 'import') io.innerHTML = '<textarea class="code" placeholder="Вставьте код сюда"></textarea><button class="btn wide" data-act="doimport">Восстановить</button>';
    if (a === 'doimport') {
      try {
        const data = JSON.parse(decodeURIComponent(escape(atob(io.querySelector('textarea').value.trim()))));
        if (!data || data.v !== 1) throw new Error();
        if (!confirm('Заменить текущий прогресс прогрессом из кода?')) return;
        S = Object.assign(fresh(), data); save(); toast('Прогресс восстановлен'); parentDash();
      } catch (err) { toast('Код не подошёл'); }
    }
    if (a === 'pin') { S.pin = null; save(); parentOk = false; parent(); }
    if (a === 'reset') {
      if (confirm('Точно сбросить ВЕСЬ прогресс Лизы? Звёзды, наклейки и статистика пропадут.') && confirm('Это нельзя отменить. Сбросить?')) {
        const keepPin = S.pin, keepM = S.mascot; S = fresh(); S.pin = keepPin; S.mascot = keepM; save(); toast('Прогресс сброшен'); parentDash();
      }
    }
    if (a === 'exit') { parentOk = false; go('#home'); }
  };
}

// ═════════════ Учёт времени занятий ═════════════
let lastAct = Date.now(), tick = 0;
document.addEventListener('pointerdown', () => { lastAct = Date.now(); }, true);
setInterval(() => {
  if (document.visibilityState === 'visible' && Date.now() - lastAct < 60000 && S.mascot) {
    day().sec += 5;
    if (++tick % 6 === 0) save();
  }
}, 5000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });

// ═════════════ Код входа (от случайных посетителей сайта) ═════════════
// Хранится не сам код, а его «отпечаток». Один раз введён — телефон его запоминает.
const GATE = '10tmy52';
const GATE_KEY = 'lizok_gate';
function gateHash(s) {
  let h = 2166136261;
  for (const ch of 'lizok:' + s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(36);
}
function gateOpen() { try { return localStorage.getItem(GATE_KEY) === GATE; } catch (e) { return false; } }
function gate() {
  let code = '';
  const draw = (msg = '') => {
    app.innerHTML = `<div class="screen gate">
      <div class="w-hero">🔐</div>
      <h1>Лизок и математика</h1>
      <p class="w-text">Введите код входа</p>
      <div class="pin">${[0, 1, 2, 3].map(i => `<i class="${i < code.length ? 'on' : ''}"></i>`).join('')}</div>
      <div class="err">${msg}</div>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<button data-k="${k}">${k}</button>`).join('')}
      <button class="k-del" data-k="del">⌫</button><button data-k="0">0</button><span></span></div></div>`;
  };
  draw();
  app.onclick = e => {
    const b = e.target.closest('[data-k]');
    if (!b) return;
    if (b.dataset.k === 'del') { code = code.slice(0, -1); draw(); return; }
    code += b.dataset.k;
    if (code.length < 4) { draw(); return; }
    if (gateHash(code) === GATE) {
      try { localStorage.setItem(GATE_KEY, GATE); } catch (err) { /* без памяти */ }
      app.onclick = null;
      window.addEventListener('hashchange', route);
      route();
    } else { code = ''; draw('Неверный код'); }
  };
}

// ═════════════ Запуск ═════════════
load();
const demo = new URLSearchParams(location.search).get('demo');
if (demo && !S.mascot && MASCOTS[demo]) S.mascot = demo;
if (gateOpen()) { window.addEventListener('hashchange', route); route(); } else gate();
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

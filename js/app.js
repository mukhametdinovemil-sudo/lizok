'use strict';
// ═════════════ Сохранение прогресса (только на этом телефоне) ═════════════
const KEY = 'lizok_math_v1';
const fresh = () => ({
  v: 1, mascot: null, stars: 0, stickers: [], lessons: {}, gens: {}, mistakes: [],
  speed: {}, days: {}, pin: null, sound: true, created: Date.now(),
  // развлечения (fun.js)
  spent: 0, owned: [], equip: {}, room: {}, wall: 'w-pink', prize: null, prizesDone: [],
  visited: [], islandsDone: [], chest: {}, tokens: 0, balloonBest: 0, current: null,
  // fun2.js
  exams: [], awards: [], teach: { runs: 0, best: 0 }, streakGot: [],
  plan: null, tour: 0,
  // econ.js и игры для отдыха
  gm: {}, lastSeen: null, fined: 0, fineLog: [], finesOn: true,
  // helper.js: открывала ли помощницу, сколько вопросов задала, вопросы без ответа (для брата)
  helper: { seen: false, n: 0, log: [] },
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
// конфетти на одном холсте: 60 отдельных анимируемых элементов страницы на телефоне давали рывок
function confetti() {
  const W = window.innerWidth, H = window.innerHeight, dpr = Math.min(1.5, window.devicePixelRatio || 1);
  const cv = document.createElement('canvas');
  cv.className = 'confetti';
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d'), colors = ['#ff5fa2', '#ffb3d1', '#b197fc', '#ffd43b', '#63e6be', '#ff8fab'];
  const bits = Array.from({ length: 60 }, () => ({ x: Math.random() * W, c: U.pick(colors), wait: Math.random() * 600, dur: 1800 + Math.random() * 1400, a: Math.random() * 6.3 }));
  let t0 = 0;
  const step = now => {
    if (!cv.isConnected) return;
    if (!t0) t0 = now;
    const t = now - t0;
    let live = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const b of bits) {
      const k = (t - b.wait) / b.dur;
      if (k >= 1) continue;
      live = true;
      if (k < 0) continue;
      const a = b.a + k * 12.6, co = Math.cos(a), si = Math.sin(a), flip = 0.35 + 0.65 * Math.abs(Math.cos(b.a + k * 18));
      ctx.setTransform(co * dpr * flip, si * dpr * flip, -si * dpr, co * dpr, b.x * dpr, (-20 + k * (H * 1.1 + 20)) * dpr);
      ctx.fillStyle = b.c;
      ctx.fillRect(-5, -8, 10, 16);
    }
    if (live) requestAnimationFrame(step); else cv.remove();
  };
  requestAnimationFrame(step);
  setTimeout(() => cv.remove(), 3800);
}
function mascotHTML(text, mood = '') {
  const face = S.mascot === 'pinky' ? pinkyHTML('mini') : mascot().e;
  const sparks = mood === 'happy' ? '<i class="sp sp1">✨</i><i class="sp sp2">💖</i><i class="sp sp3">✨</i>' : '';
  return `<div class="mascot ${mood}"><div class="m-face">${face}${sparks}</div><div class="bubble">${text}</div></div>`;
}
function header(title, back) {
  return `<header class="top">
    ${back ? `<button class="icon-btn" data-go="${back}" aria-label="Назад">←</button>` : '<span class="icon-spacer"></span>'}
    <div class="top-title">${title}</div>
    <div class="pill">⭐ ${bal()}</div></header>`;
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
  leaveGame();
  closeHelper();
  app.onclick = null;
  if (!S.mascot) return welcome();
  const screens = { home, topic, lesson, practice, review, speed, stickers, parent, room, chest, balloons, teach, exam, awards, calendar, learn, games, pinky: pinkyHub, blocks, puzzles, jump };
  (screens[name] || home)(arg);
  const sc = app.firstElementChild;
  if (sc) sc.classList.add('enter'); // плавное появление экрана (games.css)
  window.scrollTo(0, 0);
  missedCheck(); // штраф за пропущенные дни (econ.js)
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
// ═════════════ Нижнее меню и разделы ═════════════
const TABS = [['home', '⭐', 'Сегодня'], ['learn', '🏝️', 'Учёба'], ['games', '🎮', 'Игры'], ['pinky', '🏠', 'Пинки']];
function tabbar(active) {
  const dot = { games: chestReady() || S.tokens > 0 };
  return `<nav class="tabbar">${TABS.map(([id, e, t]) => `<button class="tab-b ${id === active ? 'on' : ''}" data-go="#${id}"><span>${e}</span>${t}${dot[id] ? '<i></i>' : ''}</button>`).join('')}
    <button class="tab-b" data-helper="hub"><span><img class="m-img" src="${HELPER.img}" alt=""></span>${HELPER.name}${S.helper.seen ? '' : '<i></i>'}</button></nav>`;
}
const hubTop = title => `<header class="top"><div class="top-title left">${title}</div><div class="pill">⭐ ${bal()}</div></header>`;
const gcard = (go, e, t, s, badge, cls) => `<button class="g-card ${cls}" data-go="${go}"><span class="g-e">${e}</span><b>${t}</b><small>${s}</small>${badge ? `<em>${badge}</em>` : ''}</button>`;
const mascotFace = () => (S.mascot === 'pinky' ? pinkyHTML('mini') : mascot().e);

// план на сегодня: урок, сундучок, тренажёр
function todayPlan() {
  if (!S.plan || S.plan.date !== U.today()) S.plan = { date: U.today(), lesson: false, speed: false, bonus: false };
  return S.plan;
}
// куда ведёт кнопка «Продолжить»
function nextStep() {
  const rv = reviewKeys().length;
  if (rv >= 3) return { go: '#review', e: '🩹', title: 'Работа над ошибками', sub: `Исправим ${rv} ${U.plural(rv, 'ошибку', 'ошибки', 'ошибок')} — это быстро!` };
  const cur = TOPICS.find(t => t.id === S.current), main = TOPICS.filter(t => !t.extra);
  const order = cur ? [cur, ...main.filter(t => t !== cur)] : main;
  const rec = l => S.lessons[l.id] || {};
  for (const t of order) {
    const L = t.lessons.find(l => !rec(l).runs);
    if (L) return { go: '#lesson/' + L.id, e: t.emoji, title: t.title, sub: `Урок ${t.lessons.indexOf(L) + 1}. ${L.title}` };
  }
  for (const t of order) {
    const L = t.lessons.find(l => (rec(l).best || 0) < 3);
    if (L) return { go: '#practice/' + L.id, e: t.emoji, title: t.title, sub: `Урок ${t.lessons.indexOf(L) + 1}. ${L.title} — на 3 звезды!` };
  }
  const ex = TOPICS.filter(t => t.extra).find(t => t.lessons.some(l => !rec(l).runs));
  if (ex) { const L = ex.lessons.find(l => !rec(l).runs); return { go: '#lesson/' + L.id, e: ex.emoji, title: ex.title, sub: `Сверх учебника: ${L.title}` }; }
  return { go: '#exam', e: '📝', title: 'Пробная контрольная', sub: 'Все уроки пройдены! Проверь себя.' };
}
function home() {
  const hr = new Date().getHours(), greet = hr < 12 ? 'Доброе утро' : hr < 18 ? 'Привет' : 'Добрый вечер';
  const st = nextStep(), plan = todayPlan(), streak = calcStreak();
  const items = [['📖', 'Урок', plan.lesson, st.go], ['🎁', 'Сундучок', !chestReady(), '#chest'], ['⚡', 'Тренажёр', plan.speed, '#speed']];
  const all = items.every(x => x[2]);
  app.innerHTML = `<div class="screen hub">
    <div class="today-top">${mascotHTML(`${greet}, Лизок! ${U.pick(['Чем займёмся?', 'Готова к приключениям?', 'Я по тебе скучала!', 'Вместе мы станем отличницей!'])}`)}<div class="pill">⭐ ${bal()}</div></div>
    <button class="continue" data-go="${st.go}"><span class="c-e">${st.e}</span><span class="c-body"><small>Продолжить</small><b>${st.title}</b><span>${st.sub}</span></span><span class="c-play">▶</span></button>
    <div class="card plan"><h3>План на сегодня ${all ? '✅' : ''}</h3>
      <div class="plan-row">${items.map(([e, t, done, go]) => `<button class="plan-i ${done ? 'done' : ''}" data-go="${go}"><span>${done ? '✅' : e}</span>${t}</button>`).join('')}</div>
      <p class="muted center">${all ? 'Всё выполнено! Ты умничка 💖' : 'Сделай все три дела — получишь +5 ⭐'}</p></div>
    ${prizeHTML()}
    <button class="streak-row" data-go="#calendar"><span>🔥 <b>${streak}</b> ${U.plural(streak, 'день', 'дня', 'дней')} подряд</span><span class="muted">Календарь ›</span></button>
    ${S.finesOn !== false ? `<p class="muted center miss-note">🗓️ Заходи каждый день: за пропущенный день из копилки улетает ${ECON.fine} ⭐</p>` : ''}
    ${tabbar('home')}</div>`;
  if (all && !plan.bonus) { plan.bonus = true; S.stars += 5; save(); later(() => celebrate('🌟', 'План выполнен!', 'Все дела на сегодня сделаны. +5 ⭐ — ты умничка!'), 500); }
  checkRewards();
  const pz = prizeProgress();
  if (pz && pz.done && !S.prize.celebrated) {
    S.prize.celebrated = true; save();
    later(() => celebrate('🎁', 'Приз заработан!', `«${U.esc(pz.name)}» — ты собрала ${pz.goal} ⭐! Покажи этот экран брату.`), 400);
  }
  if (!S.tour) later(() => startTour(0), 600);
}
// остров, где сейчас стоит помощник на карте
function hereTopic() {
  return TOPICS.find(t => t.id === S.current) || TOPICS.filter(t => !t.extra).find(t => t.lessons.some(l => !(S.lessons[l.id] || {}).runs)) || null;
}
function mapHTML(list, gold) {
  const STEP = 132, X = [24, 50, 76, 50], here = hereTopic();
  const pts = list.map((t, i) => [X[i % 4], 66 + i * STEP]), H = 66 + (list.length - 1) * STEP + 92;
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; d += ` C ${x0} ${y0 + STEP / 2}, ${x1} ${y1 - STEP / 2}, ${x1} ${y1}`; }
  const nodes = list.map((t, i) => {
    const p = topicProgress(t), done = S.islandsDone.includes(t.id), isHere = here && here.id === t.id;
    return `<button class="mnode ${done ? 'done' : ''} ${isHere ? 'here' : ''} ${gold ? 'gold' : ''}" style="left:${pts[i][0]}%;top:${pts[i][1]}px" data-go="#topic/${t.id}">
      <span class="mn-e">${t.emoji}${done ? '<i class="mn-crown">👑</i>' : ''}</span><span class="mn-t">${t.title}</span><span class="mn-p">★ ${p.got}/${p.max}</span>
      ${isHere ? `<span class="map-pinky ${pts[i][0] > 60 ? 'pl' : 'pr'}">${mascotFace()}</span>` : ''}${S.current === t.id ? '<span class="mn-pin">📌 в школе</span>' : ''}</button>`;
  }).join('');
  return `<div class="map" style="height:${H}px"><svg class="map-path" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true">
    <path d="${d}" fill="none" stroke="${gold ? '#ffd43b' : '#ff9cc7'}" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 15" vector-effect="non-scaling-stroke"/></svg>${nodes}</div>`;
}
function learn() {
  const rv = reviewKeys().length;
  app.innerHTML = `<div class="screen hub">${hubTop('🏝️ Учёба')}
    <div class="learn-btns"><button class="mini-card" data-go="#exam"><span>📝</span>Контрольная</button>
      <button class="mini-card" data-go="#review" ${rv ? '' : 'disabled'}><span>🩹</span>Ошибки${rv ? ` <em>${rv}</em>` : ''}</button></div>
    ${mapHTML(TOPICS.filter(t => !t.extra), false)}
    <h2 class="sec extra-sec">⭐ Сверх учебника — для пятёрки с плюсом</h2>
    <p class="muted extra-note">Этих тем нет в учебнике этого года. Они сложнее — попробуй, когда пройдёшь основные острова!</p>
    ${mapHTML(TOPICS.filter(t => t.extra), true)}
    ${tabbar('learn')}</div>`;
}
function games() {
  const cr = chestReady(), gs = gameStarsToday(), gm = S.gm || {};
  app.innerHTML = `<div class="screen hub">${hubTop('🎮 Игры')}
    ${mascotHTML('Игры с математикой дают много звёзд. Игры для отдыха — чуть-чуть, зато весело!')}
    <h2 class="sec g-sec">🧮 С математикой <small>много ⭐</small></h2>
    <div class="g-grid">
      ${gcard('#chest', '🎁', 'Сундучок дня', cr ? 'Ждёт тебя сегодня!' : 'Открыт. Приходи завтра', cr ? '!' : '', 'gc1')}
      ${gcard('#balloons', '🎈', 'Шарики', S.tokens ? `Игр в запасе: ${S.tokens}` : 'Пройди урок — откроется', S.tokens || '', 'gc2')}
      ${gcard('#teach', '👩‍🏫', 'Проверь Пинки', 'Найди мои ошибки', '', 'gc3')}
      ${gcard('#speed', '⚡', 'Тренажёр', '60 секунд на скорость', '', 'gc4')}
    </div>
    <h2 class="sec g-sec">🌈 Для отдыха <small>${gs < ECON.cap ? `⭐ сегодня: ${gs} из ${ECON.cap}` : 'все ⭐ на сегодня собраны'}</small></h2>
    <div class="cap-bar" aria-label="Звёзды из игр для отдыха сегодня">${Array.from({ length: ECON.cap }, (_, i) => `<i class="${i < gs ? 'on' : ''}" style="animation-delay:${(0.3 + i * 0.08).toFixed(2)}s">⭐</i>`).join('')}</div>
    <div class="g-grid">
      ${gcard('#blocks', '<span class="mb"><i></i><i></i><i></i><i></i></span>', 'Блоки', `Рекорд: ${U.fmt((gm.blocks || {}).best || 0)}`, '', 'gc9')}
      ${gcard('#puzzles', '🧠', 'Головоломки', 'Тренируй логику', '', 'gc10')}
      ${gcard('#jump', '<img class="m-img jp-ic" src="img/pinky.svg" alt="">', 'Прыжки Пинки', `Прыгай по облачкам всё выше! Рекорд: ${U.fmt((gm.jump || {}).best || 0)} м`, '', 'gc11 wide')}
    </div>
    <p class="muted center">${gs < ECON.cap ? `Из игр для отдыха — не больше ${ECON.cap} ⭐ в день. Больше звёзд — за задания по математике!` : 'Играть можно и дальше — просто для удовольствия 💖'}</p>
    ${tabbar('games')}</div>`;
}
function pinkyHub() {
  const st = calcStreak();
  app.innerHTML = `<div class="screen hub">${hubTop('🏠 Пинки')}
    <button class="room-btn" data-go="#room">${roomScene()}<span class="room-cta">Нарядить и обставить ›</span></button>
    <div class="g-grid">
      ${gcard('#stickers', '🎀', 'Наклейки', `${S.stickers.length} ${U.plural(S.stickers.length, 'наклейка', 'наклейки', 'наклеек')}`, '', 'gc5')}
      ${gcard('#awards', '📜', 'Грамоты', S.awards.length ? `${S.awards.length} ${U.plural(S.awards.length, 'грамота', 'грамоты', 'грамот')}` : 'Пока нет — впереди!', '', 'gc6')}
      ${gcard('#calendar', '📅', 'Календарь', `🔥 ${st} ${U.plural(st, 'день', 'дня', 'дней')} подряд`, '', 'gc7')}
      ${gcard('#room', '🛍️', 'Магазин', `В копилке ⭐ ${bal()}`, '', 'gc8')}
    </div>
    <div class="home-foot">
      <button class="link" data-act="sound">${S.sound ? '🔔 Звук' : '🔕 Без звука'}</button>
      <button class="link" data-act="mascot">🐾 Помощник</button>
      <button class="link" data-act="tour">❓ Подсказки</button>
      <button class="link" data-go="#parent">🔒 Для брата</button>
    </div>${tabbar('pinky')}</div>`;
  app.onclick = e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'sound') { S.sound = !S.sound; save(); pinkyHub(); }
    if (b.dataset.act === 'mascot') welcome();
    if (b.dataset.act === 'tour') { S.tour = 0; save(); go('#home'); }
  };
}

// ═════════════ Знакомство при первом запуске ═════════════
const TOUR = [
  { sel: '.continue', text: 'Это главная кнопка. Нажимай «Продолжить» — я сама подберу, чем заняться!' },
  { sel: '.plan', text: 'План на день: урок, сундучок и тренажёр. Сделаешь всё — получишь бонусные звёзды!' },
  { sel: '.today-top .pill', text: 'Это копилка ⭐. Звёзды дают за ответы с первого раза. На них можно наряжать меня!' },
  { sel: '.tabbar', text: 'Внизу меню: «Учёба» — острова и контрольные, «Игры» — шарики, сундучок и игры для отдыха, «Пинки» — моя комната и грамоты, а совушке Луне можно задать любой вопрос.' },
];
function startTour(i) {
  document.querySelectorAll('.tour').forEach(x => x.remove());
  if (i >= TOUR.length) { S.tour = 1; save(); toast('Удачи, Лизок! 💖'); return; }
  const el = document.querySelector(TOUR[i].sel);
  if (!el) return startTour(i + 1);
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect(), pd = 8, below = r.top + r.height / 2 < window.innerHeight / 2;
  const o = document.createElement('div');
  o.className = 'tour';
  o.innerHTML = `<div class="tour-hole" style="left:${r.left - pd}px;top:${r.top - pd}px;width:${r.width + 2 * pd}px;height:${r.height + 2 * pd}px"></div>
    <div class="tour-box" style="${below ? `top:${r.bottom + 18}px` : `bottom:${window.innerHeight - r.top + 18}px`}">${mascotHTML(TOUR[i].text)}
      <div class="tour-btns"><button class="link" data-t="skip">Пропустить</button><button class="btn small" data-t="next">${i === TOUR.length - 1 ? 'Понятно!' : 'Дальше →'} ${i + 1}/${TOUR.length}</button></div></div>`;
  document.body.appendChild(o);
  o.addEventListener('click', e => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    if (b.dataset.t === 'skip') { o.remove(); S.tour = 1; save(); } else startTour(i + 1);
  });
}

// ═════════════ Тема: список уроков ═════════════
function topic(id) {
  const t = TOPICS.find(x => x.id === id);
  if (!t || !t.lessons.length) return go('#home');
  if (!S.visited.includes(id)) { S.visited.push(id); save(); rocketTo(t); }
  app.innerHTML = `<div class="screen">${header(t.emoji + ' ' + t.title, '#learn')}
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
      <button class="link center" data-helper="theory" data-l="${id}" data-c="${idx}">🦉 Непонятно? Спроси ${HELPER.nameAcc}</button>
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
  startSession({ mode: 'review', title: 'Работа над ошибками', items: U.shuffle(items), back: '#learn' });
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
      <div class="pill">${P.mode === 'exam' ? '⏱ ' + examTime() : '⭐ ' + bal()}</div></header>
    <div class="card task">
      <div class="lvl lvl${it.level}">${lv[0]} ${lv[1]}</div>
      <div class="q">${t.q}</div>
      ${msg ? `<div class="retry">${mascot().e} ${msg}</div>` : ''}
      ${P.tries > 0 || P.showHint ? `<div class="hint">💡 ${t.hint}</div>` : ''}
    </div>
    ${answer}
    ${P.mode !== 'exam' ? `<div class="task-help">${P.tries === 0 && !P.showHint ? '<button class="link" data-act="hint">💡 Подсказка</button>' : ''}<button class="link" data-helper="task">🦉 Спросить ${HELPER.nameAcc}</button></div>` : ''}
    ${P.mode === 'exam' ? '<p class="note">Контрольная: без подсказок, одна попытка</p>' : ''}
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
  if (P.mode === 'exam') {
    d.tasks++;
    if (ok) { d.ok++; P.firstOk++; } else {
      gs.wrong++; gs.bank = Math.min(3, gs.bank + 1);
      S.mistakes.unshift({ t: Date.now(), l: LESSON_BY_ID[it.lessonId].title + ' (контрольная)', q: U.plain(t.q), a: given, r: ansText(t) });
      S.mistakes = S.mistakes.slice(0, 40);
    }
    P.results.push({ ok, lid: it.lessonId, q: U.plain(t.q), a: String(given), r: ansText(t) });
    save(); P.locked = true;
    toast('Ответ записан ✏️');
    later(nextTask, 350);
    return;
  }
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
    if (first) flyStar();
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
  if (P.mode === 'daily') return chestOpen();
  if (P.mode === 'exam') return examFinish();
  const total = P.items.length, ratio = P.firstOk / total;
  const n = ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : 1;
  const got = [];
  let title, text, island = null;
  if (P.mode === 'lesson') {
    const r = S.lessons[P.lesson.id] || (S.lessons[P.lesson.id] = { best: 0, runs: 0, done: 0, ok: 0 });
    if (r.runs === 0) got.push(giveSticker());
    if (n === 3 && !r.got3) { r.got3 = true; got.push(giveSticker()); }
    r.runs++; r.best = Math.max(r.best, n); r.done += total; r.ok += P.firstOk; r.last = Date.now();
    S.tokens = Math.min(5, (S.tokens || 0) + 1);
    todayPlan().lesson = true;
    const tp = TOPICS.find(t => t.id === P.lesson.topic);
    if (tp && tp.lessons.every(l => (S.lessons[l.id] || {}).runs) && !S.islandsDone.includes(tp.id)) {
      S.islandsDone.push(tp.id); S.stars += 10; island = tp;
      addAward('isl-' + tp.id, `за прохождение острова «${tp.title}»`, tp.emoji);
    }
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
    ${P.mode === 'lesson' ? '<p class="center">🎈 +1 игра «Шарики» — можно поиграть!</p>' : ''}
    <div class="nav-col">
      ${P.mode === 'lesson' ? `<button class="btn big wide" data-go="#practice/${P.lesson.id}">🔁 Ещё раз</button>` : ''}
      ${P.mode === 'lesson' && n < 3 ? `<button class="btn ghost wide" data-go="#lesson/${P.lesson.id}">📖 Повторить теорию</button>` : ''}
      <button class="btn ghost wide" data-go="${P.back}">${P.mode === 'lesson' ? 'К урокам' : 'На главную'}</button>
    </div></div>`;
  if (n >= 2 || got.length) confetti();
  if (island) later(() => celebrate('🏝️', 'Остров пройден!', `Все уроки острова «${island.title}» пройдены! +10 ⭐ и новая грамота 📜`), 1200);
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
  app.innerHTML = `<div class="screen">${header('⚡ Тренажёр на скорость', '#games')}
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
    todayPlan().speed = true;
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
  app.innerHTML = `<div class="screen">${header('🎀 Мои наклейки', '#pinky')}
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
    app.innerHTML = `<div class="screen">${header('🔒 Для брата', '#pinky')}
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
  app.innerHTML = `<div class="screen parent">${header('📊 Статистика Лизы', '#pinky')}
    <div class="card">
      <div class="kpis">
        <div><b>${Math.round(all.sec / 60)}</b><span>минут занятий</span></div>
        <div><b>${all.tasks}</b><span>заданий решено</span></div>
        <div><b>${all.tasks ? Math.round(100 * all.ok / all.tasks) : 0}%</b><span>решено верно</span></div>
        <div><b>${calcStreak()}</b><span>дней подряд</span></div>
      </div></div>
    <div class="card"><h3>📌 Сейчас в школе</h3>
      <p class="muted">Отметьте тему, которую сейчас проходят в классе. Этот остров будет первым на главном экране, а сундучок дня станет давать задания чаще по нему.</p>
      <div class="cur-list">${TOPICS.filter(t => !t.extra).map(t => `<button class="cur-btn ${S.current === t.id ? 'on' : ''}" data-act="cur" data-t="${t.id}">${t.emoji} ${t.title}<small>${t.sub.split(' · ')[1] || ''}</small></button>`).join('')}
      <button class="cur-btn ${!S.current ? 'on' : ''}" data-act="cur" data-t="">Не выбрано</button></div></div>
    ${prizeAdmin()}
    ${examsAdmin()}
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
    ${econAdmin()}
    ${helperAdmin()}
    <div class="card"><h3>Настройки</h3>
      <button class="btn ghost wide" data-act="pin">Сменить ПИН-код</button>
      <button class="btn danger wide" data-act="reset">Сбросить весь прогресс</button>
      <button class="btn wide" data-act="exit">Выйти из режима брата</button></div></div>`;
  app.onclick = e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act, io = document.getElementById('io');
    if (prizeAction(a)) { if (a !== 'prize-set' || S.prize) parentDash(); return; }
    if (econAction(a) || helperAction(a)) { parentDash(); return; }
    if (a === 'cur') { S.current = b.dataset.t || null; save(); toast(S.current ? 'Тема отмечена 📌' : 'Отметка снята'); parentDash(); return; }
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
    // время в играх для отдыха считаем отдельно, чтобы брат видел честные «минуты занятий»
    const d = day(), rest = REST_GAMES.includes(location.hash.replace(/^#/, '').split('/')[0]);
    if (rest) d.play = (d.play || 0) + 5;
    else d.sec += 5;
    // посреди игры не сохраняем: запись в память телефона даёт заметную заминку; всё сохранится в конце игры и при выходе
    if (++tick % 6 === 0 && !rest) save();
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

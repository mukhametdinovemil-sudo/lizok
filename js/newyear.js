'use strict';
// Новогоднее обновление. Сезон — с 13 ноября по 15 января (каждый год сам), брат может выключить.
//  • Вид: снег за содержимым, гирлянда сверху разделов и значок 🎄 в нижнем меню (newyear.css),
//    шапка у Пинки (pinkyHTML в fun.js), ёлка на главной, новогодняя заставка (intro.js).
//  • Календарь до Нового года (#newyear): 49 окошек (13.11–31.12) и большое «1 января».
//    Окошко дня открывается после урока за день (план дня: «урок»). Каждое вешает игрушку на ёлку,
//    внутри звёзды, а каждое 7-е — подарок для Пинки. «1 января» — звезда на макушку, +25 ⭐ и грамота.
//  • Новогодние уроки ny1, ny2: есть в LESSON_BY_ID, но не в TOPICS — острова и контрольные не меняются.
//  • Вещи для комнаты Пинки (вкладка «🎄 Праздник» в магазине) и игра «Подарки» (#nygame) с примерами.
// Подключается после intro.js и до app.js. S, app, save, header и др. берутся во время вызова.
// Для проверок: NY.force — включить в любой день, NY.now — «сегодня» для календаря (строка даты).

const NY = { force: false, now: null, cap: 49, starsJan: 25 };
const nyNow = () => (NY.now ? new Date(NY.now) : new Date());
const nyKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const NY_MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const NY_MON3 = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

// ═════════════ Сезон ═════════════
// год декабря этого праздника или 0, если сейчас не сезон
function nySeasonOf(d) {
  const m = d.getMonth(), x = d.getDate();
  if ((m === 10 && x >= 13) || m === 11) return d.getFullYear();
  if (m === 0 && x <= 15) return d.getFullYear() - 1;
  return 0;
}
function nySeason() { const n = nyNow(); return nySeasonOf(n) || (n.getMonth() < 6 ? n.getFullYear() - 1 : n.getFullYear()); }
function nyOn() {
  if (typeof S === 'undefined' || !S || S.nyOff) return false;
  return NY.force || nySeasonOf(nyNow()) > 0;
}
// окошки календаря: с 13 ноября по 31 декабря — 49 дней, ровно 7 рядов по 7
function nyDays() {
  const y = nySeason(), out = [];
  for (const d = new Date(y, 10, 13, 12); d.getFullYear() === y; d.setDate(d.getDate() + 1)) out.push(nyKey(d));
  return out;
}
// сколько дней до 1 января (0 и меньше — праздник уже наступил)
function nyLeft() {
  const n = nyNow(), a = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12), b = new Date(nySeason() + 1, 0, 1, 12);
  return Math.round((b - a) / 864e5);
}
function nyState() {
  const season = nySeason();
  if (!S.ny || S.ny.season !== season) { S.ny = { season, first: nyKey(nyNow()), open: {} }; save(); }
  return S.ny;
}
// окошко сегодняшнего дня; с 1 по 15 января это большое окошко «1 января»
const nyTodayKey = () => { const n = nyNow(); return n.getMonth() === 0 ? 'jan1' : nyKey(n); };
// open — можно открыть, need — сначала урок, done — уже открыто, none — сегодня окошка нет
function nyStatus() {
  const st = nyState(), k = nyTodayKey();
  if (k !== 'jan1' && !nyDays().includes(k)) return 'none';
  if (st.open[k]) return 'done';
  return todayPlan().lesson ? 'open' : 'need';
}
const nyToys = () => Object.keys(nyState().open).filter(k => k !== 'jan1').length;

// ═════════════ Вещи для комнаты Пинки ═════════════
const NY_SHOP = [
  { id: 'ny-flake', kind: 'wear', slot: 'head', e: '❄️', name: 'Заколка-снежинка', price: 20, ny: true },
  { id: 'ny-bell', kind: 'wear', slot: 'neck', e: '🔔', name: 'Колокольчик', price: 25, ny: true },
  { id: 'ny-gift', kind: 'wear', slot: 'hand', e: '🎁', name: 'Подарок', price: 20, ny: true },
  { id: 'ny-spark', kind: 'wear', slot: 'hand', e: '🎇', name: 'Бенгальский огонь', price: 30, ny: true },
  { id: 'ny-tree', kind: 'room', slot: 'floorL', e: '🎄', name: 'Ёлка', price: 45, ny: true },
  { id: 'ny-snowman', kind: 'room', slot: 'floorR', e: '⛄', name: 'Снеговик', price: 30, ny: true },
  { id: 'ny-sock', kind: 'room', slot: 'wallL', e: '🧦', name: 'Носок для подарков', price: 20, ny: true },
  { id: 'ny-fire', kind: 'room', slot: 'wallR', e: '🎆', name: 'Салют', price: 35, ny: true },
  { id: 'ny-star', kind: 'room', slot: 'ceil', e: '🌟', name: 'Звезда', price: 25, ny: true },
  { id: 'w-winter', kind: 'wall', e: '🌨️', name: 'Зимние', price: 30, ny: true,
    bg: 'radial-gradient(circle at 30% 30%,#fff 0 2.5px,transparent 3.5px) 0 0/46px 46px,radial-gradient(circle at 70% 75%,#fff 0 2px,transparent 3px) 0 0/34px 34px,linear-gradient(#dbe9ff,#b5d3ff)' },
  { id: 'w-nynight', kind: 'wall', e: '🌃', name: 'Новогодняя ночь', price: 45, ny: true,
    bg: 'radial-gradient(circle at 25% 25%,#fff 0 1.5px,transparent 2.5px) 0 0/40px 40px,radial-gradient(circle at 75% 60%,#ffe066 0 1.5px,transparent 2.5px) 0 0/58px 58px,linear-gradient(#1b1f5a,#3b2a8f)' },
];
// подарки из календаря (каждое 7-е окошко) — по порядку, пока есть что дарить
const NY_GIFTS = ['ny-tree', 'ny-flake', 'ny-snowman', 'ny-bell', 'ny-star', 'ny-spark', 'w-winter'];
if (typeof SHOP !== 'undefined') NY_SHOP.forEach(it => { SHOP.push(it); ITEM[it.id] = it; });

// ═════════════ Зимние факты в окошках ═════════════
const NY_FACTS = [
  'У снежинки всегда шесть лучиков. Значит, у трёх снежинок — 18 лучиков!',
  'Самый короткий день в году — около 22 декабря. Потом дни становятся длиннее.',
  'В России 11 часовых поясов. Новый год первыми встречают на Камчатке и Чукотке, а последними — в Калининграде.',
  'В сильный мороз снег скрипит под ногами: это ломаются крошечные льдинки.',
  'Каждая снежинка — это кристаллик льда. Двух совсем одинаковых снежинок почти не бывает!',
  'Белые медведи живут на севере, а пингвины — на юге. Поэтому в природе они никогда не встречаются.',
  'Иголки ёлки покрыты тонким слоем воска. Поэтому зимой они не опадают и не боятся мороза.',
  'Северные олени видят ультрафиолетовый свет. На белом снегу им это очень помогает.',
  'В году 12 месяцев и 52 недели, и ещё остаётся 1 или 2 дня.',
  'Если каждый день решать по 10 примеров, за весь декабрь получится 310 примеров!',
  'Снеговика обычно лепят из трёх комов, и каждый следующий меньше предыдущего.',
  'Льдинки прозрачные, а снег белый: свет отражается от множества крошечных граней.',
  'Полночь можно записать и как 24:00, и как 0:00. Это конец одних суток и начало следующих.',
  'Сосулька растёт сверху вниз: вода стекает и замерзает на самом кончике.',
];
const NY_FACT_JAN = 'С Новым годом, Лизок! Пусть этот год будет полон пятёрок, открытий и радости 💖';

// ═════════════ Окошко дня ═════════════
function nyReward(i) {
  const fact = i >= NY.cap ? NY_FACT_JAN : NY_FACTS[i % NY_FACTS.length];
  if (i >= NY.cap) {
    S.stars += NY.starsJan;
    const n = nyToys();
    addAward('ny-' + nyState().season, n ? `за новогодний марафон: ${n} ${U.plural(n, 'окошко', 'окошка', 'окошек')} в календаре` : 'за новогодний праздник с математикой', '🎄');
    return { e: '🌟', title: 'С Новым годом!', text: `На макушку ёлки — звезда! +${NY.starsJan} ⭐ и новогодняя грамота 📜`, line: '🌟 На ёлке засияла звезда!', fact };
  }
  if (i % 7 === 6) {
    const id = NY_GIFTS.find(x => ITEM[x] && !S.owned.includes(x));
    if (id) {
      S.owned.push(id);
      return { e: ITEM[id].e, title: 'Подарок для Пинки!', text: `${ITEM[id].name} — ищи в комнате Пинки, вкладка «🎄 Праздник».`, line: '🎄 На ёлке новая игрушка!', fact };
    }
  }
  const n = i % 7 === 6 ? 8 : 3 + (i * 5) % 4;
  S.stars += n;
  return { e: '⭐', n, title: 'Окошко открыто!', text: `${n} ${U.plural(n, 'звёздочка', 'звёздочки', 'звёздочек')} в копилку!`, line: '🎄 На ёлке новая игрушка!', fact };
}
function nyOpen() {
  if (!nyOn() || nyStatus() !== 'open') return null;
  const st = nyState(), k = nyTodayKey(), i = k === 'jan1' ? NY.cap : nyDays().indexOf(k);
  st.open[k] = { t: Date.now() };
  const r = nyReward(i);
  st.open[k].e = r.e;
  if (r.n) st.open[k].n = r.n;
  save();
  return r;
}
function nyOpenShow() {
  const r = nyOpen();
  if (!r) return;
  sfx('win');
  overlay(`<div class="cele ny-pop"><div class="ny-gift"><span class="ny-g1">🎁</span><span class="ny-g2">${r.e}</span></div>
    <h1>${r.title}</h1><p><b>${r.text}</b></p><p class="ny-line">${r.line}</p>
    <div class="ny-fact"><b>Знаешь ли ты?</b> ${r.fact}</div><button class="btn big">Ура! 🎉</button></div>`, 0,
  () => { if (location.hash.replace('#', '') === 'newyear') nyHub({ fresh: true }); });
  later(confetti, 900);
  // коробка исчезает анимацией; на всякий случай убираем её и вручную
  setTimeout(() => { const g = document.querySelector('.ny-gift .ny-g1'); if (g) g.remove(); }, 1050);
}

// ═════════════ Ёлка (рисунок SVG) ═════════════
const NY_TIERS = [[22, 96, 46], [62, 160, 70], [112, 224, 92]]; // ярусы: [верх, низ, полуширина внизу]
const NY_TOY_COL = ['#ff6b6b', '#ffd43b', '#74c0fc', '#f783ac', '#b197fc', '#ffa94d', '#63e6be', '#ffffff'];
let nyPos = null;
// места для игрушек: всегда одни и те же (свой «случайный» ряд чисел), не ближе друг к другу, чем на 15
function nyToyPos() {
  if (nyPos) return nyPos;
  let seed = 20261231;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const inside = (x, y) => NY_TIERS.some(([t, b, w]) => y > t + 16 && y < b - 6 && Math.abs(x - 100) < w * (y - t) / (b - t) - 8);
  const pts = [];
  for (let md = 15; pts.length < NY.cap && md >= 8; md--) {
    for (let k = 0; k < 5000 && pts.length < NY.cap; k++) {
      const x = 10 + rnd() * 180, y = 30 + rnd() * 192;
      if (inside(x, y) && pts.every(p => (p[0] - x) ** 2 + (p[1] - y) ** 2 >= md * md)) pts.push([Math.round(x), Math.round(y), NY_TOY_COL[pts.length % NY_TOY_COL.length]]);
    }
  }
  return (nyPos = pts);
}
const nyStarPath = (cx, cy, R, r) => Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R;
  return (i ? 'L' : 'M') + (cx + q * Math.cos(a)).toFixed(1) + ' ' + (cy + q * Math.sin(a)).toFixed(1);
}).join(' ') + ' Z';
// гирлянда на ёлке: три дуги с лампочками, мигают две группы по очереди (newyear.css)
function nyTreeLights() {
  const arcs = [[[72, 72], [100, 88], [128, 66]], [[50, 134], [100, 156], [152, 122]], [[28, 200], [100, 220], [174, 188]]];
  let wires = '', a = '', b = '';
  arcs.forEach(([p0, p1, p2], j) => {
    wires += `<path d="M${p0[0]} ${p0[1]} Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}"/>`;
    const n = 5 + j * 2;
    for (let i = 1; i < n; i++) {
      const t = i / n, u = 1 - t, x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
      const c = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="${['#ffe066', '#ff8787', '#a5d8ff'][(i + j) % 3]}"/>`;
      if (i % 2) a += c; else b += c;
    }
  });
  return `<g class="ny-wire">${wires}</g><g class="lt-a">${a}</g><g class="lt-b">${b}</g>`;
}
function nyTree(n, star, fresh) {
  const toys = nyToyPos().slice(0, n).map(([x, y, c], i) => `<g class="ny-toy${fresh && i === n - 1 ? ' new' : ''}"><circle cx="${x}" cy="${y}" r="6.5" fill="${c}" stroke="rgba(0,0,0,.15)" stroke-width="1"/><circle cx="${x - 2}" cy="${y - 2}" r="2" fill="#fff" opacity=".8"/></g>`).join('');
  return `<svg class="ny-tree" viewBox="0 0 200 250" aria-hidden="true">
    <rect x="89" y="216" width="22" height="28" rx="5" fill="#8d5524"/>
    <path d="M100 112 L192 224 Q100 238 8 224 Z" fill="#2b8a3e" stroke="#2b8a3e" stroke-width="6" stroke-linejoin="round"/>
    <path d="M100 62 L170 160 Q100 174 30 160 Z" fill="#37b24d" stroke="#37b24d" stroke-width="6" stroke-linejoin="round"/>
    <path d="M100 22 L146 96 Q100 108 54 96 Z" fill="#40c057" stroke="#40c057" stroke-width="6" stroke-linejoin="round"/>
    <path d="M98 34 L72 84 M98 74 L52 150 M98 124 L30 214" stroke="#fff" stroke-opacity=".13" stroke-width="5" stroke-linecap="round" fill="none"/>
    ${nyTreeLights()}${toys}
    <path class="ny-star${star ? ' on' : ''}" d="${nyStarPath(100, 17, 15, 6.5)}"/></svg>`;
}
// снежинки внутри тёмных карточек
const nyFlakes = n => `<div class="ny-flakes" aria-hidden="true">${Array.from({ length: n }, (_, i) =>
  `<i style="--x:${(i * 29 + 7) % 96}%;--d:${5 + (i * 3) % 5}s;--w:-${((i * 1.37) % 5).toFixed(1)}s;--s:${9 + (i * 5) % 9}px;--dx:${((i % 3) - 1) * 14}px">${i % 2 ? '❅' : '❆'}</i>`).join('')}</div>`;

// ═════════════ Оформление разделов (вызывает route() в app.js) ═════════════
// на этих экранах снег не нужен: задания, контрольная и игры
const NY_QUIET = ['practice', 'review', 'exam', 'speed', 'teach', 'balloons', 'blocks', 'puzzles', 'jump', 'nygame', 'parent'];
function nySnow() {
  if (document.querySelector('.ny-snow')) return;
  const el = document.createElement('div');
  el.className = 'ny-snow';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = Array.from({ length: 18 }, (_, i) =>
    `<i style="--x:${(i * 37 + 5) % 100}%;--d:${(10 + (i * 7) % 9).toFixed(1)}s;--w:-${((i * 1.9) % 14).toFixed(1)}s;--s:${11 + (i * 5) % 13}px;--dx:${((i % 5) - 2) * 22}px">${['❅', '❆', '•'][i % 3]}</i>`).join('');
  document.body.appendChild(el);
}
function nyDecorate(name) {
  const on = nyOn();
  document.body.classList.toggle('ny', on);
  document.body.classList.toggle('ny-quiet', NY_QUIET.includes(name));
  if (!on) return;
  nySnow();
  nyState();
  const sc = app.firstElementChild;
  if (!sc) return;
  const cont = sc.querySelector(':scope > .continue');
  if (cont) cont.insertAdjacentHTML('afterend', nyHomeCard());
  const lb = sc.querySelector(':scope > .learn-btns');
  if (lb) lb.insertAdjacentHTML('afterend', `<button class="ny-banner blue" data-go="#newyear">${nyFlakes(5)}<span class="nyb-e">🎄</span>
    <span class="nyb-body"><b>Новогодний остров</b><small>Задачи про подарки, гирлянды и снежки. И календарь с окошками!</small></span><span class="nyb-go">›</span></button>`);
  const gs = name === 'games' && sc.querySelector(':scope > .g-sec');
  if (gs) gs.insertAdjacentHTML('beforebegin', `<button class="ny-banner" data-go="#nygame">${nyFlakes(5)}<span class="nyb-e">🎁</span>
    <span class="nyb-body"><b>Подарки — новогодняя игра</b><small>Лови подарок с верным ответом! ${((S.gm || {}).ny || {}).best ? `Рекорд: ${S.gm.ny.best}` : 'С примерами — даёт ⭐'}</small></span><span class="nyb-go">›</span></button>`);
}
function nyHomeCard() {
  const s = nyStatus(), left = nyLeft(), st = nyState();
  const sub = {
    open: 'Окошко дня ждёт тебя! Открой его 🎁',
    need: 'Пройди урок — и откроется окошко с подарком',
    done: nyTodayKey() === 'jan1' ? 'Звезда на ёлке! Ты умничка 💖' : 'Окошко дня открыто ✓ Следующее — завтра!',
    none: 'Наряжай ёлку вместе с Пинки!',
  }[s];
  return `<button class="ny-home ${s}" data-go="#newyear">${nyFlakes(7)}${nyTree(nyToys(), !!st.open.jan1)}
    <span class="nyh-body"><small>${left > 0 ? 'До Нового года' : 'Ура, праздник!'}</small><b>${left > 0 ? `${left} ${U.plural(left, 'день', 'дня', 'дней')}` : 'С Новым годом!'}</b><span>${sub}</span></span>${s === 'open' ? '<em>1</em>' : ''}</button>`;
}

// ═════════════ Экран «Новый год»: ёлка, окошко дня, календарь, уроки ═════════════
function nyHub(opt = {}) {
  if (!nyOn()) return go('#home');
  const st = nyState(), today = nyKey(nyNow()), s = nyStatus(), left = nyLeft(), toys = nyToys(), jan = nyNow().getMonth() === 0;
  const dm = k => [Number(k.slice(8)), Number(k.slice(5, 7)) - 1];
  const cell = k => {
    const o = st.open[k], [d, m] = dm(k), date = `<small>${d} ${NY_MON3[m]}</small>`;
    let cls, inner;
    if (o) { cls = 'got'; inner = `<span class="nc-e">${o.e}</span>${date}${o.n ? `<i>+${o.n}</i>` : ''}`; }
    else if (k === today) { cls = s === 'open' ? 'today' : 'today lock'; inner = `<span class="nc-e">🎁</span>${date}`; }
    else if (k > today) { cls = 'future'; inner = `<b>${d}</b>${date.replace(/\d+ /, '')}`; }
    else if (k < st.first) { cls = 'pre'; inner = `<b>${d}</b>${date.replace(/\d+ /, '')}`; }
    else { cls = 'frost'; inner = `<span class="nc-e">❄️</span>${date}`; }
    return `<button class="ny-c ${cls}" data-cell="${k}">${inner}</button>`;
  };
  const jo = st.open.jan1, janCls = jo ? 'got' : jan ? (s === 'open' ? 'today' : 'today lock') : 'future';
  const janCell = `<button class="ny-c big ${janCls}" data-cell="jan1"><span class="nc-e">${jo ? '🌟' : jan ? '🎁' : '🎄'}</span>
    <span class="nc-t"><b>1 января</b><small>${jo ? 'Звезда на ёлке! С Новым годом!' : `Большое окошко: звезда на ёлку, +${NY.starsJan} ⭐ и грамота`}</small></span></button>`;
  const status = {
    open: `<p class="ny-st">Сегодня ты занималась — окошко дня можно открыть!</p><button class="btn big wide ny-open-btn" data-act="ny-open">🎁 Открыть окошко</button>`,
    need: `<p class="ny-st">Окошко дня откроется, когда пройдёшь урок. Подойдёт любой: обычный или новогодний 👇</p><button class="btn big wide" data-go="${nextStep().go}">📖 К уроку</button>`,
    done: nyTodayKey() === 'jan1' ? '<p class="ny-st">🎉 С Новым годом! Звезда сияет на макушке. Ты умничка!</p>'
      : '<p class="ny-st">✅ Сегодняшнее окошко открыто. Следующее — завтра! Каждое окошко — новая игрушка на ёлке.</p>',
    none: '<p class="ny-st">Сегодня окошек нет. Зато можно решать новогодние задачи и играть в «Подарки»!</p>',
  }[s];
  const lessons = NY_LESSONS.map(l => {
    const r = S.lessons[l.id] || {};
    return `<button class="lesson-card" data-go="#lesson/${l.id}"><div class="lc-num">${l.emoji}</div>
      <div class="lc-body"><div class="lc-title">${l.title}</div><div class="lc-sub">${r.runs ? `Пройден ${r.runs} ${U.plural(r.runs, 'раз', 'раза', 'раз')}` : l.sub}</div></div>
      <div class="lc-stars">${starsHTML(r.best || 0)}</div></button>`;
  }).join('');
  app.innerHTML = `<div class="screen ny-hub">${header('🎄 Новый год', '#home')}
    <div class="ny-sky">${nyFlakes(12)}<div class="ny-sky-in">${nyTree(toys, !!jo, opt.fresh)}
      <div class="ny-count">${left > 0 ? `<small>До Нового года</small><b>${left}</b><span>${U.plural(left, 'день', 'дня', 'дней')}</span>` : '<small>Ура, праздник!</small><b class="hny">С Новым годом!</b>'}
        <p>🎄 Игрушек на ёлке<br><strong>${toys} из ${NY.cap}</strong></p></div></div><div class="ny-drift"></div></div>
    <div class="card ny-today">${status}</div>
    <h2 class="sec">📅 Календарь окошек</h2>
    <div class="ny-cal">${nyDays().map(cell).join('')}${janCell}</div>
    <p class="muted center">Окошко дня открывается после урока. Каждое 7-е окошко — подарок для Пинки. ❄️ — пропущенное окошко.</p>
    <h2 class="sec">🧮 Новогодние задачи</h2>
    <div class="lessons">${lessons}</div>
    <button class="ny-banner" data-go="#nygame">${nyFlakes(5)}<span class="nyb-e">🎁</span><span class="nyb-body"><b>Игра «Подарки»</b><small>Лови подарок с верным ответом!</small></span><span class="nyb-go">›</span></button>
  </div>`;
  app.onclick = e => {
    if (e.target.closest('[data-act="ny-open"]')) return nyOpenShow();
    const c = e.target.closest('[data-cell]');
    if (!c) return;
    const k = c.dataset.cell;
    if (st.open[k]) { toast('Это окошко уже открыто 💖'); return; }
    if (k === 'jan1' ? jan : k === today) {
      if (s === 'open') nyOpenShow(); else toast('Сначала пройди урок — и окошко откроется!');
      return;
    }
    if (k === 'jan1') { toast('Это окошко откроется 1 января 🎄'); return; }
    const [d, m] = dm(k);
    if (k > today) toast(`Это окошко откроется ${d} ${NY_MON[m]} ⏳`);
    else if (k < st.first) toast('Тогда календаря ещё не было ❄️');
    else toast('Это окошко замёрзло ❄️ Заходи каждый день!');
  };
}

// ═════════════ Новогодние уроки ═════════════
const NY_GOODS = [ // [1 штука, 2–4 штуки, 5+ штук, мин. цена, макс. цена, «купила … по»]
  ['ёлочный шарик', 'ёлочных шарика', 'ёлочных шариков', 35, 90, 'ёлочные шарики'],
  ['хлопушка', 'хлопушки', 'хлопушек', 25, 60, 'хлопушки'],
  ['гирлянда', 'гирлянды', 'гирлянд', 150, 400, 'гирлянды'],
  ['упаковка мишуры', 'упаковки мишуры', 'упаковок мишуры', 40, 120, 'упаковки мишуры'],
  ['новогодняя открытка', 'новогодние открытки', 'новогодних открыток', 20, 70, 'новогодние открытки'],
  ['коробка конфет', 'коробки конфет', 'коробок конфет', 120, 350, 'коробки конфет'],
  ['снежный шар', 'снежных шара', 'снежных шаров', 180, 500, 'снежные шары'],
];
const nyG = (g, n) => U.plural(n, g[0], g[1], g[2]);
const nyUp = s => s[0].toUpperCase() + s.slice(1);
const nyPick2 = () => { const a = U.pick(NY_GOODS); let b; do { b = U.pick(NY_GOODS); } while (b === a); return [a, b]; };
const nyCandy = n => U.plural(n, 'конфету', 'конфеты', 'конфет');
const nyBoxes = n => U.plural(n, 'подарок', 'подарка', 'подарков');

const NY_LESSONS = [
  {
    id: 'ny1', title: 'Новогодние покупки', emoji: '🎁', sub: 'Ёлочный базар, сдача, подарки поровну',
    theory: [
      {
        title: 'Ёлочный базар',
        html: `<p><b>Цена</b> — сколько стоит одна вещь. <b>Количество</b> — сколько вещей купили. <b>Стоимость</b> — сколько заплатили за всё.</p>
          <div class="rule big">Стоимость = цена · количество</div>
          <div class="ex">Хлопушка стоит 30 р. Купили 4 хлопушки.<br>30 · 4 = <b>120 р.</b></div>`,
      },
      {
        title: 'Сдача',
        html: `<p>Сдача — это деньги, которые вернули. Из того, что дали продавцу, вычитаем стоимость покупки.</p>
          <div class="ex">Дали 500 р., покупка стоит 360 р.<br>500 − 360 = <b>140 р.</b> сдачи</div>`,
      },
      {
        title: 'Подарки поровну',
        html: `<p>Разложить поровну — значит <b>разделить</b>.</p>
          <div class="ex">48 конфет в 6 подарков:<br>48 : 6 = <b>8</b> конфет в каждом</div>
          <p>Если поровну не делится, получается <b>остаток</b>. Он всегда меньше делителя.</p>
          <div class="ex">50 : 6 = 8 (ост. 2)</div>`,
      },
      {
        title: 'Сначала одна штука',
        html: `<p>Если известно, сколько стоят несколько одинаковых вещей, сначала найди цену одной.</p>
          <div class="ex">3 шарика стоят 150 р. Сколько стоят 5 шариков?<br>150 : 3 = 50 р. — один шарик<br>50 · 5 = <b>250 р.</b></div>`,
      },
    ],
    plan: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3],
    gens: {
      1: [
        {
          name: 'Ёлочный базар', fn: () => {
            const g = U.pick(NY_GOODS), p = U.rnd(g[3], g[4]), n = U.rnd(2, 9);
            return T.num(word(`${nyUp(g[0])} стоит ${p} р. Пинки купила ${n} ${nyG(g, n)}. Сколько она заплатила?`), p * n, {
              unit: 'р.', hint: 'Стоимость = цена · количество.', explain: `${p} · ${n} = ${U.fmt(p * n)} р.`, meta: { expr: `${p}*${n}` },
            });
          },
        },
        {
          name: 'Конфеты в подарки', fn: () => {
            const per = U.rnd(4, 9), k = U.rnd(3, 9), tot = per * k;
            return T.num(word(`Учительница разложила ${tot} ${nyCandy(tot)} в ${k} ${nyBoxes(k)} поровну. Сколько конфет в каждом подарке?`), per, {
              unit: 'шт.', hint: 'Разложить поровну — значит разделить: все конфеты делим на число подарков.', explain: `${tot} : ${k} = ${per}`, meta: { expr: `${tot}/${k}` },
            });
          },
        },
        {
          name: 'Сколько штук купили', fn: () => {
            const g = U.pick(NY_GOODS), p = U.rnd(g[3], g[4]), n = U.rnd(2, 9);
            return T.num(word(`Пинки купила ${g[5]} по ${p} р. за штуку и заплатила ${U.fmt(p * n)} р. Сколько штук она купила?`), n, {
              unit: 'шт.', hint: 'Количество = стоимость : цена.', explain: `${U.fmt(p * n)} : ${p} = ${n} шт.`, meta: { expr: `${p * n}/${p}` },
            });
          },
        },
      ],
      2: [
        {
          name: 'Сдача', fn: () => {
            const g = U.pick(NY_GOODS), p = U.rnd(g[3], g[4]), n = U.rnd(2, 5), pay = Math.ceil((p * n + 1) / 500) * 500;
            return T.num(word(`У Маши было ${U.fmt(pay)} р. Она купила ${n} ${nyG(g, n)} по ${p} р. Сколько сдачи она получила?`), pay - p * n, {
              unit: 'р.', hint: 'Сначала найди стоимость покупки, потом вычти её из денег Маши.',
              explain: `${p} · ${n} = ${U.fmt(p * n)} р.; ${U.fmt(pay)} − ${U.fmt(p * n)} = ${U.fmt(pay - p * n)} р.`, meta: { expr: `${pay}-${p}*${n}` },
            });
          },
        },
        {
          name: 'Две покупки', fn: () => {
            const [g1, g2] = nyPick2(), p1 = U.rnd(g1[3], g1[4]), n1 = U.rnd(2, 5), p2 = U.rnd(g2[3], g2[4]), n2 = U.rnd(2, 5);
            return T.num(word(`Для праздника в классе купили ${n1} ${nyG(g1, n1)} по ${p1} р. и ${n2} ${nyG(g2, n2)} по ${p2} р. Сколько стоила вся покупка?`), p1 * n1 + p2 * n2, {
              unit: 'р.', hint: 'Найди стоимость каждой покупки и сложи их.',
              explain: `${p1} · ${n1} = ${U.fmt(p1 * n1)}; ${p2} · ${n2} = ${U.fmt(p2 * n2)}; ${U.fmt(p1 * n1)} + ${U.fmt(p2 * n2)} = ${U.fmt(p1 * n1 + p2 * n2)} р.`,
              meta: { expr: `${p1}*${n1}+${p2}*${n2}` },
            });
          },
        },
        {
          name: 'Конфеты с остатком', fn: () => {
            const k = U.rnd(3, 8), per = U.rnd(4, 9), r = U.rnd(1, k - 1), D = per * k + r;
            return T.rem(word(`Пинки раскладывает ${D} ${nyCandy(D)} в ${k} ${nyBoxes(k)} поровну. Сколько конфет будет в каждом подарке и сколько останется?`), per, r, {
              hint: 'Это деление с остатком. Помни: остаток всегда меньше числа подарков.',
              explain: `${D} : ${k} = ${per} (ост. ${r}), потому что ${per} · ${k} = ${per * k}, а ${D} − ${per * k} = ${r}`, meta: { D, d: k },
            });
          },
        },
      ],
      3: [
        {
          name: 'Через цену одной', fn: () => {
            const g = U.pick(NY_GOODS), p = U.rnd(g[3], g[4]), n1 = U.rnd(2, 6);
            let n2; do { n2 = U.rnd(2, 9); } while (n2 === n1);
            return T.num(word(`${n1} ${nyG(g, n1)} стоят ${U.fmt(p * n1)} р. Сколько стоят ${n2} ${nyG(g, n2)}?`), p * n2, {
              unit: 'р.', hint: 'Сначала узнай, сколько стоит одна штука.',
              explain: `${U.fmt(p * n1)} : ${n1} = ${p} р. — одна штука; ${p} · ${n2} = ${U.fmt(p * n2)} р.`, meta: { expr: `${p * n1}/${n1}*${n2}` },
            });
          },
        },
        {
          name: 'Подарки для класса', fn: () => {
            const a = U.rnd(2, 5), b = U.rnd(3, 9), n = U.pick([12, 14, 15, 16, 18, 20, 24, 25, 26, 28, 30]);
            return T.num(word(`В каждый новогодний подарок кладут ${a} ${U.plural(a, 'мандарин', 'мандарина', 'мандаринов')} и ${b} ${nyCandy(b)}. Сколько всего мандаринов и конфет в ${n} подарках?`), (a + b) * n, {
              unit: 'шт.', hint: 'Сначала узнай, сколько сладостей в одном подарке.',
              explain: `${a} + ${b} = ${a + b} в одном подарке; ${a + b} · ${n} = ${(a + b) * n}`, meta: { expr: `(${a}+${b})*${n}` },
            });
          },
        },
        {
          name: 'Фабрика игрушек', fn: () => {
            const a = U.rnd(1205, 4890), b = U.rnd(3, 9);
            return T.num(word(`Фабрика ёлочных игрушек делает за день ${U.fmt(a)} ${U.plural(a, 'шар', 'шара', 'шаров')}. Сколько шаров она сделает за ${b} ${U.plural(b, 'день', 'дня', 'дней')}?`), a * b, {
              unit: 'шт.', hint: 'Умножь столбиком: сколько шаров за день · число дней.', explain: `${U.fmt(a)} · ${b} = ${U.fmt(a * b)}`,
              meta: { expr: `${a}*${b}` }, sol: { kind: 'mul', a, b },
            });
          },
        },
      ],
    },
  },
  {
    id: 'ny2', title: 'Зимние задачи', emoji: '❄️', sub: 'Время до праздника, гирлянды, снежинки',
    theory: [
      {
        title: 'Часы и минуты',
        html: `<div class="rule">1 ч = 60 мин<br>1 сутки = 24 ч<br>В декабре 31 день</div>
          <div class="ex">2 ч = 60 · 2 = <b>120 мин</b></div>
          <p>Новый год наступает в полночь — в 24 ч. Это же 0 ч новых суток.</p>`,
      },
      {
        title: 'Гирлянда по краю',
        html: `<p>Если гирлянду вешают по краю окна, её длина — это <b>периметр</b> прямоугольника.</p>
          <div class="rule big">P = (a + b) · 2</div>
          <div class="ex">Окно 10 дм и 14 дм:<br>(10 + 14) · 2 = <b>48 дм</b></div>`,
      },
      {
        title: 'Метры и сантиметры',
        html: `<div class="rule">1 м = 10 дм = 100 см</div>
          <div class="ex">Ленту 3 м режут на куски по 50 см.<br>3 м = 300 см; 300 : 50 = <b>6</b> кусков</div>`,
      },
      {
        title: 'Задачи в два действия',
        html: `<p>Сначала подумай, что можно узнать первым.</p>
          <div class="ex">2 класса вырезали по 30 снежинок и поровну наклеили их на 4 окна.<br>30 · 2 = 60 снежинок всего<br>60 : 4 = <b>15</b> на каждом окне</div>`,
      },
    ],
    plan: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3],
    gens: {
      1: [
        {
          name: 'Часы до полуночи', fn: () => {
            const h = U.rnd(13, 22);
            return T.num(word(`Сейчас ${h} ч. Новый год наступит в полночь — в 24 ч. Сколько часов осталось ждать?`), 24 - h, {
              unit: 'ч', hint: 'Вычти из 24, сколько часов сейчас.', explain: `24 − ${h} = ${24 - h} ч`, meta: { expr: `24-${h}` },
            });
          },
        },
        {
          name: 'Часы в минуты', fn: () => {
            const h = U.rnd(2, 5);
            return T.num(word(`Пинки и Маша наряжали ёлку ${h} ${U.plural(h, 'час', 'часа', 'часов')}. Сколько это минут?`), h * 60, {
              unit: 'мин', hint: 'В одном часе 60 минут.', explain: `60 · ${h} = ${h * 60} мин`, meta: { expr: `${h}*60` },
            });
          },
        },
        {
          name: 'Снежки', fn: () => {
            const per = U.rnd(3, 9), m = U.rnd(4, 12);
            return T.num(word(`Пинки лепит ${per} ${U.plural(per, 'снежок', 'снежка', 'снежков')} за минуту. Сколько снежков она слепит за ${m} ${U.plural(m, 'минуту', 'минуты', 'минут')}?`), per * m, {
              unit: 'шт.', hint: 'Каждую минуту — одинаково. Это умножение.', explain: `${per} · ${m} = ${per * m}`, meta: { expr: `${per}*${m}` },
            });
          },
        },
      ],
      2: [
        {
          name: 'Гирлянда по краю окна', fn: () => {
            const a = U.rnd(8, 16);
            let b; do { b = U.rnd(10, 20); } while (b === a);
            return T.num(word(`Окно в классе шириной ${a} дм и высотой ${b} дм. Гирлянду повесили по всему краю окна. Какой длины гирлянда?`), (a + b) * 2, {
              unit: 'дм', hint: 'Гирлянда идёт по краю — это периметр прямоугольника: (ширина + высота) · 2.',
              explain: `(${a} + ${b}) · 2 = ${(a + b) * 2} дм`, meta: { expr: `(${a}+${b})*2` },
            });
          },
        },
        {
          name: 'Куски мишуры', fn: () => {
            const m = U.rnd(2, 9), piece = U.pick([20, 25, 50]), n = m * 100 / piece;
            return T.num(word(`Ленту мишуры длиной ${m} м разрезали на куски по ${piece} см. Сколько получилось кусков?`), n, {
              unit: 'шт.', hint: 'Сначала переведи метры в сантиметры: в 1 м — 100 см.',
              explain: `${m} м = ${m * 100} см; ${m * 100} : ${piece} = ${n}`, meta: { expr: `${m}*100/${piece}` },
            });
          },
        },
        {
          name: 'Дни до Нового года', fn: () => {
            const d = U.rnd(5, 28);
            return T.num(word(`Сегодня ${d} декабря. Сколько дней осталось до 1 января? В декабре 31 день.`), 32 - d, {
              unit: 'дн.', hint: 'Сначала сосчитай, сколько дней осталось до конца декабря, и прибавь ещё один день.',
              explain: `До конца декабря: 31 − ${d} = ${31 - d}. И ещё один день до 1 января: ${31 - d} + 1 = ${32 - d}`, meta: { expr: `32-${d}` },
            });
          },
        },
      ],
      3: [
        {
          name: 'Снежинки на окнах', fn: () => {
            const c = U.rnd(2, 5), k = U.rnd(4, 10), w = U.pick([4, 6, 8]), per = k * w;
            return T.num(word(`Каждый из ${c} классов вырезал по ${per} ${U.plural(per, 'снежинке', 'снежинки', 'снежинок')}. Все снежинки поровну наклеили на ${w} ${U.plural(w, 'окно', 'окна', 'окон')}. Сколько снежинок на каждом окне?`), c * k, {
              unit: 'шт.', hint: 'Сначала узнай, сколько снежинок вырезали все классы вместе, потом раздели на окна.',
              explain: `${per} · ${c} = ${per * c}; ${per * c} : ${w} = ${c * k}`, meta: { expr: `${per}*${c}/${w}` },
            });
          },
        },
        {
          name: 'Когда закончился праздник', fn: () => {
            let h1, m1, h2, m2, tot;
            do { h1 = U.rnd(15, 18); m1 = 5 * U.rnd(2, 11); h2 = U.rnd(1, 3); m2 = 5 * U.rnd(2, 10); tot = h1 * 60 + m1 + h2 * 60 + m2; } while (tot % 60 === 0);
            const eh = Math.floor(tot / 60), em = tot % 60;
            return T.pair(word(`Новогодний праздник в школе начался в ${h1} ч ${m1} мин и шёл ${h2} ч ${m2} мин. Во сколько он закончился?`), eh, em, ['ч', 'мин'], {
              hint: 'Сложи отдельно часы и минуты. Если минут стало 60 или больше, 60 минут — это ещё один час.',
              explain: `${h1} ч ${m1} мин + ${h2} ч ${m2} мин = ${eh} ч ${em} мин`, meta: { pairExpr: `[Math.floor(${tot}/60), ${tot}%60]` },
            });
          },
        },
        {
          name: 'Ёлочки в питомнике', fn: () => {
            const d = U.rnd(3, 9), q = U.rnd(105, 987), D = q * d;
            return T.num(word(`В питомнике вырастили ${U.fmt(D)} ${U.plural(D, 'ёлочку', 'ёлочки', 'ёлочек')} и рассадили их поровну в ${d} ${U.plural(d, 'ряд', 'ряда', 'рядов')}. Сколько ёлочек в каждом ряду?`), q, {
              unit: 'шт.', hint: 'Раздели столбиком: все ёлочки : число рядов.', explain: `${U.fmt(D)} : ${d} = ${q}`,
              meta: { expr: `${D}/${d}` }, sol: { kind: 'div', D, d },
            });
          },
        },
      ],
    },
  },
];
const NY_TOPIC = { id: 'ny', title: 'Новогодний остров', emoji: '🎄', lessons: NY_LESSONS };
if (typeof LESSON_BY_ID !== 'undefined') NY_LESSONS.forEach(l => { l.topic = 'ny'; LESSON_BY_ID[l.id] = l; });

// ═════════════ Совушка Луна знает про Новый год ═════════════
if (typeof HK !== 'undefined') HK.app.push({
  id: 'newyear', k: ['новый год', 'новым годом', 'нового года', 'новогод*', 'елк*', 'елочк*', 'снеговик*', 'окошк*'],
  a: () => {
    if (!nyOn()) return 'Новогодний праздник у нас бывает с 13 ноября по 15 января 🎄 Тогда появятся ёлка, календарь с окошками и игра «Подарки».';
    const n = nyLeft(), s = nyStatus();
    return `${n > 0 ? `До Нового года ${n} ${U.plural(n, 'день', 'дня', 'дней')}! 🎄` : 'С Новым годом, Лизок! 🎉'}<br>Каждый день в новогоднем календаре открывается одно окошко с подарком — после урока. И каждое окошко вешает игрушку на твою ёлку.${s === 'open' ? '<br>Сегодняшнее окошко уже можно открыть!' : s === 'need' ? '<br>Пройди сегодня урок — и окошко откроется.' : ''}<br>А ещё есть новогодние задачи и игра «Подарки».`;
  },
  acts: () => (nyOn() ? [{ t: '🎄 К ёлочке', go: '#newyear' }, { t: '🎁 Игра «Подарки»', go: '#nygame' }] : []),
});

// ═════════════ Режим «Для брата» ═════════════
function nyAdmin() {
  const n = S.ny ? Object.keys(S.ny.open || {}).length : 0, best = ((S.gm || {}).ny || {}).best || 0, season = nySeasonOf(new Date()) > 0;
  return `<div class="card"><h3>🎄 Новый год</h3>
    <p class="muted">Снег и гирлянда, ёлка на главной, календарь с окошками (окошко дня открывается только после урока), 2 новогодних урока, вещи для Пинки и игра «Подарки» с примерами. Само включается с 13 ноября по 15 января.</p>
    <p class="muted">Открыто окошек: <b>${n}</b>. Рекорд в «Подарках»: <b>${best}</b>.</p>
    <p class="muted">Сейчас: <b>${S.nyOff ? 'выключено' : season ? 'включено' : 'не сезон'}</b></p>
    <button class="btn ghost wide" data-act="ny-toggle">${S.nyOff ? '▶️ Включить новогоднее' : '⏸️ Выключить новогоднее'}</button></div>`;
}
function nyAction(a) {
  if (a !== 'ny-toggle') return false;
  S.nyOff = !S.nyOff;
  save();
  nyDecorate('parent');
  toast(S.nyOff ? 'Новогоднее выключено' : 'Новогоднее включено 🎄');
  return true;
}

// ═════════════ Игра «Подарки» ═════════════
// С неба падают 3 подарка с числами, наверху пример. Пинки с корзинкой ловит подарок с верным ответом.
// Не тот подарок или упущенный верный — минус сердечко. 1 ⭐ за каждые 5 верных (это математика).
// Всё на одном холсте, картинки готовятся заранее (правила из «Прыжков»).
const NYG = { V0: 85, DV: 6, VMAX: 240, GS: 60, CATCH: 44, SPEED: 820, EVERY: 5, LIVES: 3 };
const NYG_BOX = [['#ff6b6b', '#ffd43b'], ['#4dabf7', '#ffffff'], ['#51cf66', '#ff6b6b'], ['#b197fc', '#ffd43b'], ['#ff8fc0', '#ffffff']];
const NYG_FONT = '900 20px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
const nyImg = {};
const nyLoad = (k, src) => { if (!nyImg[k]) { nyImg[k] = new Image(); nyImg[k].src = src; } return nyImg[k]; };
const nyReady = im => im.complete && im.naturalWidth > 0;
let nyMeasure = null;
function nyRR(x, X, Y, w, h, r) {
  x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r);
  x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
}
function nyCanvas(w, h, sc, paint) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * sc); c.height = Math.ceil(h * sc);
  const x = c.getContext('2d');
  x.scale(sc, sc); paint(x);
  return { c, w, h };
}
function nyBoxSprite(i, sc) {
  const [body, rib] = NYG_BOX[i % NYG_BOX.length], G = NYG.GS;
  return nyCanvas(G + 8, G + 8, sc, x => {
    x.translate(4, 4);
    x.fillStyle = 'rgba(0,0,0,.2)'; nyRR(x, 4, 18, G - 6, G - 16, 9); x.fill();
    x.fillStyle = body; nyRR(x, 2, 14, G - 4, G - 17, 9); x.fill();
    x.fillStyle = 'rgba(255,255,255,.22)'; nyRR(x, 6, 24, 10, G - 32, 5); x.fill();
    x.fillStyle = body; nyRR(x, -2, 8, G + 4, 14, 6); x.fill();
    x.fillStyle = 'rgba(0,0,0,.14)'; x.fillRect(0, 20, G, 3);
    x.fillStyle = rib; x.fillRect(G / 2 - 5, 8, 10, G - 11);
    for (const s of [-1, 1]) { x.beginPath(); x.ellipse(G / 2 + s * 9, 5, 9, 5.5, s * 0.5, 0, Math.PI * 2); x.fill(); }
    x.beginPath(); x.arc(G / 2, 7, 4.5, 0, Math.PI * 2); x.fill();
  });
}
function nyLabel(val, sc) {
  const t = U.fmt(val);
  nyMeasure = nyMeasure || document.createElement('canvas').getContext('2d');
  nyMeasure.font = NYG_FONT;
  const w = Math.ceil(nyMeasure.measureText(t).width) + 16;
  return nyCanvas(w, 28, sc, x => {
    x.fillStyle = '#fff'; nyRR(x, 0, 0, w, 28, 14); x.fill();
    x.font = NYG_FONT; x.fillStyle = '#3b2a8f'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, w / 2, 15);
  });
}
// Пинки в шапке с корзинкой; верхний край корзинки — на высоте 70 картинки
function nyPinkySprite(sc) {
  const pk = nyLoad('p', 'img/pinky.svg'), hat = nyLoad('h', 'img/ny-hat.svg');
  if (!nyReady(pk)) return null;
  return nyCanvas(100, 108, sc, x => {
    x.drawImage(pk, 15, 16, 70, 70);
    if (nyReady(hat)) x.drawImage(hat, 30, 0, 40, 34);
    x.fillStyle = '#ff8fc0';
    x.beginPath(); x.moveTo(8, 76); x.lineTo(92, 76); x.lineTo(82, 106); x.lineTo(18, 106); x.closePath(); x.fill();
    x.strokeStyle = '#ff5fa2'; x.lineWidth = 3;
    for (let i = 1; i < 6; i++) { const a = 8 + i * 14, b = 18 + i * 10.7; x.beginPath(); x.moveTo(a, 80); x.lineTo(b, 104); x.stroke(); }
    x.fillStyle = '#e64993'; nyRR(x, 3, 70, 94, 10, 5); x.fill();
  });
}
function nyGame() {
  const st = (S.gm.ny = S.gm.ny || { best: 0, runs: 0 });
  nyLoad('p', 'img/pinky.svg'); nyLoad('h', 'img/ny-hat.svg');
  app.innerHTML = `<div class="screen">${header('🎁 Подарки', '#games')}
    <div class="nyg-demo" aria-hidden="true"><i>🎁</i><i>🎁</i><i>🎁</i><img src="img/pinky.svg" alt=""></div>
    ${mascotHTML('С неба падают подарки с числами, а наверху — пример. Двигай Пинки пальцем и лови подарок с правильным ответом! Не тот подарок или упущенный верный — минус сердечко.')}
    <div class="card g-rules"><b>🏆 Рекорд: ${st.best || 0} ${U.plural(st.best || 0, 'подарок', 'подарка', 'подарков')}</b><span>⭐ +1 за каждые ${NYG.EVERY} верных подарков</span>
      <span>Это игра с математикой: звёзды из неё не ограничены</span></div>
    <button class="btn big wide" data-act="play">Играть!</button></div>`;
  app.onclick = e => { if (e.target.closest('[data-act="play"]')) { sfx('tap'); nyGameRun(); } };
}
function nyGameRun() {
  stopTimers(); leaveGame();
  const st = (S.gm.ny = S.gm.ny || { best: 0, runs: 0 }), best0 = st.best || 0;
  st.runs = (st.runs || 0) + 1; save();
  app.innerHTML = `<div class="screen nyg-screen">
    <header class="top"><button class="icon-btn" data-go="#games" aria-label="Выйти">✕</button>
      <div class="nyg-q" id="nyq"></div><div class="pill" id="nys">🎁 0</div></header>
    <div class="lives" id="nyl">${'❤️'.repeat(NYG.LIVES)}</div>
    <div class="nyg-field" id="nyf"><canvas></canvas></div></div>`;
  const field = document.getElementById('nyf'), cv = field.querySelector('canvas'), ctx = cv.getContext('2d');
  const W = field.clientWidth || 360, H = field.clientHeight || Math.max(420, window.innerHeight - 170);
  const sc = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * sc); cv.height = Math.round(H * sc);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  ctx.setTransform(sc, 0, 0, sc, 0, 0);
  const qEl = document.getElementById('nyq'), sEl = document.getElementById('nys'), lEl = document.getElementById('nyl');

  // заранее нарисованное
  const boxes = NYG_BOX.map((_, i) => nyBoxSprite(i, sc));
  const dot = nyCanvas(10, 10, sc, x => { const g = x.createRadialGradient(5, 5, 0, 5, 5, 5); g.addColorStop(0, '#fff'); g.addColorStop(0.5, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 10, 10); });
  const drift = nyCanvas(W, 50, sc, x => {
    x.fillStyle = '#eef4ff';
    for (let i = 0; i <= 5; i++) { x.beginPath(); x.ellipse(W * i / 5, 34, W / 6.5, 22, 0, 0, Math.PI * 2); x.fill(); }
    x.fillRect(0, 34, W, 16);
  });
  const textCache = new Map();
  const nyText = (t, color) => {
    const k = t + color;
    if (!textCache.has(k)) {
      nyMeasure = nyMeasure || document.createElement('canvas').getContext('2d');
      nyMeasure.font = NYG_FONT;
      const w = Math.ceil(nyMeasure.measureText(t).width) + 12;
      textCache.set(k, nyCanvas(w, 30, sc, x => { x.font = NYG_FONT; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 4; x.strokeStyle = 'rgba(20,24,80,.55)'; x.strokeText(t, w / 2, 16); x.fillStyle = color; x.fillText(t, w / 2, 16); }));
    }
    return textCache.get(k);
  };
  let pinky = nyPinkySprite(sc);
  const blit = (s, x, y, w = s.w, h = s.h) => ctx.drawImage(s.c, x, y, w, h);

  const PY = H - 46; // верхний край корзинки
  const pl = { x: W / 2, tx: W / 2 };
  const gifts = [], texts = [];
  const snow = Array.from({ length: 34 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 18 + Math.random() * 30, r: 2 + Math.random() * 3.5, ph: Math.random() * 6.3, w: 0.6 + Math.random() }));
  let score = 0, lives = NYG.LIVES, wrong = 0, round = 0, v = NYG.V0, wait = 0, cur = null, over = false, alive = true, paused = false, t = 0;
  let raf = 0, last = performance.now(), keyDir = 0, dragging = false;
  const hud = () => { sEl.textContent = '🎁 ' + score; lEl.textContent = '❤️'.repeat(Math.max(0, lives)) + '🤍'.repeat(NYG.LIVES - Math.max(0, lives)); };
  const say = (txt, x, y, color = '#ffe066') => texts.push({ s: nyText(txt, color), x, y, life: 1 });

  const next = () => {
    round++;
    const modes = round <= 4 ? [SPEED_MODES.mul] : round <= 8 ? [SPEED_MODES.mul, SPEED_MODES.div] : [SPEED_MODES.mul, SPEED_MODES.div, SPEED_MODES.mix];
    let g;
    do { g = U.pick(modes).gen(); } while (cur && g[0] === cur.q);
    cur = { q: g[0], a: g[1] };
    qEl.textContent = `${g[0]} = ?`;
    qEl.classList.remove('bump'); void qEl.offsetWidth; qEl.classList.add('bump');
    const vals = U.shuffle([g[1], ...balloonOptions(g[1]).filter(x => x !== g[1]).slice(0, 2)]);
    const order = U.shuffle([0, 1, 2]);
    gifts.length = 0;
    vals.forEach((val, i) => gifts.push({ x: W * (1 + 2 * i) / 6, y: -NYG.GS / 2 - order[i] * 85, val, ok: val === g[1], st: 'fall', k: 0, box: boxes[(round + i) % boxes.length], lab: nyLabel(val, sc), fx: 0, fy: 0 }));
  };
  const endRound = (except, delay) => {
    gifts.forEach(g => { if (g !== except && g.st === 'fall') { g.st = 'poof'; g.k = 0; } });
    wait = delay;
  };
  const caught = g => {
    if (g.ok) {
      g.st = 'in'; g.k = 0; g.fx = g.x; g.fy = g.y;
      score++; sfx('star');
      say('+1', g.x, PY - 50);
      if (score % NYG.EVERY === 0) { say('⭐ +1', pl.x, PY - 85, '#ffd43b'); sfx('win'); }
      v = Math.min(NYG.VMAX, v + NYG.DV);
      hud();
      endRound(g, 0.5);
    } else {
      g.st = 'bad'; g.k = 0; lives--; wrong++;
      sfx('wrong'); say('Не тот!', g.x, PY - 50, '#ffa8a8');
      hud();
      if (lives <= 0) finish();
    }
  };
  const missed = g => {
    g.st = 'gone';
    if (!g.ok) return;
    lives--; wrong++;
    sfx('wrong'); say(`Было ${U.fmt(cur.a)}`, W / 2, PY - 70, '#ffa8a8');
    hud();
    if (lives <= 0) { finish(); return; }
    endRound(g, 0.9);
  };

  // ── управление: палец ведёт Пинки, стрелки на компьютере ──
  let rect = field.getBoundingClientRect();
  const toX = e => Math.max(36, Math.min(W - 36, e.clientX - rect.left));
  const onDown = e => {
    if (paused) { paused = false; last = performance.now(); field.querySelectorAll('.jp-pause').forEach(x => x.remove()); return; }
    dragging = true; pl.tx = toX(e);
  };
  const onMove = e => { if (dragging) pl.tx = toX(e); };
  const onUp = () => { dragging = false; };
  const onKey = e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    keyDir = e.type === 'keyup' ? 0 : e.key === 'ArrowLeft' ? -1 : 1;
  };
  const onVis = () => {
    if (document.visibilityState === 'hidden' && !over && !paused) {
      paused = true;
      const p = document.createElement('div');
      p.className = 'jp-pause'; p.innerHTML = '<b>Пауза</b><span>Нажми, чтобы продолжить</span>';
      field.appendChild(p);
    }
  };
  const onResize = () => { rect = field.getBoundingClientRect(); };
  field.addEventListener('pointerdown', onDown);
  field.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVis);
  onLeave(() => {
    alive = false; cancelAnimationFrame(raf);
    window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
    window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVis);
  });

  // ── шаг игры ──
  const update = dt => {
    t += dt;
    for (const f of snow) {
      f.y += f.v * dt; f.x += Math.sin(t * f.w + f.ph) * 12 * dt;
      if (f.y > H + 6) { f.y = -6; f.x = Math.random() * W; }
    }
    for (let i = texts.length - 1; i >= 0; i--) { texts[i].life -= dt * 1.1; texts[i].y -= 34 * dt; if (texts[i].life <= 0) texts.splice(i, 1); }
    if (over) return;
    if (keyDir) pl.tx = Math.max(36, Math.min(W - 36, pl.x + keyDir * 80));
    const d = pl.tx - pl.x, stp = NYG.SPEED * dt;
    pl.x += Math.abs(d) <= stp ? d : Math.sign(d) * stp;
    if (wait > 0) { wait -= dt; if (wait <= 0) next(); }
    for (const g of gifts) {
      if (g.st === 'fall') {
        g.y += v * dt;
        const bottom = g.y + NYG.GS / 2 - 2;
        if (bottom >= PY && bottom <= PY + 26 && Math.abs(g.x - pl.x) < NYG.CATCH) caught(g);
        else if (g.y - NYG.GS / 2 > H) missed(g);
        if (over) return;
      } else g.k += dt;
    }
  };
  const drawGift = (g, x, y, s, a) => {
    ctx.globalAlpha = a;
    const G = NYG.GS + 8;
    blit(g.box, x - G * s / 2, y - G * s / 2, G * s, G * s);
    blit(g.lab, x - g.lab.w * s / 2, y - g.lab.h * s / 2 + 6 * s, g.lab.w * s, g.lab.h * s);
  };
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    for (const f of snow) blit(dot, f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
    for (const g of gifts) {
      if (g.st === 'fall') drawGift(g, g.x, g.y, 1, 1);
      else if (g.st === 'in') { const k = Math.min(1, g.k / 0.25); if (k < 1) drawGift(g, g.fx + (pl.x - g.fx) * k, g.fy + (PY + 14 - g.fy) * k, 1 - 0.6 * k, 1 - 0.5 * k); }
      else if (g.st === 'poof' || g.st === 'bad') {
        const k = Math.min(1, g.k / 0.35);
        if (k < 1) drawGift(g, g.x + (g.st === 'bad' ? Math.sin(g.k * 60) * 5 : 0), g.y, 1 + 0.4 * k, 1 - k);
      }
    }
    ctx.globalAlpha = 1;
    blit(drift, 0, H - 50, W, 50);
    if (!pinky) pinky = nyPinkySprite(sc);
    if (pinky) {
      const lean = Math.max(-0.12, Math.min(0.12, (pl.tx - pl.x) / 600));
      ctx.save(); ctx.translate(pl.x, PY + 30); ctx.rotate(lean); blit(pinky, -50, -100, 100, 108); ctx.restore();
    } else { ctx.fillStyle = '#ff8fc0'; nyRR(ctx, pl.x - 46, PY, 92, 34, 8); ctx.fill(); }
    for (const x of texts) { ctx.globalAlpha = Math.max(0, Math.min(1, x.life * 1.6)); blit(x.s, x.x - x.s.w / 2, x.y - x.s.h / 2); }
    ctx.globalAlpha = 1;
  };

  const finish = () => {
    if (over) return;
    over = true;
    sfx('lose');
    const rec = score > best0, add = Math.floor(score / NYG.EVERY);
    st.best = Math.max(best0, score);
    S.stars += add;
    const d = day(); d.tasks += score + wrong; d.ok += score;
    save();
    later(() => {
      alive = false; // окно итогов закрывает поле: кадры больше не нужны
      gameOverBox(`<div class="cele-e">${rec ? '🏆' : '🎁'}</div><h1>${rec ? 'Новый рекорд!' : 'Игра окончена!'}</h1>
        <p class="g-final">${score} <small>${U.plural(score, 'подарок', 'подарка', 'подарков')}</small></p>
        ${add ? `<p class="g-got">+${add} ⭐ в копилку!</p>` : `<p class="muted">Поймай ${NYG.EVERY} верных подарков — получишь ⭐</p>`}
        <div class="nav-col"><button class="btn big wide" data-act="again">Ещё раз 🔄</button><button class="btn ghost wide" data-go="#games">К играм</button></div>`);
      if (rec && best0 > 0) confetti();
    }, 700);
  };
  app.onclick = e => { if (e.target.closest('[data-act="again"]')) { sfx('tap'); nyGameRun(); } };

  const loop = now => {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const raw = (now - last) / 1000;
    last = now;
    if (paused) return;
    if (!over) lastAct = Date.now(); // время в игре считается как занятия: это примеры
    update(Math.min(0.05, Math.max(0.001, raw)));
    draw();
  };
  hud();
  next();
  draw();
  raf = requestAnimationFrame(loop);
  // для проверок: шаг игры вручную
  window.__ny = { pl, gifts, get score() { return score; }, get lives() { return lives; }, get over() { return over; }, get cur() { return cur; }, W, H, PY, step: dt => { update(dt); draw(); } };
}
const NY_SCREENS = { newyear: nyHub, nygame: nyGame };

'use strict';
// Экономика звёзд и общее для игр «для отдыха».
//  • Математика даёт звёзды как раньше (1 ⭐ за ответ с первого раза, бонусы за план, острова, контрольные).
//  • Игры без математики (Блоки, Головоломки, Прыгун) дают мало: 1 ⭐ за достижение, не больше ECON.cap в день.
//  • За каждый пропущенный день из копилки улетает ECON.fine ⭐ (не больше чем за ECON.fineDays дней сразу).
// Подключается после fun2.js и до игр и app.js; S, save, day, overlay и др. берутся во время вызова.

const ECON = {
  game: 1,       // ⭐ за одно достижение в игре для отдыха
  cap: 5,        // больше этого из игр для отдыха за день не заработать
  fine: 2,       // ⭐ за каждый пропущенный день
  fineDays: 3,   // штраф считаем максимум за 3 дня подряд (болезнь, поездка)
};
const REST_GAMES = ['blocks', 'puzzles', 'jump'];

// ═════════════ Выход из игры: остановить анимацию и снять обработчики ═════════════
let gameCleanup = null;
function onLeave(fn) { gameCleanup = fn; }
function leaveGame() {
  if (!gameCleanup) return;
  const f = gameCleanup;
  gameCleanup = null;
  try { f(); } catch (e) { /* уже убрано */ }
}

// ═════════════ Звёзды из игр для отдыха ═════════════
const gameStarsToday = () => (S.days[U.today()] || {}).gs || 0;
const gameStarsLeft = () => Math.max(0, ECON.cap - gameStarsToday());
// даёт 1 ⭐, если дневной запас не исчерпан; звезда летит от элемента (или точки {x, y}) к копилке
function giveGameStar(from) {
  if (!gameStarsLeft()) return 0;
  const d = day();
  d.gs = (d.gs || 0) + ECON.game;
  S.stars += ECON.game;
  save();
  flyStarFrom(from);
  return ECON.game;
}
function flyStarFrom(from) {
  const to = document.querySelector('.top .pill');
  if (!to) return;
  let x0 = window.innerWidth / 2, y0 = window.innerHeight / 2;
  if (from && from.getBoundingClientRect) { const a = from.getBoundingClientRect(); x0 = a.left + a.width / 2; y0 = a.top + a.height / 2; }
  else if (from && typeof from.x === 'number') { x0 = from.x; y0 = from.y; }
  const b = to.getBoundingClientRect();
  const s = document.createElement('div');
  s.className = 'fly-star big';
  s.textContent = '⭐';
  s.style.left = x0 + 'px';
  s.style.top = y0 + 'px';
  document.body.appendChild(s);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    s.style.transform = `translate(${b.left + b.width / 2 - x0}px, ${b.top + b.height / 2 - y0}px) scale(.5) rotate(360deg)`;
    s.style.opacity = '0.5';
  }));
  setTimeout(() => {
    s.remove();
    to.textContent = '⭐ ' + bal();
    to.classList.remove('bump'); void to.offsetWidth; to.classList.add('bump');
  }, 760);
}

// ═════════════ Звуки для игр (тихие, синтезированные) ═════════════
const SFX = {
  tap: [[520, 0.05, 'triangle']],
  place: [[300, 0.07, 'triangle'], [420, 0.06, 'triangle']],
  clear: [[660, 0.08], [880, 0.08], [1175, 0.14]],
  star: [[988, 0.08], [1319, 0.08], [1760, 0.16]],
  win: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.28]],
  lose: [[392, 0.13], [330, 0.13], [262, 0.24]],
  jump: [[380, 0.09, 'sine', 760]],
  spring: [[300, 0.18, 'sine', 1200]],
  candy: [[1200, 0.06], [1600, 0.09]],
  wrong: [[260, 0.12, 'triangle'], [200, 0.16, 'triangle']],
  flip: [[700, 0.04, 'square']],
};
function sfx(kind, pitch = 1) {
  if (!S.sound || !SFX[kind]) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    let t = AC.currentTime;
    SFX[kind].forEach(([f, d, type = 'sine', to]) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f * pitch, t);
      if (to) o.frequency.exponentialRampToValueAtTime(to * pitch, t + d);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(type === 'square' ? 0.04 : 0.13, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.08);
      o.connect(g).connect(AC.destination);
      o.start(t); o.stop(t + d + 0.1);
      t += d * 0.85;
    });
  } catch (e) { /* без звука */ }
}

// ═════════════ Окошко «конец игры / решено» поверх игрового экрана ═════════════
function gameOverBox(html) {
  const host = app.querySelector('.screen');
  if (!host) return null;
  const box = document.createElement('div');
  box.className = 'g-over';
  box.innerHTML = `<div class="cele">${html}</div>`;
  host.appendChild(box);
  return box;
}
// строчка про звёзды в итогах игры
function starsLine(got, hint) {
  if (got) return `<p class="g-got">+${got} ⭐ в копилку!</p>`;
  if (!gameStarsLeft()) return '<p class="muted">Звёзды из игр для отдыха на сегодня собраны. Больше звёзд — за задания по математике!</p>';
  return `<p class="muted">${hint}</p>`;
}
// строка-цель вверху игры: «⭐ на 500 очков» с полоской
function goalHTML(score, miles, mile, got, unit) {
  if (!gameStarsLeft()) return `<span>${got ? 'Все ⭐ из игр на сегодня собраны!' : 'Звёзды из игр на сегодня собраны'} Играем для удовольствия 💖</span>`;
  if (mile >= miles.length) return '<span>Все ⭐ этой игры собраны! Ставь рекорд 🏆</span>';
  const prev = mile ? miles[mile - 1] : 0, goal = miles[mile];
  const pc = Math.max(0, Math.min(100, Math.round(100 * (score - prev) / (goal - prev))));
  return `<span>⭐ за ${U.fmt(goal)} ${unit}</span><div class="bar"><i style="width:${pc}%"></i></div>`;
}

// ═════════════ Пропущенные дни ═════════════
const dayNum = k => Math.round(new Date(k + 'T12:00:00').getTime() / 86400000);
// вызывается при каждом переходе и при возвращении в приложение; штраф — один раз за возвращение
function checkMissed() {
  if (!S || !S.mascot) return null;
  const t = U.today(), last = S.lastSeen;
  if (last === t) return null;
  S.lastSeen = t;
  let res = null;
  if (last && S.finesOn !== false) {
    const miss = dayNum(t) - dayNum(last) - 1;
    if (miss > 0) {
      const n = Math.min(Math.min(miss, ECON.fineDays) * ECON.fine, bal());
      if (n > 0) S.fined = (S.fined || 0) + n;
      S.fineLog = [{ d: t, miss, n }, ...(S.fineLog || [])].slice(0, 15);
      res = { miss, n };
    }
  }
  save();
  return res;
}
function missedCheck() {
  const m = checkMissed();
  if (m) setTimeout(() => showMissed(m), 650);
}
function showMissed(m) {
  const fly = Array.from({ length: Math.min(m.n, 6) }, (_, i) => `<i style="--i:${i};--x:${(i % 2 ? 1 : -1) * (30 + i * 14)}px">⭐</i>`).join('');
  overlay(`<div class="cele miss-pop">
    <div class="miss-face">${mascotFace()}<i class="tear">💧</i></div>
    <h1>Я так скучала!</h1>
    <p>Тебя не было ${m.miss} ${U.plural(m.miss, 'день', 'дня', 'дней')}.</p>
    ${m.n ? `<div class="miss-stars">${fly}</div><p><b>Из копилки улетело ${m.n} ⭐</b></p>` : '<p>Копилка была пустая — ничего не улетело.</p>'}
    <p class="muted">Заходи каждый день — и звёздочки останутся с тобой!</p>
    <button class="btn big">Я вернулась! 💖</button></div>`, 0);
}
// iPhone часто не перезапускает приложение, а просто показывает его снова — проверяем и тогда
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  try { if (S && S.mascot && gateOpen()) missedCheck(); } catch (e) { /* ещё не загрузилось */ }
});

// ═════════════ Режим «Для брата»: правила звёзд и штраф ═════════════
function econAdmin() {
  const t = S.days[U.today()] || {}, log = (S.fineLog || []).slice(0, 5), on = S.finesOn !== false;
  const dm = k => k.split('-').reverse().slice(0, 2).join('.');
  return `<div class="card"><h3>⭐ Правила звёзд</h3>
    <table class="tbl econ">
      <tr><th colspan="2">Математика — главный заработок</th></tr>
      <tr><td>Ответ с первого раза (урок, сундучок, ошибки)</td><td>+1 ⭐</td></tr>
      <tr><td>План дня: урок + сундучок + тренажёр</td><td>+5 ⭐</td></tr>
      <tr><td>Пройден остров</td><td>+10 ⭐</td></tr>
      <tr><td>Сундучок дня</td><td>5–12 ⭐ или подарок</td></tr>
      <tr><td>Контрольная на 5 / 4 / 3</td><td>+10 / +5 / +2 ⭐</td></tr>
      <tr><td>Тренажёр / Шарики</td><td>1 ⭐ за 5 / за 4 верных</td></tr>
      <tr><td>Проверь Пинки</td><td>+1 ⭐, за исправление +2 ⭐</td></tr>
      <tr><th colspan="2">Игры для отдыха — мало</th></tr>
      <tr><td>Блоки, Головоломки, Прыжки Пинки</td><td>+${ECON.game} ⭐ за достижение, не больше ${ECON.cap} ⭐ в день</td></tr>
      <tr><th colspan="2">Пропуск</th></tr>
      <tr><td>Не заходила в приложение целый день</td><td>−${ECON.fine} ⭐ за день, не больше −${ECON.fine * ECON.fineDays} ⭐ за раз</td></tr>
    </table>
    <p class="muted">Сегодня в играх для отдыха: ${Math.round((t.play || 0) / 60)} мин, получено ${t.gs || 0} из ${ECON.cap} ⭐. Это время не входит в «минуты занятий».</p>
    <p class="muted">Всего списано за пропуски: ${S.fined || 0} ⭐.${log.length ? ' Последние: ' + log.map(x => `${dm(x.d)} — −${x.n} ⭐ (не было ${x.miss} дн.)`).join('; ') : ''}</p>
    <p class="muted">Штраф за пропуск сейчас <b>${on ? 'включён' : 'выключен'}</b>. На каникулы или в болезнь его можно выключить.</p>
    <button class="btn ghost wide" data-act="fines">${on ? '⏸️ Выключить штраф за пропуск' : '▶️ Включить штраф за пропуск'}</button></div>`;
}
function econAction(a) {
  if (a !== 'fines') return false;
  S.finesOn = S.finesOn === false;
  S.lastSeen = U.today(); // не штрафовать за дни, пока штраф был выключен
  save();
  toast(S.finesOn ? 'Штраф за пропуск включён' : 'Штраф за пропуск выключен');
  return true;
}

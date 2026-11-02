'use strict';
// Ещё развлечения: «Проверь Пинки» (Лиза — учительница), пробная контрольная, грамоты, календарь серий.
// Подключается после fun.js и до app.js; функции из app.js используются во время вызова.

const NAME_FULL = 'Елизавета';
const pad2 = n => String(n).padStart(2, '0');
const keyOf = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const dateRu = t => { const d = new Date(t); return `${d.getDate()}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`; };
const mmss = s => `${Math.floor(s / 60)}:${pad2(s % 60)}`;

// ═════════════ Грамоты ═════════════
function addAward(id, sub, emoji = '📜') {
  if (S.awards.some(a => a.id === id)) return false;
  S.awards.unshift({ id, sub, emoji, t: Date.now() });
  return true;
}
function rrect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function wrapText(g, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > maxW && line) { g.fillText(line, x, y); line = w; y += lh; } else line = test;
  }
  g.fillText(line, x, y);
  return y + lh;
}
function certImage(a) {
  return new Promise(resolve => {
    const W = 1080, H = 1440, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#fff0f6'); bg.addColorStop(1, '#ffd6e8');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#ff5fa2'; g.lineWidth = 20; rrect(g, 40, 40, W - 80, H - 80, 56); g.stroke();
    g.strokeStyle = '#ffd43b'; g.lineWidth = 7; rrect(g, 84, 84, W - 168, H - 168, 40); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = '64px sans-serif';
    [[150, 170], [W - 150, 170], [150, H - 120], [W - 150, H - 120]].forEach(([x, y]) => g.fillText('⭐', x, y));
    const maxW = W - 280;
    g.fillStyle = '#e64993'; g.font = 'bold 140px Georgia, "Times New Roman", serif'; g.fillText('ГРАМОТА', W / 2, 300);
    g.font = '150px sans-serif'; g.fillText(a.emoji, W / 2, 490);
    g.fillStyle = '#4a2040'; g.font = '48px sans-serif'; g.fillText('награждается', W / 2, 600);
    g.fillStyle = '#7048e8'; g.font = 'bold 100px Georgia, "Times New Roman", serif'; g.fillText(NAME_FULL, W / 2, 720);
    let y = 820;
    g.fillStyle = '#e64993'; g.font = 'bold 52px sans-serif'; y = wrapText(g, 'самая умная и старательная ученица!', W / 2, y, maxW, 64);
    y += 30;
    g.fillStyle = '#4a2040'; g.font = '46px sans-serif'; y = wrapText(g, a.sub[0].toUpperCase() + a.sub.slice(1), W / 2, y, maxW, 60);
    g.fillStyle = '#7048e8'; g.font = 'bold 60px sans-serif'; g.fillText('Ты — умничка! 💖', W / 2, Math.max(y + 60, 1150));
    g.fillStyle = '#9a6b8a'; g.font = '36px sans-serif'; g.fillText(dateRu(a.t), W / 2, 1255);
    g.fillText('Твоя помощница Пинки', W / 2, 1305);
    const done = () => { try { resolve(c.toDataURL('image/png')); } catch (e) { resolve(null); } };
    const img = new Image();
    img.onload = () => { g.drawImage(img, 130, 1150, 130, 130); done(); };
    img.onerror = done;
    img.src = 'img/pinky.svg';
  });
}
function showCert(a) {
  const o = document.createElement('div');
  o.className = 'overlay cert-ov';
  o.innerHTML = '<div class="cert-wrap"><div class="cert-load">Рисую грамоту…</div><p class="cert-tip">Нажми и подержи картинку, чтобы сохранить её в «Фото» 💖</p><button class="btn big wide" data-close>Закрыть</button></div>';
  document.body.appendChild(o);
  o.addEventListener('click', e => { if (e.target.closest('[data-close]')) { o.classList.add('out'); setTimeout(() => o.remove(), 300); } });
  certImage(a).then(url => {
    const box = o.querySelector('.cert-load');
    if (!box) return;
    box.outerHTML = url ? `<img class="cert" src="${url}" alt="Грамота">` : '<p>Не получилось нарисовать грамоту 😿</p>';
  });
}
function awards() {
  const list = S.awards;
  app.innerHTML = `<div class="screen">${header('📜 Мои грамоты', '#pinky')}
    ${mascotHTML(list.length ? `У тебя ${list.length} ${U.plural(list.length, 'грамота', 'грамоты', 'грамот')}! Нажми на любую, чтобы посмотреть и сохранить.` : 'Грамот пока нет. Их дают за пройденный остров, за пятёрку в пробной контрольной и за 7, 14 и 30 дней занятий подряд.')}
    <div class="aw-list">${list.map((a, i) => `<button class="aw-card" data-aw="${i}"><span class="aw-e">${a.emoji}</span><div><b>Грамота</b><small>${a.sub}</small><small class="muted">${dateRu(a.t)}</small></div></button>`).join('')}</div>
    <div class="card"><h3>Как получить грамоту</h3><p>🏝️ Пройти все уроки острова<br>🏆 Получить 5 в пробной контрольной<br>🔥 Заниматься 7, 14 или 30 дней подряд</p></div></div>`;
  app.onclick = e => { const b = e.target.closest('[data-aw]'); if (b) showCert(S.awards[Number(b.dataset.aw)]); };
}

// ═════════════ Календарь серий ═════════════
const STREAK_GOALS = [
  { d: 3, stars: 5, sticker: true }, { d: 7, stars: 15, award: true },
  { d: 14, stars: 30, award: true }, { d: 30, stars: 50, award: true },
];
function bestStreak() {
  const keys = Object.keys(S.days).filter(k => S.days[k].tasks > 0).sort();
  let best = 0, run = 0, prev = null;
  for (const k of keys) {
    const d = new Date(k + 'T12:00:00');
    run = prev && Math.round((d - prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = d;
  }
  return best;
}
function checkRewards() {
  // грамоты за острова, пройденные раньше (до появления грамот)
  let changed = false;
  S.islandsDone.forEach(id => { const t = TOPICS.find(x => x.id === id); if (t && addAward('isl-' + id, `за прохождение острова «${t.title}»`, t.emoji)) changed = true; });
  const st = calcStreak(), got = [];
  STREAK_GOALS.forEach(g => {
    if (st >= g.d && !S.streakGot.includes(g.d)) {
      S.streakGot.push(g.d); S.stars += g.stars;
      if (g.sticker) giveSticker();
      if (g.award) addAward('streak-' + g.d, `за ${g.d} ${U.plural(g.d, 'день', 'дня', 'дней')} занятий подряд`, '🔥');
      got.push(g);
    }
  });
  if (changed || got.length) save();
  if (got.length) {
    const g = got[got.length - 1];
    later(() => celebrate('🔥', `${g.d} ${U.plural(g.d, 'день', 'дня', 'дней')} подряд!`, `+${g.stars} ⭐${g.award ? ' и новая грамота 📜' : ''}${g.sticker ? ' и новая наклейка' : ''}. Так держать!`), 700);
  }
}
let calOff = 0;
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
function calendar() {
  const draw = () => {
    const now = new Date(), m = new Date(now.getFullYear(), now.getMonth() + calOff, 1);
    const n = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(), start = (m.getDay() + 6) % 7;
    let cells = '';
    for (let i = 0; i < start; i++) cells += '<i class="cd empty"></i>';
    for (let d = 1; d <= n; d++) {
      const k = keyOf(new Date(m.getFullYear(), m.getMonth(), d)), v = S.days[k], done = v && v.tasks > 0;
      cells += `<i class="cd ${done ? 'done' : ''} ${k === U.today() ? 'today' : ''}"><span>${d}</span>${done ? '<b>🔥</b>' : ''}</i>`;
    }
    const st = calcStreak(), todayDone = (S.days[U.today()] || {}).tasks > 0;
    const next = STREAK_GOALS.find(g => !S.streakGot.includes(g.d));
    app.innerHTML = `<div class="screen">${header('📅 Календарь', '#pinky')}
      ${mascotHTML(todayDone ? `Сегодня ты уже занималась — огонёк горит! 🔥 ${next ? `До награды за ${next.d} ${U.plural(next.d, 'день', 'дня', 'дней')} подряд осталось ${Math.max(0, next.d - st)}.` : 'Все награды за серии собраны!'}` : 'Сегодня ты ещё не занималась. Реши хотя бы одно задание, чтобы огонёк не погас!')}
      <div class="stats-row two"><div class="stat"><b>🔥 ${st}</b><span>сейчас подряд</span></div><div class="stat"><b>🏆 ${Math.max(bestStreak(), st)}</b><span>лучшая серия</span></div></div>
      <div class="card cal">
        <div class="cal-head"><button class="icon-btn" data-m="-1" aria-label="Назад">‹</button><b>${MONTHS[m.getMonth()]} ${m.getFullYear()}</b><button class="icon-btn" data-m="1" ${calOff >= 0 ? 'disabled' : ''} aria-label="Вперёд">›</button></div>
        <div class="cal-grid">${['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map(x => `<i class="cw">${x}</i>`).join('')}${cells}</div></div>
      <div class="card"><h3>Награды за серии</h3>${STREAK_GOALS.map(g => {
        const has = S.streakGot.includes(g.d);
        return `<div class="goal ${has ? 'got' : ''}"><b>${has ? '✅' : '🔒'} ${g.d} ${U.plural(g.d, 'день', 'дня', 'дней')} подряд</b><span>+${g.stars} ⭐${g.sticker ? ' + наклейка' : ''}${g.award ? ' + грамота 📜' : ''}</span></div>`;
      }).join('')}</div></div>`;
  };
  draw();
  app.onclick = e => { const b = e.target.closest('[data-m]'); if (b && !b.disabled) { calOff += Number(b.dataset.m); draw(); } };
}

// ═════════════ «Проверь Пинки» ═════════════
function pinkyWrong(ans) {
  const s = String(ans), c = [ans + 1, ans - 1, ans + 10, ans - 10];
  if (ans > 200) c.push(ans + 100, ans - 100);
  if (s.length > 2 && s.slice(1).includes('0')) c.push(Number(s[0] + s.slice(1).replace('0', ''))); // «потеряла нуль»
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i] !== s[i + 1]) { const t = s.split(''); [t[i], t[i + 1]] = [t[i + 1], t[i]]; if (t[0] !== '0') c.push(Number(t.join(''))); }
  }
  return U.pick(c.filter(v => v > 0 && v !== ans && Number.isFinite(v)));
}
function teachTask() {
  const all = Object.values(LESSON_BY_ID), done = all.filter(l => (S.lessons[l.id] || {}).runs);
  const curT = TOPICS.find(t => t.id === S.current);
  const pool = done.length >= 2 ? done : curT ? curT.lessons : all.filter(l => !TOPICS.find(t => t.id === l.topic).extra);
  for (let k = 0; k < 50; k++) {
    const L = U.pick(pool), lv = U.pick([1, 2, 2, 3]), t = U.pick(L.gens[lv]).fn();
    if (t.type === 'num' && t.answer >= 5) return t;
  }
  return T.num(ex('36 · 4 = ?'), 144, { hint: '', explain: '36 · 4 = 144.' });
}
function teach() {
  const r = S.teach || {};
  app.innerHTML = `<div class="screen">${header('👩‍🏫 Проверь Пинки', '#games')}
    ${mascotHTML('Я тоже учу математику! Я решу 6 заданий, а ты проверь меня, как настоящая учительница. Если я ошиблась — исправь!')}
    <div class="big-emoji center">📒✏️✅</div>
    ${r.runs ? `<p class="center">Ты уже проверила ${r.runs} ${U.plural(r.runs, 'тетрадку', 'тетрадки', 'тетрадок')} Пинки. Рекорд: ${r.best} из 6.</p>` : ''}
    <button class="btn big wide" data-act="go">Проверять!</button></div>`;
  app.onclick = e => { if (e.target.closest('[data-act="go"]')) teachRun(); };
}
function teachRun() {
  const TOTAL = 6;
  let i = 0, score = 0, earned = 0, cur, shown, right, stage = 'judge', input = '';
  const unit = () => (cur.unit ? ' ' + cur.unit : '');
  const top = () => `<header class="top"><button class="icon-btn" data-go="#games" aria-label="Выйти">✕</button>
    <div class="pbar"><i style="width:${Math.round(100 * (i - 1) / TOTAL)}%"></i><span>Тетрадка ${i} / ${TOTAL}</span></div><div class="pill">⭐ ${bal()}</div></header>`;
  const draw = (fb = '') => {
    const pinky = S.mascot === 'pinky' ? pinkyHTML('mini') : '<img class="m-img" src="img/pinky.svg" alt="">';
    let body = '';
    if (stage === 'judge') body = `<div class="choices"><button class="choice ok-btn" data-j="1">✓ Верно</button><button class="choice no-btn" data-j="0">✗ Есть ошибка</button></div>`;
    else if (stage === 'fix') body = `<div class="ans-row"><div class="ans-box active">${input ? U.fmt(input) : '<span class="ph">?</span>'}</div>${cur.unit ? `<div class="ans-unit">${cur.unit}</div>` : ''}</div>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<button data-k="${k}">${k}</button>`).join('')}<button class="k-del" data-k="del">⌫</button><button data-k="0">0</button><button class="k-ok" data-k="ok">✓</button></div>`;
    else body = `${fb}<button class="btn big wide" data-act="next">${i >= TOTAL ? 'Итоги →' : 'Следующая тетрадка →'}</button>`;
    app.innerHTML = `<div class="screen practice">${top()}
      <div class="card task notebook"><div class="lvl lvl2">📒 Тетрадь Пинки</div><div class="q">${cur.q}</div>
        <div class="pinky-ans"><span class="pa-face">${pinky}</span><span>Мой ответ: <b class="${stage === 'fb' && !right ? 'strike' : ''}">${U.fmt(shown)}${unit()}</b></span></div></div>
      ${stage === 'fix' ? mascotHTML('Ой, правда ошибка! А какой правильный ответ?') : ''}
      ${body}</div>`;
  };
  const feedback = (good, text) => {
    stage = 'fb';
    draw(`<div class="sheet-inline ${good ? 'good' : 'bad'}">${mascotHTML(text, good ? 'happy' : 'calm')}<div class="explain">${cur.explain || ''}</div></div>`);
  };
  const next = () => {
    if (i >= TOTAL) return end();
    cur = teachTask(); right = Math.random() < 0.45; shown = right ? cur.answer : pinkyWrong(cur.answer);
    i++; stage = 'judge'; input = ''; draw();
  };
  const end = () => {
    S.teach = { runs: (S.teach.runs || 0) + 1, best: Math.max(S.teach.best || 0, score) };
    if (score >= 4) S.tokens = Math.min(5, (S.tokens || 0) + 1);
    save();
    app.innerHTML = `<div class="screen result"><h1>Тетрадки проверены!</h1><div class="big-emoji">👩‍🏫</div>
      ${mascotHTML(score === TOTAL ? 'Ты лучшая учительница на свете! Ни одной моей ошибки не пропустила 💖' : score >= 4 ? 'Спасибо, учительница! Теперь я знаю, где ошибалась.' : 'Было непросто! Давай проверим ещё раз — у тебя получится.', 'happy')}
      <div class="res-stats"><div><b>${score} из ${TOTAL}</b><span>проверено верно</span></div><div><b>+${earned} ⭐</b><span>заработано</span></div></div>
      ${score >= 4 ? '<p class="center">🎈 +1 игра «Шарики»!</p>' : ''}
      <div class="nav-col"><button class="btn big wide" data-act="again">Ещё тетрадки</button><button class="btn ghost wide" data-go="#home">На главную</button></div></div>`;
    if (score >= 5) confetti();
  };
  app.onclick = e => {
    if (e.target.closest('[data-act="again"]')) { i = 0; score = 0; earned = 0; next(); return; }
    if (e.target.closest('[data-act="next"]')) { next(); return; }
    const j = e.target.closest('[data-j]');
    if (j && stage === 'judge') {
      const saysOk = j.dataset.j === '1', d = day();
      d.tasks++;
      if (saysOk && right) { score++; earned++; S.stars++; d.ok++; save(); beep(true); feedback(true, U.pick(['Ура, я решила правильно! Спасибо, что проверила.', 'Верно! Ты внимательная учительница.'])); }
      else if (!saysOk && !right) { beep(true); stage = 'fix'; draw(); }
      else if (saysOk && !right) { save(); beep(false); feedback(false, `Ой, а я ошиблась! Правильно: <b>${U.fmt(cur.answer)}${unit()}</b>. Учительница должна быть внимательной 😉`); }
      else { save(); beep(false); feedback(false, `Нет-нет, тут я решила правильно: <b>${U.fmt(cur.answer)}${unit()}</b>. Проверяй внимательно!`); }
      return;
    }
    const k = e.target.closest('[data-k]');
    if (k && stage === 'fix') {
      const v = k.dataset.k;
      if (v === 'del') input = input.slice(0, -1);
      else if (v === 'ok') {
        if (!input) { toast('Сначала введи ответ'); return; }
        const d = day();
        if (Number(input) === cur.answer) { score++; earned += 2; S.stars += 2; d.ok++; save(); beep(true); feedback(true, 'Спасибо, учительница! Ты нашла и исправила мою ошибку. +2 ⭐'); }
        else { save(); beep(false); feedback(false, `Ошибку ты заметила — молодец! Но правильно так: <b>${U.fmt(cur.answer)}${unit()}</b>.`); }
        return;
      } else if (input.length < 9) input = (input === '0' ? '' : input) + v;
      draw();
    }
  };
  next();
}

// ═════════════ Пробная контрольная ═════════════
const GRADE_TEXT = {
  5: 'Пятёрка! Ты готова к настоящей контрольной 🏆',
  4: 'Четвёрка — хорошо! Повтори уроки ниже, и будет пятёрка.',
  3: 'Тройка. Не расстраивайся: повтори уроки ниже и попробуй ещё раз.',
  2: 'Пока трудно. Давай сначала пройдём уроки этого острова, а потом вернёмся.',
};
const examTime = () => mmss(Math.round((Date.now() - P.startedAt) / 1000));
function exam(tid) {
  if (tid && TOPICS.find(t => t.id === tid)) return examStart(tid);
  const last = id => S.exams.find(e => e.topic === id);
  const row = t => { const l = last(t.id); return `<button class="lesson-card" data-go="#exam/${t.id}"><div class="lc-num">${t.emoji}</div><div class="lc-body"><div class="lc-title">${t.title}</div><div class="lc-sub">${l ? `Последняя: ${dateRu(l.t)}` : 'Ещё не писала'}</div></div>${l ? `<b class="grade g${l.grade}">${l.grade}</b>` : ''}</button>`; };
  app.innerHTML = `<div class="screen">${header('📝 Пробная контрольная', '#learn')}
    ${mascotHTML('Как в школе: 10 заданий, без подсказок и с одной попыткой. В конце — оценка и совет, что повторить. За пятёрку — грамота!')}
    <div class="lessons">${TOPICS.filter(t => !t.extra).map(row).join('')}</div>
    <h2 class="sec extra-sec">⭐ Сверх учебника</h2>
    <div class="lessons">${TOPICS.filter(t => t.extra).map(row).join('')}</div></div>`;
}
function examStart(tid) {
  const t = TOPICS.find(x => x.id === tid);
  const items = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3].map(level => { const L = U.pick(t.lessons); return { lessonId: L.id, level, gi: U.rnd(0, L.gens[level].length - 1) }; });
  startSession({ mode: 'exam', title: 'Контрольная: ' + t.title, items, back: '#exam', topicId: tid, results: [] });
  every(() => { const el = document.querySelector('.practice .top .pill'); if (el && P && P.mode === 'exam') el.textContent = '⏱ ' + examTime(); }, 1000);
}
function examFinish() {
  stopTimers();
  const ok = P.firstOk, total = P.items.length, grade = ok >= 9 ? 5 : ok >= 7 ? 4 : ok >= 5 ? 3 : 2;
  const sec = Math.round((Date.now() - P.startedAt) / 1000), tp = TOPICS.find(t => t.id === P.topicId);
  const bonus = { 5: 10, 4: 5, 3: 2, 2: 0 }[grade];
  S.stars += bonus;
  S.exams.unshift({ t: Date.now(), topic: P.topicId, title: tp.title, ok, total, grade, sec });
  S.exams = S.exams.slice(0, 50);
  const newAw = grade === 5 && addAward('exam5-' + P.topicId, `за пятёрку в пробной контрольной «${tp.title}»`, '🏆');
  save();
  const weak = {};
  P.results.filter(r => !r.ok).forEach(r => { weak[r.lid] = (weak[r.lid] || 0) + 1; });
  const wrong = P.results.filter(r => !r.ok);
  app.innerHTML = `<div class="screen result">
    <h1>Контрольная проверена!</h1>
    <div class="grade-big g${grade}">${grade}</div>
    ${mascotHTML(GRADE_TEXT[grade], grade >= 4 ? 'happy' : 'calm')}
    <div class="res-stats"><div><b>${ok} из ${total}</b><span>верно</span></div><div><b>${mmss(sec)}</b><span>время</span></div><div><b>+${bonus} ⭐</b><span>за оценку</span></div></div>
    ${wrong.length ? `<div class="card left"><h3>Ошибки</h3>${wrong.map(r => `<div class="mist"><div>${U.esc(r.q)}</div><div>Твой ответ: <b class="bad">${U.esc(r.a)}</b> · Верно: <b class="good">${U.esc(r.r)}</b></div></div>`).join('')}</div>` : ''}
    ${Object.keys(weak).length ? `<div class="card left"><h3>Что повторить</h3>${Object.keys(weak).map(lid => `<button class="btn ghost wide" data-go="#lesson/${lid}">📖 ${LESSON_BY_ID[lid].title}</button>`).join('')}</div>` : ''}
    <div class="nav-col"><button class="btn big wide" data-go="#exam/${P.topicId}">📝 Ещё одна контрольная</button><button class="btn ghost wide" data-go="#exam">К списку тем</button></div></div>`;
  if (grade >= 4) confetti();
  if (newAw) later(() => celebrate('🏆', 'Новая грамота!', `За пятёрку в контрольной «${tp.title}». Посмотри её в разделе «Грамоты» 📜`), 1300);
}
function examsAdmin() {
  return `<div class="card"><h3>📝 Пробные контрольные</h3>${S.exams.length
    ? `<table class="tbl"><tr><th>Дата</th><th>Тема</th><th>Оценка</th><th>Верно</th></tr>${S.exams.slice(0, 12).map(e => `<tr><td>${dateRu(e.t)}</td><td>${e.title}<br><small class="muted">${mmss(e.sec)}</small></td><td><b class="grade g${e.grade}">${e.grade}</b></td><td>${e.ok}/${e.total}</td></tr>`).join('')}</table>`
    : '<p class="muted">Контрольных пока не было. Их можно предложить Лизе перед школьной контрольной.</p>'}</div>`;
}

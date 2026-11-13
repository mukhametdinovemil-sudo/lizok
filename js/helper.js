'use strict';
// Совушка Луна — встроенная помощница Лизы. Работает без интернета.
//  • helperBrain(текст, ctx) — разбирает вопрос и возвращает ответ { html, acts, demo, log }.
//  • helperCmd(команда, ctx) — ответ на кнопку (подсказка, правило, похожий пример, выбор темы…).
//  • Объяснения берёт из теории уроков (hFind), ответы про приложение и разговоры — из helper_kb.js.
//  • В задании не называет ответ: подсказки идут ступеньками, а вместо ответа показывает разбор такого же задания с другими числами.
// Если позже подключать настоящий ИИ, это место одно: ветка hUnknown в helperBrain.
// Подключается до app.js; S, P, TOPICS, nextStep и др. используются во время вызова.

const HELPER = { name: 'Луна', nameAcc: 'Луну', who: 'совушка-помощница', img: 'img/luna.svg' };
const H = { wrap: null, ctx: {}, task: null, step: 0, index: null, ri: -1, turn: 0, order: {} };

// ═════════════ Разбор текста ═════════════
const hNorm = s => ' ' + String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim() + ' ';
// подходит ли сообщение под один из вариантов; чем больше совпавших слов, тем выше оценка
function hMatch(n, pats) {
  let best = 0;
  for (const p of pats) {
    const ws = p.split(' ');
    const ok = ws.every(w => {
      if (w.endsWith('*')) return n.includes(' ' + w.slice(0, -1));
      if (w.endsWith('.')) return n.includes(' ' + w.slice(0, -1) + ' ');
      return n.includes(w.length <= 4 ? ` ${w} ` : ' ' + w);
    });
    if (ok) best = Math.max(best, ws.length * 100 + p.length);
  }
  return best;
}
const H_STOP = new Set(('как что такое такой такая такие это эта этот эти объясни объяснить объясните расскажи рассказать покажи показать про почему зачем где когда сколько мне меня я ты у в во на с со и а но или ли же бы не нет да ну вот тут там здесь можно надо нужно хочу хотела скажи пожалуйста плиз очень какой какая какие каких чем чего еще тоже делать сделать делают найти находить узнать решить решать считать посчитать будет есть быть был была было для по из от до за к о об при что-то кто мой моя мои твой значит называется понять понимаю ура ага угу ого').split(' '));
const H_ENDS = /(ться|тся|ами|ями|ого|его|ому|ему|ыми|ими|ешь|ишь|ать|ять|еть|ить|ах|ях|ам|ям|ом|ем|ой|ей|ую|юю|ая|яя|ое|ее|ые|ие|ий|ый|ов|ев|ет|ит|ут|ют|ат|ят|а|я|ы|и|у|ю|е|о|ь|й)$/;
const H_SAME = { угол: 'угл', день: 'дн' }; // слова, у которых меняется сама основа
function hStem(w) {
  if (H_SAME[w]) return H_SAME[w];
  const s = w.replace(H_ENDS, '');
  return s.length >= 3 ? s : w;
}
const hTokens = s => [...new Set(hNorm(s).trim().split(' ').filter(w => w.length > 1 && !H_STOP.has(w)).map(hStem))];
const hPlain = html => U.plain(html).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');

// ═════════════ Поиск по теории уроков ═════════════
function hIndex() {
  if (H.index) return H.index;
  H.index = [];
  const all = typeof NY_TOPIC !== 'undefined' ? [...TOPICS, NY_TOPIC] : TOPICS; // + новогодние уроки (newyear.js)
  for (const t of all) for (const L of t.lessons) L.theory.forEach((c, i) => {
    H.index.push({ L, i, c, lt: hTokens(L.title), tt: hTokens(t.title), ct: hTokens(c.title), bt: hTokens(U.plain(c.html)) });
  });
  return H.index;
}
// совпадение слова: целиком — 1, по началу — меньше (короткая основа «раз» не должна тянуть «разряды»)
function hHas(arr, w) {
  let v = 0;
  for (const x of arr) {
    if (x === w) return 1;
    if (x.startsWith(w)) v = w.length <= 4 ? 0.4 : 0.8;
  }
  return v;
}
function hFind(text, lessonId) {
  const q = hTokens(text).filter(w => w.length >= 3);
  if (!q.length) return null;
  let best = null;
  for (const e of hIndex()) {
    if (lessonId && e.L.id !== lessonId) continue;
    const alias = (HK.alias[e.L.id] || '').split(' ');
    let s = 0, hit = 0;
    for (const w of q) {
      let v = hHas(e.lt, w) * 7 + hHas(e.ct, w) * 3 + hHas(e.tt, w) + hHas(e.bt, w) * 2;
      if (alias.some(a => a === w || (a.length >= 5 && w.startsWith(a)))) v += 6;
      if (v) { hit++; s += v; }
    }
    if (!hit) continue;
    // вопрос совпал с названием урока целиком: это точно он
    if (e.lt.length && e.lt.every(x => q.includes(x))) s += 4;
    s = s * (hit / q.length) - e.i * 0.01;
    if (!best || s > best.s) best = { L: e.L, i: e.i, c: e.c, s };
  }
  return best && best.s >= 3 ? best : null;
}

// ═════════════ Личные данные Лизы ═════════════
const hSolved = () => Object.values(S.days).reduce((a, d) => a + (d.tasks || 0), 0);
function hCheer() {
  const n = hSolved(), s = calcStreak();
  if (n >= 20) return `Смотри: ты уже решила ${U.fmt(n)} ${U.plural(n, 'задание', 'задания', 'заданий')}!`;
  if (s >= 2) return `Ты занимаешься уже ${s} ${U.plural(s, 'день', 'дня', 'дней')} подряд, это здорово!`;
  return 'У тебя обязательно получится!';
}
function hNext() {
  const st = nextStep(), plan = todayPlan(), left = [];
  if (!plan.lesson) left.push('урок');
  if (chestReady()) left.push('сундучок');
  if (!plan.speed) left.push('тренажёр');
  return {
    html: `Советую вот что ${st.e}<br><b>${st.title}</b><br>${st.sub}<br>${left.length ? `В плане на сегодня осталось: ${left.join(', ')}.` : 'План на сегодня выполнен! Ты умничка 💜'}`,
    acts: [{ t: 'Поехали!', go: st.go }],
  };
}
function hWeak() {
  const list = Object.entries(S.gens).filter(([k, g]) => g.wrong > 0 && LESSON_BY_ID[k.split(':')[0]])
    .sort((a, b) => b[1].wrong / b[1].tries - a[1].wrong / a[1].tries).slice(0, 3);
  if (!list.length) return { html: 'Пока ошибок нет, ты отлично справляешься! Если какое-то задание не получится, я его запомню 🦉', acts: [{ t: 'Чем заняться?', cmd: 'next' }] };
  const acts = reviewKeys().length ? [{ t: 'Работа над ошибками', go: '#review' }] : [];
  acts.push({ t: 'Повторить правило', cmd: 'lesson', id: list[0][0].split(':')[0], i: 0 });
  return { html: `Вот что стоит повторить:<br>${list.map(([, g]) => `• ${g.l}: ${g.n}`).join('<br>')}`, acts };
}
// шутки и факты идут по кругу в случайном порядке
function hNextOf(kind, key) {
  const o = H.order[key] || (H.order[key] = { list: U.shuffle(HK[kind]), i: 0 });
  return o.list[o.i++ % o.list.length];
}
function hRiddle(keep) {
  if (!keep) { H.ri = (H.ri + 1) % HK.riddles.length; if (!H.order.r) H.order.r = U.shuffle(HK.riddles); }
  const r = H.order.r[H.ri];
  return { html: `Загадка 🦉<br>${r[0]}`, acts: [{ t: 'Показать ответ', say: r[1] }, { t: 'Ещё загадку', ask: 'загадай загадку' }] };
}

// ═════════════ Ступеньки подсказки в задании ═════════════
function hAnswers(t) {
  if (t.type === 'num') return [t.answer];
  if (t.type === 'choice') return [t.answer];
  return [t.answer.q, t.answer.r].filter(x => x !== 0);
}
// называет ли текст ответ задания
function hLeaks(html, t) {
  const text = hPlain(html).replace(/(\d)\s(?=\d{3}(\D|$))/g, '$1');
  return hAnswers(t).some(a => {
    const s = String(a);
    if (t.type === 'choice') return s.length > 1 && text.includes(hPlain(s));
    return new RegExp(`(^|[^\\d])${s}([^\\d]|$)`).test(text);
  });
}
function hStrategy(t) {
  if (t.type === 'choice') return 'Прочитай все варианты и сначала отбрось те, что точно не подходят. Выбирать станет намного легче!';
  if (t.type === 'rem') return 'Это деление с остатком. Найди самое большое число, которое делится нацело, а потом посмотри, сколько осталось. Помни: остаток всегда меньше делителя.';
  if (t.type === 'pair') return `В ответе две части: ${t.labels[0]} и ${t.labels[1]}. Считай спокойно и не забудь, сколько маленьких единиц в большой.`;
  if (t.q.includes('class="x"')) return 'Это уравнение. Посмотри, что здесь неизвестно: слагаемое, множитель или что-то ещё. Потом вспомни правило, как это найти.';
  if (t.q.includes('class="word"')) return 'Это задача. Давай по шагам:<br>• Что известно?<br>• Что нужно узнать?<br>• Какое действие поможет?<br>Если сразу не получается, подумай, что можно узнать первым.';
  return 'Посмотри на знаки действий. Если их несколько, реши, что делать первым. Считай спокойно, спешить некуда!';
}
const hTaskItem = () => (P && P.task ? P.items[P.pos] : null);
function hRuleCard(it) {
  const L = LESSON_BY_ID[it.lessonId], hit = hFind(genOf(it).name, it.lessonId);
  return hit ? { L, i: hit.i, c: hit.c } : { L, i: 0, c: L.theory[0] };
}
// такое же задание с другими числами и другим ответом
function hSimilar(g, cur) {
  for (let k = 0; k < 14; k++) {
    const e = g.fn();
    if (!cur || (e.q !== cur.q && JSON.stringify(e.answer) !== JSON.stringify(cur.answer))) return e;
  }
  return null;
}
function hExample(e) {
  return {
    html: `Смотри, как решается похожее задание 👇<div class="h-card">${e.q}<div class="h-ans">Ответ: <b>${ansText(e)}</b></div>${e.explain ? `<div class="explain">${e.explain}</div>` : ''}</div>`,
    demo: e.sol || null,
  };
}
const hCardHTML = (c, title) => `<div class="h-card"><h4>${title || c.title}</h4>${c.html}</div>`;
function hTaskStep(want) {
  const it = hTaskItem();
  if (!it) return { html: 'Сейчас задания нет. Открой любой урок и нажми «🦉 Спросить Луну» прямо в задании!', acts: [{ t: 'Чем заняться?', cmd: 'next' }] };
  const t = P.task;
  if (H.task !== t) { H.task = t; H.step = 0; }
  let s = want || H.step + 1;
  if (s === 2 && hLeaks(t.hint || '', t)) s = 3; // подсказка выдала бы ответ: сразу к правилу
  H.step = Math.max(H.step, s);
  if (s === 1) return { html: `Давай разберёмся вместе 🦉<br>${hStrategy(t)}` };
  if (s === 2) return { html: `Вот подсказка 💡<br>${t.hint}` };
  if (s === 3) {
    const r = hRuleCard(it);
    return { html: `Вспомним правило:${hCardHTML(r.c)}`, demo: r.c.demo || null };
  }
  if (s === 4) {
    const e = hSimilar(genOf(it), t);
    if (!e) return { html: 'Похожего примера сейчас нет. Но ты уже знаешь правило, попробуй ответить! Ошибиться не страшно 💪' };
    return { ...hExample(e), after: 'Теперь реши своё задание так же. У тебя получится!' };
  }
  return { html: 'Больше подсказок нет: дальше думает твоя умная голова 💜 Попробуй ответить! Если ошибёшься, приложение покажет, как решать, и мы разберём это вместе.' };
}

// ═════════════ Ответы ═════════════
const hCalcOp = text => (/[*×·]|умнож/.test(text) ? 'mul1' : /[:/÷]|дели|раздел/.test(text) ? 'div1' : /\+|плюс|прибав|сложи/.test(text) ? 'add1' : /[-−–]|минус|вычест|вычти|отня/.test(text) ? 'sub1' : null);
function hIsCalc(text, n) {
  return /\d\s*[+\-−–*×·:/÷]\s*\d/.test(text) || /\d\s*(умнож|раздел|дели|плюс|минус|прибав|отня|вычест|вычти)/.test(text.toLowerCase()) || hMatch(n, HK.calcWords) > 0;
}
function hUnknown() {
  return {
    html: U.pick(['Хм, этого я пока не знаю 🤔 Я ещё учусь! Попробуй спросить по-другому или выбери кнопку ниже.', 'Угу… такого вопроса в моей книжке нет 🦉 Спроси иначе или выбери кнопку ниже.']),
    log: 'u',
  };
}
function hEntry(e) {
  return { id: e.id, html: typeof e.a === 'function' ? e.a() : e.a, acts: typeof e.acts === 'function' ? e.acts() : e.acts };
}
function hFromCard(hit, intro) {
  const last = hit.i >= hit.L.theory.length - 1;
  return {
    lesson: hit.L.id,
    html: `${intro || 'Вот что говорит урок'} «${hit.L.title}»:${hCardHTML(hit.c)}`,
    demo: hit.c.demo || null,
    acts: [...(last ? [] : [{ t: 'Дальше →', cmd: 'lesson', id: hit.L.id, i: hit.i + 1 }]), { t: 'Открыть урок', go: `#lesson/${hit.L.id}` }],
  };
}
function helperBrain(raw, ctx = {}) {
  const text = String(raw).trim().slice(0, 200), n = hNorm(text), task = ctx.mode === 'task';
  const done = r => { if (task && r.acts) r.acts = r.acts.filter(a => !a.go); return r; }; // из задания никуда не уводим
  if (n.trim() === '') return { html: 'Напиши вопрос словами, а я постараюсь помочь 🦉' };
  if (hMatch(n, HK.safety)) return { html: HK.safetyReply, log: 's' };
  if (hMatch(n, HK.family)) return { html: HK.familyReply, log: 's' };
  if (hIsCalc(text, n)) {
    const les = hCalcOp(text);
    return done({
      html: 'Ответ я не скажу: иначе твой мозг не потренируется 😉 Зато покажу, как решать!',
      acts: task ? [{ t: 'Подскажи', cmd: 'hint' }] : les ? [{ t: 'Покажи правило', cmd: 'lesson', id: les, i: 0 }] : [{ t: 'Объясни тему', cmd: 'topics' }],
    });
  }
  if (task) {
    if (hMatch(n, HK.taskSimilar)) return hTaskStep(4);
    if (hMatch(n, HK.taskRule)) return hTaskStep(3);
    if (hMatch(n, HK.taskAsk)) return hTaskStep();
  }
  // лучший ответ из базы
  let best = null, score = 0;
  for (const e of [...HK.mood, ...HK.app, ...HK.talk]) {
    const s = hMatch(n, e.k);
    if (s > score) { score = s; best = e; }
  }
  const hit = hFind(text);
  // про тему спросили прямо: «как найти площадь комнаты», «не понимаю дроби»
  if (hit && (!best || (best.soft && hit.s >= 4) || (score < 200 && hit.s >= 5))) return done(hFromCard(hit, best && best.soft ? 'Давай разберёмся вместе! Смотри урок' : ''));
  if (best) return done(hEntry(best));
  if (hit) return done(hFromCard(hit));
  return hUnknown(); // сюда потом можно подключить настоящий ИИ
}
function helperCmd(a, ctx = {}) {
  const c = a.cmd;
  if (c === 'hint') return hTaskStep();
  if (c === 'rule') return hTaskStep(3);
  if (c === 'similar') return hTaskStep(4);
  if (c === 'next') return hNext();
  if (c === 'weak') return hWeak();
  if (c === 'topics') return { html: 'Выбери остров 🏝️', acts: TOPICS.map(t => ({ t: `${t.emoji} ${t.title}`, cmd: 'topic', id: t.id })) };
  if (c === 'topic') {
    const t = TOPICS.find(x => x.id === a.id);
    return { html: `${t.emoji} ${t.title}. Какой урок разберём?`, acts: t.lessons.map(l => ({ t: `${l.emoji} ${l.title}`, cmd: 'lesson', id: l.id, i: 0 })) };
  }
  if (c === 'lesson') {
    const L = LESSON_BY_ID[a.id], r = hFromCard({ L, i: a.i, c: L.theory[a.i] }, 'Урок');
    if (ctx.mode === 'task') r.acts = r.acts.filter(x => !x.go);
    return r;
  }
  if (c === 'example') {
    const L = LESSON_BY_ID[ctx.lesson], g = U.pick(L.gens[1]), e = g.fn();
    return { ...hExample(e), acts: [{ t: 'Ещё пример', cmd: 'example' }] };
  }
  return hUnknown();
}

// ═════════════ Окно разговора ═════════════
const hChips = ctx => (ctx.mode === 'task'
  ? [{ t: 'Ещё подсказку', cmd: 'hint' }, { t: 'Покажи правило', cmd: 'rule' }, { t: 'Похожий пример', cmd: 'similar' }, { t: 'Мне трудно', ask: 'мне трудно' }]
  : ctx.mode === 'theory'
    ? [{ t: 'Покажи пример', cmd: 'example' }, { t: 'Мне трудно', ask: 'мне трудно' }, { t: 'Что ты умеешь?', ask: 'что ты умеешь' }]
    : [{ t: 'Чем заняться?', cmd: 'next' }, { t: 'Как заработать звёзды?', ask: 'как заработать звёзды' }, { t: 'Объясни тему', cmd: 'topics' }, { t: 'Мои ошибки', cmd: 'weak' },
      { t: 'Мне трудно', ask: 'мне трудно' }, { t: 'Загадай загадку', ask: 'загадай загадку' }, { t: 'Пошути', ask: 'пошути' }, { t: 'Что ты умеешь?', ask: 'что ты умеешь' }]);

function hBubble(m) {
  const log = H.wrap.querySelector('.h-log'), d = document.createElement('div');
  d.className = 'h-m ' + (m.me ? 'me' : 'she');
  d.innerHTML = `<div class="h-b">${m.html}</div>`;
  if (m.demo) d.firstChild.appendChild(Column.viewer(Column.model(m.demo)));
  if (m.after) { const p = document.createElement('p'); p.className = 'h-after'; p.textContent = m.after; d.firstChild.appendChild(p); }
  if (m.acts && m.acts.length) {
    const row = document.createElement('div');
    row.className = 'h-acts';
    m.acts.forEach(a => {
      const b = document.createElement('button');
      b.className = 'h-act'; b.textContent = a.t; b.type = 'button';
      b.addEventListener('click', () => hAct(a));
      row.appendChild(b);
    });
    d.appendChild(row);
  }
  log.appendChild(d);
  // длинный ответ показываем с начала, короткий — просто прокручиваем вниз
  log.scrollTop = d.offsetHeight > log.clientHeight * 0.7 ? d.offsetTop - 8 : log.scrollHeight;
}
function hThink(fn) {
  const wrap = H.wrap, turn = ++H.turn;
  if (!wrap) return;
  const log = wrap.querySelector('.h-log'), d = document.createElement('div');
  d.className = 'h-m she h-typing';
  d.innerHTML = '<div class="h-b"><i></i><i></i><i></i></div>';
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
  wrap.classList.add('think');
  setTimeout(() => {
    d.remove();
    if (H.wrap !== wrap) return;
    if (turn === H.turn) wrap.classList.remove('think');
    const r = fn();
    if (r.log) hRemember(r.log);
    hBubble(r);
    H.q = null;
  }, 420 + Math.random() * 320);
}
function hRemember(kind) {
  if (!H.q) return;
  S.helper.log = [{ t: Date.now(), q: H.q, k: kind }, ...S.helper.log].slice(0, 30);
  save();
}
function hAsk(text, label) {
  const q = String(text).trim();
  if (!q) return;
  hBubble({ me: true, html: U.esc((label || q).slice(0, 200)) });
  S.helper.n = (S.helper.n || 0) + 1;
  H.q = label ? null : q.slice(0, 120); // в список для брата попадает только то, что Лиза написала сама
  hThink(() => helperBrain(q, H.ctx));
}
function hAct(a) {
  if (a.go) { closeHelper(); go(a.go); return; }
  if (a.say) { hThink(() => ({ html: a.say })); return; }
  if (a.ask) { hAsk(a.ask, a.t); return; }
  hBubble({ me: true, html: U.esc(a.t) });
  hThink(() => helperCmd(a, H.ctx));
}
function hFit() {
  const v = window.visualViewport;
  if (!v || !H.wrap) return;
  // экранная клавиатура iPhone уменьшает видимую часть: окно подстраивается под неё
  H.wrap.style.height = v.height + 'px';
  H.wrap.style.top = v.offsetTop + 'px';
  const log = H.wrap.querySelector('.h-log');
  log.scrollTop = log.scrollHeight;
}
function openHelper(mode, data = {}) {
  if (H.wrap) return;
  H.ctx = { mode, lesson: data.l, card: Number(data.c) || 0 };
  const o = document.createElement('div');
  o.className = 'h-wrap';
  o.innerHTML = `<div class="h-dim"></div><section class="h-sheet" role="dialog" aria-label="Совушка ${HELPER.name}">
    <header class="h-top"><img class="h-face" src="${HELPER.img}" alt=""><div class="h-who"><b>${HELPER.name}</b><small>${HELPER.who}</small></div><button class="icon-btn" type="button" aria-label="Закрыть">✕</button></header>
    <div class="h-log"></div>
    <div class="h-chips"></div>
    <form class="h-form"><input class="h-in" type="text" maxlength="200" placeholder="Напиши вопрос…" autocomplete="off" enterkeyhint="send" aria-label="Вопрос"><button class="h-go" type="submit" aria-label="Отправить">➤</button></form>
  </section>`;
  document.body.appendChild(o);
  H.wrap = o;
  document.documentElement.classList.add('h-lock');
  o.querySelector('.h-dim').addEventListener('click', closeHelper);
  o.querySelector('.icon-btn').addEventListener('click', closeHelper);
  const input = o.querySelector('.h-in');
  o.querySelector('.h-form').addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; hAsk(v); });
  const chips = o.querySelector('.h-chips');
  hChips(H.ctx).forEach(a => {
    const b = document.createElement('button');
    b.className = 'h-chip'; b.type = 'button'; b.textContent = a.t;
    b.addEventListener('click', () => hAct(a));
    chips.appendChild(b);
  });
  if (window.visualViewport) { window.visualViewport.addEventListener('resize', hFit); window.visualViewport.addEventListener('scroll', hFit); }
  // первое сообщение
  const first = !S.helper.seen;
  if (first) {
    S.helper.seen = true; save();
    document.querySelectorAll('.tab-b[data-helper] i').forEach(x => x.remove());
  }
  if (mode === 'task') {
    hBubble(hTaskStep(H.task === P.task && H.step ? Math.min(H.step + 1, 5) : 1));
  } else if (mode === 'theory') {
    const c = LESSON_BY_ID[H.ctx.lesson].theory[H.ctx.card];
    hBubble({ html: `Что непонятно в карточке «${c.title}»? Спроси своими словами или посмотри пример 🦉` });
  } else {
    hBubble({ html: first
      ? `Привет, Лизок! Я совушка ${HELPER.name} 🦉 Я подскажу в заданиях, объясню темы, расскажу про приложение и поддержу, если трудно. Спрашивай что хочешь или нажми кнопку внизу!`
      : U.pick(['Привет, Лизок! О чём поговорим?', 'Угу-угу! Что тебя интересует?', 'Я тут! Спрашивай 🦉']) });
  }
}
function closeHelper() {
  const o = H.wrap;
  if (!o) return;
  H.wrap = null;
  document.documentElement.classList.remove('h-lock');
  if (window.visualViewport) { window.visualViewport.removeEventListener('resize', hFit); window.visualViewport.removeEventListener('scroll', hFit); }
  o.classList.add('out');
  setTimeout(() => o.remove(), 240);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-helper]');
  if (b) openHelper(b.dataset.helper, b.dataset);
});

// ═════════════ Режим «Для брата» ═════════════
function helperAdmin() {
  const h = S.helper, log = h.log.slice(0, 15), d = t => { const x = new Date(t); return `${x.getDate()}.${String(x.getMonth() + 1).padStart(2, '0')}`; };
  return `<div class="card"><h3>🦉 Совушка ${HELPER.name}</h3>
    <p class="muted">Лиза задала вопросов: ${h.n || 0}. Здесь только то, на что ${HELPER.name} не нашла ответ, и сообщения, где Лизе может быть нужна поддержка (⚠️). Всё хранится на этом телефоне.</p>
    ${log.length ? log.map(x => `<div class="mist"><small class="muted">${d(x.t)}</small> ${x.k === 's' ? '⚠️ ' : ''}${U.esc(x.q)}</div>`).join('') + '<button class="btn ghost wide" data-act="helper-clear">Очистить список</button>' : '<p class="muted">Пока таких сообщений нет.</p>'}</div>`;
}
function helperAction(a) {
  if (a !== 'helper-clear') return false;
  S.helper.log = [];
  save();
  return true;
}

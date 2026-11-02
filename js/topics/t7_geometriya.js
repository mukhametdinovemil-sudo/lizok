// Тема «Геометрия»: углы, треугольники, периметр, ломаная, симметрия (учебник, стр. 109–110 и по всей книге)
// Помощники T, tidy, ex, word, BOX, X берутся из t5_umnozh_delenie.js. Картинки рисуются как SVG.

const PINK = '#ff5fa2', INK = '#2b3a8c';
function angleSVG(deg, small) {
  const cx = 110, cy = 128, L = 100, r = deg * Math.PI / 180, ar = 24;
  const x2 = cx + L * Math.cos(r), y2 = cy - L * Math.sin(r), ax = cx + ar * Math.cos(r), ay = cy - ar * Math.sin(r);
  return `<svg class="fig${small ? ' sm' : ''}" viewBox="0 0 220 140" aria-hidden="true">
    <path d="M${cx + ar} ${cy} A${ar} ${ar} 0 0 0 ${ax.toFixed(1)} ${ay.toFixed(1)}" fill="none" stroke="${PINK}" stroke-width="4"/>
    <line x1="${cx}" y1="${cy}" x2="212" y2="${cy}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="4" fill="${INK}"/></svg>`;
}
function angleKind(deg) { return deg === 90 ? 'Прямой' : deg < 90 ? 'Острый' : 'Тупой'; }
function triAngles(P) {
  const ang = (a, b, c) => { const v1 = [b[0] - a[0], b[1] - a[1]], v2 = [c[0] - a[0], c[1] - a[1]]; return Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2))) * 180 / Math.PI; };
  return [ang(P[0], P[1], P[2]), ang(P[1], P[2], P[0]), ang(P[2], P[0], P[1])];
}
function makeTriangle(kind) {
  for (let tries = 0; tries < 200; tries++) {
    let P;
    if (kind === 'right') {
      const w = U.rnd(90, 170), h = U.rnd(60, 110), left = Math.random() < 0.5;
      P = left ? [[25, 130], [25 + w, 130], [25, 130 - h]] : [[25, 130], [25 + w, 130], [25 + w, 130 - h]];
    } else if (kind === 'obtuse') {
      const w = U.rnd(80, 120), h = U.rnd(65, 105), x = 25 + w + U.rnd(20, 45);
      P = Math.random() < 0.5 ? [[25, 130], [25 + w, 130], [x, 130 - h]] : [[195, 130], [195 - w, 130], [195 - (x - 25), 130 - h]];
    } else {
      const w = U.rnd(110, 170), h = U.rnd(80, 115), x = 25 + U.rnd(Math.round(w * 0.3), Math.round(w * 0.7));
      P = [[25, 130], [25 + w, 130], [x, 130 - h]];
    }
    const m = Math.max(...triAngles(P));
    if (P.some(p => p[0] < 5 || p[0] > 215 || p[1] < 5)) continue;
    if (kind === 'right' && Math.abs(m - 90) < 0.5) return P;
    if (kind === 'obtuse' && m > 100) return P;
    if (kind === 'acute' && m < 80) return P;
  }
  return [[25, 130], [195, 130], [110, 25]];
}
function triSVG(P) {
  return `<svg class="fig" viewBox="0 0 220 140" aria-hidden="true"><polygon points="${P.map(p => p.join(',')).join(' ')}" fill="#ffe3ef" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg>`;
}
function fanSVG(k) {
  const ax = 110, ay = 14, y = 128, x0 = 14, x1 = 206;
  let s = `<svg class="fig" viewBox="0 0 220 140" aria-hidden="true"><polygon points="${ax},${ay} ${x0},${y} ${x1},${y}" fill="#fff0f6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  for (let i = 1; i < k; i++) { const x = x0 + (x1 - x0) * i / k; s += `<line x1="${ax}" y1="${ay}" x2="${x.toFixed(1)}" y2="${y}" stroke="${INK}" stroke-width="3"/>`; }
  return s + '</svg>';
}
function polySVG(lens, u) {
  const n = lens.length, pts = [];
  for (let i = 0; i <= n; i++) pts.push([14 + 192 * i / n, i % 2 ? U.rnd(24, 50) : U.rnd(100, 124)]);
  let s = `<svg class="fig" viewBox="0 0 220 140" aria-hidden="true"><polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  pts.forEach(p => { s += `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${PINK}"/>`; });
  lens.forEach((l, i) => {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    // подпись — на середине звена, на белой подложке
    s += `<rect x="${(mx - 19).toFixed(0)}" y="${(my - 11).toFixed(0)}" width="38" height="21" rx="8" fill="#fff" stroke="#ffc2dc" stroke-width="1.5"/>`;
    s += `<text x="${mx.toFixed(0)}" y="${(my + 5).toFixed(0)}" text-anchor="middle" font-size="15" font-weight="800" fill="${PINK}">${l} ${u}</text>`;
  });
  return s + '</svg>';
}
const TRI_BY_ANGLE = { right: 'Прямоугольный', obtuse: 'Тупоугольный', acute: 'Остроугольный' };

const LESSONS_T7 = [
  {
    id: 'geo1', title: 'Углы и треугольники', emoji: '📐',
    theory: [
      {
        title: 'Три вида углов',
        html: `<div class="fig-row">${angleSVG(50, 1)}${angleSVG(90, 1)}${angleSVG(130, 1)}</div>
          <div class="rule"><b>Прямой</b> — как уголок тетрадного листа.<br><b>Острый</b> — меньше прямого.<br><b>Тупой</b> — больше прямого.</div>
          <p>Проверить можно угольником или уголком листа бумаги.</p>`,
      },
      {
        title: 'Треугольники по углам',
        html: `<div class="rule"><b>Прямоугольный</b> — есть прямой угол.<br><b>Тупоугольный</b> — есть тупой угол.<br><b>Остроугольный</b> — все три угла острые.</div>
          <p>Прямой или тупой угол у треугольника может быть только один.</p>`,
      },
      {
        title: 'Треугольники по сторонам',
        html: `<div class="rule"><b>Равносторонний</b> — все три стороны равны.<br><b>Равнобедренный</b> — две стороны равны.<br><b>Разносторонний</b> — все стороны разные.</div>
          <div class="ex">5 см, 5 см, 5 см — равносторонний<br>5 см, 5 см, 8 см — равнобедренный<br>4 см, 6 см, 7 см — разносторонний</div>`,
      },
      {
        title: 'Прямоугольник и квадрат',
        html: `<p>У <b>прямоугольника</b> все углы прямые, а противоположные стороны равны.</p>
          <p><b>Квадрат</b> — это прямоугольник, у которого все стороны равны.</p>
          <div class="rule">Каждый квадрат — прямоугольник. Но не каждый прямоугольник — квадрат!</div>`,
      },
    ],
    plan: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3],
    gens: {
      1: [
        {
          name: 'Какой это угол', fn: () => {
            const k = U.rnd(0, 2), deg = [U.rnd(20, 72), 90, U.rnd(108, 158)][k], ans = angleKind(deg);
            return T.choice(angleSVG(deg) + '<p class="sub">Какой это угол?</p>', ans, ['Острый', 'Прямой', 'Тупой'], {
              hint: 'Сравни с уголком тетрадного листа.', explain: `Это ${ans.toLowerCase()} угол: он ${deg === 90 ? 'как уголок листа' : deg < 90 ? 'меньше прямого' : 'больше прямого'}.`,
              meta: { choiceRight: ans },
            });
          },
        },
        {
          name: 'Треугольник по сторонам', fn: () => {
            const k = U.rnd(0, 2), a = U.rnd(3, 9);
            let s, ans;
            if (k === 0) { s = [a, a, a]; ans = 'Равносторонний'; }
            else if (k === 1) { let b; do { b = U.rnd(2, 2 * a - 1); } while (b === a); s = U.shuffle([a, a, b]); ans = 'Равнобедренный'; }
            else { let b, c; do { b = U.rnd(3, 12); c = U.rnd(3, 12); } while (new Set([a, b, c]).size < 3 || a + b <= c || a + c <= b || b + c <= a); s = [a, b, c]; ans = 'Разносторонний'; }
            return T.choice(word(`Стороны треугольника: <b>${s.join(' см, ')} см</b>. Какой это треугольник?`), ans, ['Равносторонний', 'Равнобедренный', 'Разносторонний'], {
              hint: 'Сколько сторон равны между собой?', explain: `${ans} — ${k === 0 ? 'все стороны равны' : k === 1 ? 'две стороны равны' : 'все стороны разные'}.`,
              meta: { choiceRight: ans },
            });
          },
        },
      ],
      2: [
        {
          name: 'Треугольник по углам (рисунок)', fn: () => {
            const kind = U.pick(['right', 'obtuse', 'acute']), ans = TRI_BY_ANGLE[kind];
            return T.choice(triSVG(makeTriangle(kind)) + '<p class="sub">Какой это треугольник?</p>', ans, Object.values(TRI_BY_ANGLE), {
              hint: 'Найди самый большой угол. Он прямой, тупой или острый?',
              explain: `${ans}: ${kind === 'right' ? 'один угол прямой' : kind === 'obtuse' ? 'один угол тупой' : 'все углы острые'}.`, meta: { choiceRight: ans },
            });
          },
        },
        {
          name: 'Периметр треугольника', fn: () => {
            const a = U.rnd(3, 15), b = U.rnd(3, 15), c = U.rnd(Math.abs(a - b) + 1, a + b - 1);
            return T.num(word(`Стороны треугольника ${a} см, ${b} см и ${c} см. Найди его периметр.`), a + b + c, {
              unit: 'см', hint: 'Периметр — сумма длин всех сторон.', explain: `${a} + ${b} + ${c} = ${a + b + c} см.`, meta: { expr: `${a}+${b}+${c}` },
            });
          },
        },
        {
          name: 'Сторона равностороннего', fn: () => {
            const a = U.rnd(3, 30);
            return T.num(word(`Периметр равностороннего треугольника ${3 * a} см. Найди длину его стороны.`), a, {
              unit: 'см', hint: 'У равностороннего треугольника три равные стороны.', explain: `${3 * a} : 3 = ${a} см.`, meta: { expr: `${3 * a}/3` },
            });
          },
        },
      ],
      3: [
        {
          name: 'Сколько треугольников', fn: () => {
            const k = U.rnd(2, 4), n = k * (k + 1) / 2;
            return T.num(fanSVG(k) + '<p class="sub">Сколько всего треугольников на рисунке? Считай и большие!</p>', n, {
              hint: 'Считай маленькие, потом сложенные из двух, из трёх…',
              explain: `Маленьких — ${k}${k >= 2 ? `, из двух соседних — ${k - 1}` : ''}${k >= 3 ? `, из трёх — ${k - 2}` : ''}${k >= 4 ? ', из четырёх — 1' : ''}. Всего ${n}.`,
              meta: { expr: `${k}*(${k}+1)/2` },
            });
          },
        },
        {
          name: 'Боковая сторона равнобедренного', fn: () => {
            const s = U.rnd(4, 20), b = U.rnd(2, 2 * s - 1);
            return T.num(word(`Периметр равнобедренного треугольника ${2 * s + b} см, основание ${b} см. Найди длину боковой стороны.`), s, {
              unit: 'см', hint: 'Отними основание — останутся две равные боковые стороны.', explain: `${2 * s + b} − ${b} = ${2 * s}; ${2 * s} : 2 = ${s} см.`, meta: { expr: `(${2 * s + b}-${b})/2` },
            });
          },
        },
        {
          name: 'Сколько прямых углов', fn: () => {
            const v = U.pick([['прямоугольника', 4], ['квадрата', 4], ['прямоугольного треугольника', 1], ['тупоугольного треугольника', 0], ['двух квадратов вместе', 8]]);
            return T.num(word(`Сколько прямых углов у ${v[0]}?`), v[1], {
              hint: 'Представь фигуру и посчитай углы, похожие на уголок листа.', explain: `У ${v[0]} ${v[1]} ${U.plural(v[1], 'прямой угол', 'прямых угла', 'прямых углов')}.`, meta: { expr: `${v[1]}` },
            });
          },
        },
      ],
    },
  },
  {
    id: 'geo2', title: 'Периметр и симметрия', emoji: '🔷',
    theory: [
      {
        title: 'Длина ломаной',
        html: `<p>Ломаная состоит из звеньев. Её длина — <b>сумма длин всех звеньев</b>.</p>
          <div class="ex">Звенья 2 см, 3 см и 1 см: 2 + 3 + 1 = 6 см</div>`,
      },
      {
        title: 'Периметр многоугольника',
        html: `<div class="rule">Периметр — сумма длин всех сторон.</div>
          <div class="ex">Прямоугольник 4 см и 2 см: P = (4 + 2) · 2 = 12 см<br>Квадрат со стороной 3 см: P = 3 · 4 = 12 см</div>`,
      },
      {
        title: 'Обратные задачи',
        html: `<div class="ex">Периметр квадрата 20 см → сторона 20 : 4 = 5 см</div>
          <div class="ex">Периметр прямоугольника 18 см, одна сторона 5 см:<br>18 : 2 = 9 — это длина + ширина<br>9 − 5 = <b>4 см</b></div>`,
      },
      {
        title: 'Ось симметрии',
        html: `<p>Если фигуру можно сложить по линии так, что половинки совпадут, эта линия — <b>ось симметрии</b>.</p>
          <div class="ex">Квадрат — 4 оси<br>Прямоугольник — 2 оси<br>Равносторонний треугольник — 3 оси<br>Круг — бесконечно много!</div>`,
      },
    ],
    plan: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3],
    gens: {
      1: [
        {
          name: 'Длина ломаной', fn: () => {
            const n = U.rnd(3, 5), lens = Array.from({ length: n }, () => U.rnd(2, 9)), u = U.pick(['см', 'дм', 'мм']), sum = lens.reduce((a, b) => a + b, 0);
            return T.num(polySVG(lens, u) + '<p class="sub">Найди длину ломаной.</p>', sum, {
              unit: u, hint: 'Сложи длины всех звеньев.', explain: `${lens.join(' + ')} = ${sum} ${u}.`, meta: { expr: lens.join('+') },
            });
          },
        },
        {
          name: 'Периметр квадрата', fn: () => {
            const a = U.rnd(3, 25);
            return T.num(word(`Сторона квадрата ${a} см. Найди его периметр.`), a * 4, { unit: 'см', hint: 'У квадрата 4 равные стороны.', explain: `${a} · 4 = ${a * 4} см.`, meta: { expr: `${a}*4` } });
          },
        },
      ],
      2: [
        {
          name: 'Периметр многоугольника', fn: () => {
            const n = U.rnd(4, 6), s = Array.from({ length: n }, () => U.rnd(2, 15)), sum = s.reduce((a, b) => a + b, 0);
            const name = { 4: 'четырёхугольника', 5: 'пятиугольника', 6: 'шестиугольника' }[n];
            return T.num(word(`Стороны ${name}: ${s.join(' см, ')} см. Найди периметр.`), sum, { unit: 'см', hint: 'Сложи все стороны.', explain: `${s.join(' + ')} = ${sum} см.`, meta: { expr: s.join('+') } });
          },
        },
        {
          name: 'Сторона квадрата по периметру', fn: () => {
            const a = U.rnd(3, 30);
            return T.num(word(`Из проволоки длиной ${4 * a} см согнули квадрат. Какой длины его сторона?`), a, { unit: 'см', hint: 'Вся проволока — это периметр квадрата.', explain: `${4 * a} : 4 = ${a} см.`, meta: { expr: `${4 * a}/4` } });
          },
        },
        {
          name: 'Сколько осей симметрии', fn: () => {
            const v = U.pick([['у квадрата', '4'], ['у прямоугольника (не квадрата)', '2'], ['у равностороннего треугольника', '3'], ['у равнобедренного треугольника', '1'], ['у разностороннего треугольника', '0'], ['у круга', 'бесконечно много']]);
            return T.choice(word(`Сколько осей симметрии ${v[0]}?`), v[1], ['0', '1', '2', '3', '4', 'бесконечно много'], {
              hint: 'Мысленно сложи фигуру пополам разными способами.', explain: `${v[0][0].toUpperCase() + v[0].slice(1)} — ${v[1]}.`, meta: { choiceRight: v[1] },
            });
          },
        },
      ],
      3: [
        {
          name: 'Вторая сторона по периметру', fn: () => {
            const a = U.rnd(3, 20), b = U.rnd(2, 20);
            return T.num(word(`Периметр прямоугольника ${2 * (a + b)} см, одна сторона ${a} см. Найди другую сторону.`), b, {
              unit: 'см', hint: 'Раздели периметр на 2 — получишь сумму длины и ширины.', explain: `${2 * (a + b)} : 2 = ${a + b}; ${a + b} − ${a} = ${b} см.`, meta: { expr: `${2 * (a + b)}/2-${a}` },
            });
          },
        },
        {
          name: 'Квадрат с тем же периметром', fn: () => {
            let a, b; do { a = U.rnd(2, 14); b = U.rnd(2, 14); } while (a === b || (a + b) % 2);
            return T.num(word(`Прямоугольник ${a} см × ${b} см. Какой должна быть сторона квадрата, чтобы его периметр был таким же?`), (a + b) / 2, {
              unit: 'см', hint: 'Найди периметр прямоугольника и раздели на 4.', explain: `P = (${a} + ${b}) · 2 = ${2 * (a + b)} см. ${2 * (a + b)} : 4 = ${(a + b) / 2} см.`, meta: { expr: `(${a}+${b})*2/4` },
            });
          },
        },
        {
          name: 'Чья площадь больше', fn: () => {
            let a, b; do { a = U.rnd(2, 14); b = U.rnd(2, 14); } while (a === b || (a + b) % 2);
            const s = (a + b) / 2;
            return T.choice(word(`У прямоугольника ${a} см × ${b} см и у квадрата со стороной ${s} см периметры одинаковые. У кого площадь больше?`), 'У квадрата', ['У квадрата', 'У прямоугольника', 'Одинаковые'], {
              hint: 'Посчитай обе площади.', explain: `Прямоугольник: ${a} · ${b} = ${a * b} см². Квадрат: ${s} · ${s} = ${s * s} см². У квадрата больше!`,
              meta: { choiceExpr: `(${s * s}>${a * b})?'У квадрата':(${s * s}<${a * b})?'У прямоугольника':'Одинаковые'` },
            });
          },
        },
      ],
    },
  },
];

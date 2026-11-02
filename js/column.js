// Умножение и деление столбиком: пошаговая запись «как в тетради»
// Модель = { items: [{r, c, ch?, s, until?, cls?}], steps: [текст шага], rows, cols }
// Элемент виден на шагах s..until; ch не задан — значит, элемент только добавляет оформление.
const Column = {
  mul(a, b) {
    const ad = String(a).split('').map(Number), n = ad.length;
    const P = a * b, resLen = String(P).length;
    const W = Math.max(n, resLen) + 1;
    const col = r => W - 1 - r;
    const items = [];
    // строки: 0 — то, что запоминаем; 1 — первый множитель; 2 — второй; 3 — ответ
    ad.forEach((dg, k) => items.push({ r: 1, c: W - n + k, ch: dg, s: 0 }));
    items.push({ r: 2, c: 0, ch: '×', s: 0, cls: 'sign' });
    items.push({ r: 2, c: W - 1, ch: b, s: 0 });
    for (let c = 1; c < W; c++) items.push({ r: 2, c, s: 0, cls: 'ul' });
    const steps = ['Пишу множители столбиком: однозначное число — под единицами. Умножать начинаю справа, с единиц.'];
    let carry = 0;
    for (let r = 0; r < n; r++) {
      const dg = ad[n - 1 - r], m = dg * b, p = m + carry, s = r + 1;
      let t = `Умножаю ${U.RANK_ACC[r]}: ${dg} · ${b} = ${m}.`;
      if (carry) t += ` Прибавляю ${carry}, которые запомнила: ${m} + ${carry} = ${p}.`;
      items.push({ r: 1, c: col(r), s, until: s, cls: 'hl' });
      if (r === n - 1) {
        String(p).split('').reverse().forEach((ch, k) => items.push({ r: 3, c: col(r + k), ch, s }));
        t += ` Это последний разряд — пишу ${p} целиком.`;
        carry = 0;
      } else {
        const w = p % 10, nc = Math.floor(p / 10);
        items.push({ r: 3, c: col(r), ch: w, s });
        if (nc) {
          items.push({ r: 0, c: col(r + 1), ch: nc, s, cls: 'carry' });
          t += ` ${p} ${U.RANK_SHORT[r]} — это ${nc} ${U.RANK_SHORT[r + 1]} и ${w} ${U.RANK_SHORT[r]}. Пишу ${w}, а ${nc} запоминаю.`;
        } else {
          t += ` Пишу ${w}.`;
        }
        carry = nc;
      }
      items.push({ r: 3, c: col(r), s, until: s, cls: 'hl' });
      steps.push(t);
    }
    steps.push(`Готово! ${U.fmt(a)} · ${b} = ${U.fmt(P)}.`);
    return { items, steps: steps.map(U.dots), rows: 4, cols: W, answer: P };
  },

  // Сложение столбиком: строки 0 — запомненное, 1 — первое слагаемое, 2 — второе, 3 — сумма
  add(a, b) {
    const S = a + b, as = String(a), bs = String(b), ss = String(S);
    const W = Math.max(as.length, bs.length, ss.length) + 1, col = r => W - 1 - r;
    const items = [];
    as.split('').forEach((ch, k) => items.push({ r: 1, c: W - as.length + k, ch, s: 0 }));
    bs.split('').forEach((ch, k) => items.push({ r: 2, c: W - bs.length + k, ch, s: 0 }));
    items.push({ r: 2, c: 0, ch: '+', s: 0, cls: 'sign' });
    for (let c = 1; c < W; c++) items.push({ r: 2, c, s: 0, cls: 'ul' });
    const steps = ['Пишу числа столбиком: единицы под единицами, десятки под десятками. Складываю справа налево.'];
    const n = Math.max(as.length, bs.length);
    let carry = 0;
    for (let r = 0; r < n; r++) {
      const x = Math.floor(a / 10 ** r) % 10, y = Math.floor(b / 10 ** r) % 10, p = x + y + carry, s = r + 1;
      let t = `Складываю ${U.RANK_ACC[r]}: ${x} + ${y}${carry ? ` и ещё ${carry}, который запомнила` : ''} = ${p}.`;
      [1, 2].forEach(row => items.push({ r: row, c: col(r), s, until: s, cls: 'hl' }));
      if (r === n - 1) {
        String(p).split('').reverse().forEach((ch, k) => items.push({ r: 3, c: col(r + k), ch, s }));
        t += p >= 10 ? ` Это последний разряд — пишу ${p} целиком.` : ` Пишу ${p}.`;
      } else {
        items.push({ r: 3, c: col(r), ch: p % 10, s });
        if (p >= 10) {
          items.push({ r: 0, c: col(r + 1), ch: 1, s, cls: 'carry' });
          t += ` Пишу ${p % 10}, а 1 запоминаю (ставлю над следующим разрядом).`;
        } else t += ` Пишу ${p}.`;
      }
      carry = p >= 10 && r < n - 1 ? 1 : 0;
      steps.push(t);
    }
    steps.push(`Готово! ${U.fmt(a)} + ${U.fmt(b)} = ${U.fmt(S)}.`);
    return { items, steps: steps.map(U.dots), rows: 4, cols: W, answer: S };
  },

  // Вычитание столбиком: строка 0 — что стало с цифрой после «занимаю»
  sub(a, b) {
    const R = a - b, as = String(a), bs = String(b), n = as.length, W = n + 1, col = r => W - 1 - r;
    const items = [];
    as.split('').forEach((ch, k) => items.push({ r: 1, c: 1 + k, ch, s: 0 }));
    bs.split('').forEach((ch, k) => items.push({ r: 2, c: W - bs.length + k, ch, s: 0 }));
    items.push({ r: 2, c: 0, ch: '−', s: 0, cls: 'sign' });
    for (let c = 1; c < W; c++) items.push({ r: 2, c, s: 0, cls: 'ul' });
    const steps = ['Пишу числа столбиком: разряд под разрядом. Вычитаю справа налево.'];
    const cur = as.split('').reverse().map(Number), resLen = String(R).length;
    for (let r = 0; r < n; r++) {
      const y = Math.floor(b / 10 ** r) % 10, s = r + 1;
      let x = cur[r], t = '';
      items.push({ r: 1, c: col(r), s, until: s, cls: 'hl' });
      if (r < bs.length) items.push({ r: 2, c: col(r), s, until: s, cls: 'hl' });
      if (x < y) {
        let j = r + 1;
        while (cur[j] === 0) j++;
        t = `${U.RANK_ACC[r][0].toUpperCase() + U.RANK_ACC[r].slice(1)}: из ${x} нельзя вычесть ${y}. `;
        if (j === r + 1) t += `Занимаю 1 у соседнего разряда — там было ${cur[j]}, стало ${cur[j] - 1}. `;
        else t += `В соседних разрядах нули, поэтому занимаю у ${cur[j]} (стало ${cur[j] - 1}), а нули по дороге превращаются в 9. `;
        cur[j]--;
        items.push({ r: 0, c: col(j), ch: cur[j], s, cls: 'carry' });
        for (let k = r + 1; k < j; k++) { cur[k] = 9; items.push({ r: 0, c: col(k), ch: 9, s, cls: 'carry' }); }
        x += 10;
        t += `Теперь ${x} − ${y} = ${x - y}.`;
      } else {
        t = `Вычитаю ${U.RANK_ACC[r]}: ${x} − ${y} = ${x - y}.`;
      }
      if (r < resLen) items.push({ r: 3, c: col(r), ch: x - y, s });
      else t += ' Нуль в начале числа не пишем.';
      cur[r] = x;
      steps.push(t);
    }
    steps.push(`Готово! ${U.fmt(a)} − ${U.fmt(b)} = ${U.fmt(R)}. Проверка сложением: ${U.fmt(R)} + ${U.fmt(b)} = ${U.fmt(a)}.`);
    return { items, steps: steps.map(U.dots), rows: 4, cols: W, answer: R };
  },

  // Умножение на двузначное (или трёхзначное) число: неполные произведения со сдвигом, потом сумма
  mul2(a, b) {
    const P = a * b, as = String(a), bs = String(b), m = bs.length;
    const parts = bs.split('').reverse().map(Number).map(d => a * d);
    const W = Math.max(String(P).length, as.length, bs.length) + 1;
    const items = [], put = (r, end, str, s, cls) => String(str).split('').reverse().forEach((ch, k) => items.push({ r, c: end - k, ch, s, cls }));
    put(0, W - 1, as, 0);
    put(1, W - 1, bs, 0);
    items.push({ r: 1, c: 0, ch: '×', s: 0, cls: 'sign' });
    for (let c = 1; c < W; c++) items.push({ r: 1, c, s: 0, cls: 'ul' });
    const steps = ['Пишу множители столбиком, разряд под разрядом. Умножать буду на каждую цифру второго множителя по очереди.'];
    const names = ['единицы', 'десятки', 'сотни'];
    parts.forEach((p, i) => {
      const s = i + 1, d = Number(bs[m - 1 - i]);
      items.push({ r: 1, c: W - 1 - i, s, until: s, cls: 'hl' });
      put(2 + i, W - 1 - i, p, s);
      steps.push(i === 0
        ? `Умножаю ${U.fmt(a)} на единицы: ${U.fmt(a)} · ${d} = ${U.fmt(p)}. Пишу под чертой.`
        : `Умножаю ${U.fmt(a)} на ${names[i]}: ${U.fmt(a)} · ${d} = ${U.fmt(p)}. Это ${names[i]}, поэтому пишу со сдвигом на ${i} ${U.plural(i, 'клетку', 'клетки', 'клеток')} влево — последняя цифра под ${['единицами', 'десятками', 'сотнями'][i]}.`);
    });
    const last = 2 + m - 1, sum = m + 1;
    items.push({ r: 2 + 1, c: 0, ch: '+', s: sum, cls: 'sign' });
    for (let c = 1; c < W; c++) items.push({ r: last, c, s: sum, cls: 'ul' });
    put(last + 1, W - 1, P, sum);
    steps.push(`Складываю неполные произведения: ${parts.map((p, i) => U.fmt(p * 10 ** i)).join(' + ')} = ${U.fmt(P)}.`);
    steps.push(`Готово! ${U.fmt(a)} · ${U.fmt(b)} = ${U.fmt(P)}.`);
    return { items, steps: steps.map(U.dots), rows: last + 2, cols: W, answer: P };
  },

  // общий выбор модели по описанию { kind, ... }
  model(sol) {
    if (sol.kind === 'mul2') return Column.mul2(sol.a, sol.b);
    if (sol.kind === 'mul') return Column.mul(sol.a, sol.b);
    if (sol.kind === 'add') return Column.add(sol.a, sol.b);
    if (sol.kind === 'sub') return Column.sub(sol.a, sol.b);
    return Column.div(sol.D, sol.d);
  },

  div(D, d) {
    const s = String(D), n = s.length, dg = [...s].map(Number);
    const Q = Math.floor(D / d), REM = D % d;
    if (D < d) return null;
    const dl = String(d).length;
    let i = 0, cur = dg[0];
    while (cur < d && i < n - 1) { i++; cur = cur * 10 + dg[i]; }
    const qCount = n - i;
    const R = n + 1, W2 = Math.max(dl, qCount);
    const items = [], steps = [];
    const put = (r, end, str, st, cls) => {
      str = String(str);
      for (let k = 0; k < str.length; k++) items.push({ r, c: end + 1 - (str.length - 1 - k), ch: str[k], s: st, cls });
    };
    const finalText = r => r === 0
      ? `Остаток 0 — разделила без остатка. Ответ: ${U.fmt(D)} : ${d} = ${U.fmt(Q)}.`
      : `Остаток ${r} меньше ${d}. Ответ: ${U.fmt(D)} : ${d} = ${U.fmt(Q)} (ост. ${r}).`;

    put(0, n - 1, s, 0);
    String(d).split('').forEach((ch, k) => items.push({ r: 0, c: R + k, ch, s: 0 }));
    for (let c = R; c < R + W2; c++) items.push({ r: 0, c, s: 0, cls: 'bb' });
    items.push({ r: 0, c: R, s: 0, cls: 'bl' });
    items.push({ r: 1, c: R, s: 0, cls: 'bl' });
    steps.push('Записываю делимое и делитель «уголком».');

    steps.push(`Ищу первое неполное делимое: ${cur} ${U.RANK_SHORT[n - 1 - i]} — это не меньше, чем ${d}. Значит, в частном будет ${qCount} ${U.plural(qCount, 'цифра', 'цифры', 'цифр')}. Ставлю точки.`);
    for (let k = 0; k <= i; k++) items.push({ r: 0, c: k + 1, s: 1, until: 1, cls: 'hl' });

    let qi = 0, row = 0, end = i, st = 1, remFinal = null;
    const qDigitStep = [], qDigits = [];
    const addQ = (digit, stp) => {
      items.push({ r: 1, c: R + qi, ch: digit, s: stp });
      qDigitStep.push(stp); qDigits.push(digit); qi++;
    };
    while (true) {
      const q = Math.floor(cur / d), prod = q * d, rem = cur - prod;
      st++;
      const cs = String(cur), ps = String(prod), L = Math.max(cs.length, ps.length);
      addQ(q, st);
      items.push({ r: row, c: end + 1 - cs.length, ch: '−', s: st, cls: 'sign' });
      for (let k = 0; k < cs.length; k++) items.push({ r: row, c: end + 1 - k, s: st, until: st, cls: 'hl' });
      put(row + 1, end, ps, st);
      for (let k = 0; k < L; k++) items.push({ r: row + 1, c: end + 1 - k, s: st, cls: 'ul' });
      steps.push(`Делю ${cur} ${U.RANK_SHORT[n - 1 - end]} на ${d} — получаю ${q}, пишу в частное. Умножаю: ${q} · ${d} = ${prod}, пишу под ${cur}. Вычитаю: ${cur} − ${prod} = ${rem}.`);
      if (end === n - 1) {
        st++; row += 2;
        put(row, end, rem, st);
        remFinal = rem;
        steps.push(finalText(rem));
        break;
      }
      st++;
      let t = `Сравниваю: остаток ${rem} меньше ${d} — значит, всё верно. Сношу следующую цифру ${dg[end + 1]}`;
      end++; cur = rem * 10 + dg[end];
      t += ` — получилось ${cur} ${U.RANK_SHORT[n - 1 - end]}.`;
      while (cur < d && end < n - 1) {
        addQ(0, st);
        t += ` ${cur} меньше ${d}, поэтому пишу в частном 0 и сношу ещё цифру ${dg[end + 1]}`;
        end++; cur = cur * 10 + dg[end];
        t += ` — получилось ${cur} ${U.RANK_SHORT[n - 1 - end]}.`;
      }
      row += 2;
      put(row, end, cur, st);
      if (cur < d) {
        addQ(0, st);
        t += ` ${cur} меньше ${d}, поэтому пишу в частном 0. Цифр больше нет — ${cur} это остаток.`;
        steps.push(t);
        remFinal = cur;
        st++; steps.push(finalText(cur));
        break;
      }
      steps.push(t);
    }
    for (let k = 0; k < qCount; k++) {
      items.push({ r: 1, c: R + k, ch: '·', s: 1, until: (qDigitStep[k] || 99) - 1, cls: 'dot' });
    }
    return { items, steps: steps.map(U.dots), rows: row + 1, cols: R + W2, answer: Q, rem: REM, qStr: qDigits.join(''), remFinal };
  },

  render(model, step) {
    const cells = {};
    for (const it of model.items) {
      if (it.s > step) continue;
      if (it.until !== undefined && step > it.until) continue;
      const key = it.r + ',' + it.c;
      const cell = cells[key] || (cells[key] = { ch: '', cls: [] });
      if (it.ch !== undefined) cell.ch = String(it.ch);
      if (it.cls) cell.cls.push(it.cls);
    }
    let h = `<div class="col-grid" style="grid-template-columns:repeat(${model.cols}, var(--cell))">`;
    for (let r = 0; r < model.rows; r++) {
      for (let c = 0; c < model.cols; c++) {
        const cell = cells[r + ',' + c];
        h += cell ? `<div class="cg ${cell.cls.join(' ')}">${cell.ch}</div>` : '<div class="cg"></div>';
      }
    }
    return h + '</div>';
  },

  // Окошко с пошаговым разбором: кнопки «Назад» и «Дальше»
  viewer(model, startAtEnd) {
    const el = document.createElement('div');
    el.className = 'col-viewer';
    const last = model.steps.length - 1;
    let st = startAtEnd ? last : 0;
    const draw = () => {
      el.innerHTML = `
        <div class="col-paper">${Column.render(model, st)}</div>
        <div class="col-text"><b>Шаг ${st + 1} из ${last + 1}.</b> ${model.steps[st]}</div>
        <div class="col-btns">
          <button class="btn small ghost" data-a="prev" ${st === 0 ? 'disabled' : ''}>← Назад</button>
          <button class="btn small" data-a="next" ${st === last ? 'disabled' : ''}>Дальше →</button>
        </div>`;
    };
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-a]');
      if (!b || b.disabled) return;
      st = b.dataset.a === 'next' ? Math.min(last, st + 1) : Math.max(0, st - 1);
      draw();
    });
    draw();
    return el;
  },
};

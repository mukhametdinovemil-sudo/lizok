// Вспомогательные функции: случайные числа, запись чисел, склонения
const U = {
  rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  // 25482 -> "25 482" (как в учебнике: пробел между классами)
  fmt(n) {
    const s = String(n);
    if (s.length < 4) return s;
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  },
  esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  },
  plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  },
  today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },
  // число из заданного количества цифр
  digits(n) { return U.rnd(10 ** (n - 1), 10 ** n - 1); },
  // число, в котором есть нуль внутри (например 4006, 30 708)
  withInnerZero(n) {
    while (true) {
      const d = [U.rnd(1, 9)];
      for (let i = 1; i < n; i++) d.push(U.rnd(0, 9));
      const zi = U.rnd(1, n - 2);
      d[zi] = 0;
      if (d[n - 1] === 0) d[n - 1] = U.rnd(1, 9);
      return Number(d.join(''));
    }
  },
  // «4 сот..» -> «4 сот.» (сокращение в конце предложения)
  dots(s) { return String(s).replace(/\.\.(?!\.)/g, '.'); },
  // убрать HTML-теги (для записи ошибок в статистику)
  plain(html) { return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); },
  // короткие названия разрядов: ед., дес., сот., ...
  RANK_SHORT: ['ед.', 'дес.', 'сот.', 'тыс.', 'дес. тыс.', 'сот. тыс.', 'млн', 'дес. млн', 'сот. млн'],
  // «Умножаю единицы / десятки / ...»
  RANK_ACC: ['единицы', 'десятки', 'сотни', 'тысячи', 'десятки тысяч', 'сотни тысяч', 'миллионы'],
};

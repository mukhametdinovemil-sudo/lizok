// Все темы приложения. У тем без уроков пока стоит «Скоро».
const TOPICS = [
  { id: 't5', title: 'Умножение и деление', sub: 'Столбиком, с остатком, уравнения', emoji: '✖️', lessons: LESSONS_T5 },
  { id: 't1', title: 'Числа до 1000', sub: 'Повторение, порядок действий', emoji: '🔢', lessons: [] },
  { id: 't2', title: 'Большие числа', sub: 'Классы, разряды, миллионы', emoji: '🏰', lessons: LESSONS_T2 },
  { id: 't3', title: 'Величины', sub: 'Длина, площадь, масса, время', emoji: '📏', lessons: LESSONS_T3 },
  { id: 't4', title: 'Сложение и вычитание', sub: 'Столбиком, уравнения, доли', emoji: '➕', lessons: LESSONS_T4 },
  { id: 't6', title: 'Текстовые задачи', sub: 'Цена, количество, стоимость', emoji: '🧁', lessons: [] },
  { id: 't7', title: 'Геометрия', sub: 'Периметр, площадь, углы', emoji: '📐', lessons: [] },
  { id: 't8', title: 'Скорость, время, расстояние', sub: 'Следующая четверть', emoji: '🚲', lessons: [] },
  { id: 't9', title: 'Круглые числа', sub: 'Умножение и деление на 10, 20, 300… (след. четверть)', emoji: '🎯', lessons: [] },
  { id: 't10', title: 'Задачи на движение', sub: 'Навстречу и в разные стороны (след. четверть)', emoji: '🚂', lessons: [] },
];
const LESSON_BY_ID = {};
TOPICS.forEach(t => t.lessons.forEach(l => { l.topic = t.id; LESSON_BY_ID[l.id] = l; }));

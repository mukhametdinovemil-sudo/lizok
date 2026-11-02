// Все темы приложения. У тем без уроков пока стоит «Скоро».
const TOPICS = [
  { id: 't5', title: 'Умножение и деление', sub: 'Столбиком, с остатком, уравнения', emoji: '✖️', lessons: LESSONS_T5 },
  { id: 't1', title: 'Числа до 1000', sub: 'Повторение, порядок действий', emoji: '🔢', lessons: LESSONS_T1 },
  { id: 't2', title: 'Большие числа', sub: 'Классы, разряды, миллионы', emoji: '🏰', lessons: LESSONS_T2 },
  { id: 't3', title: 'Величины', sub: 'Длина, площадь, масса, время', emoji: '📏', lessons: LESSONS_T3 },
  { id: 't4', title: 'Сложение и вычитание', sub: 'Столбиком, уравнения, доли', emoji: '➕', lessons: LESSONS_T4 },
  { id: 't6', title: 'Текстовые задачи', sub: 'Цена, количество, стоимость', emoji: '🧁', lessons: LESSONS_T6 },
  { id: 't7', title: 'Геометрия', sub: 'Углы, треугольники, периметр, симметрия', emoji: '📐', lessons: LESSONS_T7 },
  { id: 't8', title: 'Скорость, время, расстояние', sub: 'Следующая четверть', emoji: '🚲', lessons: LESSONS_T8 },
  { id: 't9', title: 'Круглые числа и двузначные', sub: 'На 20, 300…, умножение на двузначное (след. четверть)', emoji: '🎯', lessons: LESSONS_T9 },
  { id: 't10', title: 'Задачи на движение', sub: 'Навстречу, в разные стороны, вдогонку (след. четверть)', emoji: '🚂', lessons: LESSONS_T10 },
];
const LESSON_BY_ID = {};
TOPICS.forEach(t => t.lessons.forEach(l => { l.topic = t.id; LESSON_BY_ID[l.id] = l; }));

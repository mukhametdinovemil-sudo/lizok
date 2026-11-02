// Все темы приложения — в порядке учебника (он рассчитан на весь год).
// extra: true — темы сверх учебника (усложнение «для пятёрки с плюсом»).
const TOPICS = [
  { id: 't1', title: 'Числа до 1000', sub: 'Повторение, порядок действий · стр. 3–20', emoji: '🔢', lessons: LESSONS_T1 },
  { id: 't2', title: 'Большие числа', sub: 'Классы, разряды, миллионы · стр. 21–35', emoji: '🏰', lessons: LESSONS_T2 },
  { id: 't3', title: 'Величины', sub: 'Длина, площадь, масса, время · стр. 36–53', emoji: '📏', lessons: LESSONS_T3 },
  { id: 't4', title: 'Сложение и вычитание', sub: 'Столбиком, уравнения, доли · стр. 58–70', emoji: '➕', lessons: LESSONS_T4 },
  { id: 't5', title: 'Умножение и деление', sub: 'Столбиком, с остатком, уравнения · стр. 72–91', emoji: '✖️', lessons: LESSONS_T5 },
  { id: 't6', title: 'Текстовые задачи', sub: 'Цена, количество, стоимость · по всей книге', emoji: '🧁', lessons: LESSONS_T6 },
  { id: 't7', title: 'Геометрия', sub: 'Углы, треугольники, периметр · по всей книге', emoji: '📐', lessons: LESSONS_T7 },
  { id: 't8', title: 'Скорость, время, расстояние', sub: 'Формулы S = v · t', emoji: '🚲', lessons: LESSONS_T8, extra: true },
  { id: 't10', title: 'Задачи на движение', sub: 'Навстречу, в разные стороны, вдогонку', emoji: '🚂', lessons: LESSONS_T10, extra: true },
  { id: 't9', title: 'Круглые числа и двузначные', sub: 'На 20, 300…, умножение на двузначное', emoji: '🎯', lessons: LESSONS_T9, extra: true },
];
const LESSON_BY_ID = {};
TOPICS.forEach(t => t.lessons.forEach(l => { l.topic = t.id; LESSON_BY_ID[l.id] = l; }));

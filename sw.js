// Работа без интернета: файлы приложения сохраняются в телефоне.
// При каждом запуске показываем сохранённую версию и тихо проверяем, нет ли новой.
const CACHE = 'lizok-v9';
const FILES = [
  './', './index.html', './style.css', './manifest.webmanifest',
  './js/util.js', './js/column.js', './js/topics/t5_umnozh_delenie.js', './js/topics/t3_velichiny.js', './js/topics/t2_bolshie_chisla.js', './js/topics/t4_slozh_vych.js', './js/topics/t8_dvizhenie.js', './js/topics/t9_kruglye.js', './js/topics/t1_povtorenie.js', './js/topics/t6_zadachi.js', './js/topics/t7_geometriya.js',
  './js/topics/index.js', './js/fun.js', './js/fun2.js', './js/app.js',
  './img/pinky.svg', './img/bg-tile.svg',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; }).catch(() => cached);
    return cached || net;
  }));
});

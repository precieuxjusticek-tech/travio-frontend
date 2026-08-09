// sw.js — service worker minimal, requis pour l'installabilité PWA
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return new Response('', { status: 503, statusText: 'Offline' });
    })
  );
});
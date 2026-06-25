const CACHE_NAME = 'ideenapp-v1';
const ASSETS = ['./index.html', './'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if (c.visibilityState === 'visible') return c.focus(); }
      return self.clients.openWindow('./');
    })
  );
});

// Periodic Background Sync (Chromium, best-effort)
self.addEventListener('periodicsync', e => {
  if (e.tag === 'check-ideas') e.waitUntil(checkNewIdeas());
});

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('ideenapp-sw', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('config');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGet(key) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('config', 'readonly');
    const req = tx.objectStore('config').get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function dbSet(key, val) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('config', 'readwrite');
    tx.objectStore('config').put(val, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

self.addEventListener('message', e => {
  if (e.data?.type === 'SET_AUTHOR') dbSet('myAuthor', e.data.author);
  if (e.data?.type === 'SET_LAST_CHECK') dbSet('lastCheck', e.data.timestamp);
});

async function checkNewIdeas() {
  try {
    const myAuthor = await dbGet('myAuthor');
    const lastCheck = await dbGet('lastCheck') || new Date(Date.now() - 300000).toISOString();
    if (!myAuthor) return;

    const res = await fetch('https://firestore.googleapis.com/v1/projects/ideenapp-63691/databases/(default)/documents:runQuery?key=AIzaSyBO3BwYiEnF0K86j49aooqenWGgBj5yCLY', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'ideen' }],
          orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
          limit: 5
        }
      })
    });

    const results = await res.json();
    let newest = lastCheck;

    for (const r of results) {
      if (!r.document) continue;
      const f = r.document.fields;
      const author = f.author?.stringValue;
      const text = f.text?.stringValue;
      const ts = f.createdAt?.timestampValue;
      if (author && author !== myAuthor && ts && ts > lastCheck) {
        await self.registration.showNotification('💡 Neue Idee von ' + author, {
          body: text?.length > 100 ? text.substring(0, 100) + '…' : text,
          tag: 'idea-' + ts,
          renotify: true
        });
        if (ts > newest) newest = ts;
      }
    }

    await dbSet('lastCheck', newest > lastCheck ? newest : new Date().toISOString());
  } catch (e) {
    console.error('Background check failed:', e);
  }
}

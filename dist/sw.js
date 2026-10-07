const CACHE='mycelium-shell-v5';
const SHELL=['./','./index.html','./style.css','./app.js','./guide.js','./catalogue.js','./slime-guide.js','./engine.js','./manifest.webmanifest','./favicon.svg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mycelium-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method!=='GET')return;const local=url.origin===self.location.origin;
 if(local){e.respondWith(fetch(e.request).then(r=>{if(r.ok&&r.type!=='opaque'&&!r.redirected){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request).then(r=>r||(e.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));}
 else if(url.hostname==='inaturalist-open-data.s3.amazonaws.com'||url.hostname==='static.inaturalist.org'){e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{if(r.ok||r.type==='opaque'){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;})));}
});

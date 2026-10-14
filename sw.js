// Service worker: guarda la app en el teléfono para que abra sin conexión.
// Para publicar una versión nueva, cambiá el número de CACHE (v5 a v6).
const CACHE='guitarra12-v5';
const PRE=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png','./icons/favicon-32.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url),ok=u.origin===location.origin||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
  if(!ok)return;
  e.respondWith(caches.match(r).then(hit=>{
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res}).catch(()=>hit);
    e.waitUntil(net.then(()=>{},()=>{}));
    return hit||net;
  }));
});

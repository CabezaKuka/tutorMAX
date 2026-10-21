// Service worker: guarda la app en el teléfono para que abra sin conexión.
// Estrategia: los archivos de la app (HTML, JS, CSS) se piden primero a la red y,
// si no hay conexión, salen de la copia guardada. Así cada apertura trae la última versión.
// Íconos y fuentes salen primero de la copia guardada (no cambian).
// Al publicar una versión nueva, subí el número acá y en VER (js/app.js): la app muestra
// el aviso "Hay una versión nueva". `npm test` verifica que coincidan.
const CACHE='guitarra12-v13';
const PRE=['./','./index.html','./css/app.css','./css/fonts.css','./js/content.js','./js/mic.js','./js/app.js','./manifest.webmanifest',
'./fonts/manrope-latin.woff2','./fonts/jetbrains-mono-latin.woff2',
'./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png','./icons/favicon-32.png'];
const FIXED=/\/(icons|fonts)\//;
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRE.map(u=>new Request(u,{cache:'reload'})))))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
const put=(r,res)=>{if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res};
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||/^\/(\.netlify|api)\//.test(u.pathname))return;
  if(FIXED.test(u.pathname)){e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>put(r,res))));return}
  // Red primero, con 4 s de espera máxima; sin red, la copia guardada
  e.respondWith(new Promise(ok=>{
    let done=0;const fb=()=>caches.match(r,{ignoreSearch:r.mode==='navigate'}).then(hit=>hit||(r.mode==='navigate'?caches.match('./index.html'):undefined));
    const tm=setTimeout(()=>fb().then(hit=>{if(hit&&!done){done=1;ok(hit)}}),4000);
    fetch(r).then(res=>{put(r,res);if(!done){done=1;clearTimeout(tm);ok(res)}})
      .catch(()=>fb().then(hit=>{if(!done){done=1;clearTimeout(tm);ok(hit||Response.error())}}));
  }));
});

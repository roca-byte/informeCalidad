// Subí el número de versión cada vez que cambies cualquier archivo de la app
const V='informe-planta-v25';
const FILES=['./','index.html','style.css','app.js','brand.js','checklist.js','auditoria.js','frases.js','jspdf.umd.min.js','manifest.json','qualityos.svg','icon.svg','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
// Las apps de la suite comparten dominio (roca-byte.github.io) y por eso comparten las cachés:
// se borran SOLO las versiones viejas de esta app. Antes se borraba todo lo que no fuera la
// versión actual, y al instalar o actualizar otra app de la suite esta dejaba de abrir sin señal.
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('informe-planta-')&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});

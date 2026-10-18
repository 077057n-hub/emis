const C='grades-v5';
const F=['./grades-record.html','./link.js','./manifest.json','./icon-192.png','./icon-512.png',
 './app.html','./app-manifest.json','./app-icon-192.png','./app-icon-512.png',
 './teacher-app.html','./teacher-link.js','./teacher-roster.js','./teacher-cloud.js', './teacher-extras.js','./teacher-manifest.json','./teacher-icon-192.png','./teacher-icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(u=>c.add(u).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(u.origin!==location.origin&&u.hostname!=='www.gstatic.com')return;
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{
    if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}
    return r;
  }).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||(e.request.mode==='navigate'?caches.match('./grades-record.html'):undefined))));
});

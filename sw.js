const C='grades-v12';
const SDK='https://www.gstatic.com/firebasejs/10.12.2/';
const F=['./app.html','./school.html','./admin.html','./theme.css','./app-manifest.json','./app-icon-192.png','./app-icon-512.png',
 './grades-record.html','./link.js','./manifest.json','./teacher-app.html','./teacher-link.js','./teacher-roster.js','./teacher-cloud.js','./teacher-extras.js',
 './teacher-manifest.json','./teacher-icon-192.png','./teacher-icon-512.png',
 SDK+'firebase-app.js',SDK+'firebase-auth.js',SDK+'firebase-firestore.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(u=>c.add(u).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const q=e.request,u=new URL(q.url);
  if(q.method!=='GET')return;
  if(u.origin!==location.origin&&u.hostname!=='www.gstatic.com')return;
  // الكاش أولاً (فتح فوري وبدون إنترنت) ثم تحديث النسخة بالخلفية
  e.respondWith(caches.open(C).then(async c=>{
    const hit=await c.match(q,{ignoreSearch:true});
    const net=fetch(q).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(q,r.clone());return r}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    const r=await net;
    if(r)return r;
    if(q.mode==='navigate')return (await c.match('./app.html'))||Response.error();
    return Response.error();
  }));
});

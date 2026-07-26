const SHELL_CACHE="homebase-shell-v4";
const RUNTIME_CACHE="homebase-runtime-v4";
const SHELL=["./","./index.html","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(SHELL_CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("homebase-")&&!([SHELL_CACHE,RUNTIME_CACHE].includes(k))).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=="GET")return;
 if(req.mode==="navigate"){
  event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(req,copy));return res}).catch(()=>caches.match(req).then(r=>r||caches.match("./index.html"))));return;
 }
 const isPdfJs=/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com/.test(url.hostname)&&/pdf(?:\.min)?\.js/.test(url.pathname);
 if(isPdfJs){event.respondWith(caches.open(RUNTIME_CACHE).then(async c=>{const cached=await c.match(req);const fresh=fetch(req).then(res=>{c.put(req,res.clone());return res}).catch(()=>cached);return cached||fresh}));return}
 if(url.origin===self.location.origin){event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{const copy=res.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(req,copy));return res})));}
});

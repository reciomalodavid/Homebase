const SHELL_CACHE="homebase-1-6-1";
const RUNTIME_CACHE="homebase-1-6-1-runtime-20260728-duty-route";
const SHELL=["./","./index.html","./manifest.webmanifest","./apple-touch-icon.png","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(SHELL_CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("homebase-")&&![SHELL_CACHE,RUNTIME_CACHE].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
 const req=e.request,url=new URL(req.url);if(req.method!=="GET")return;
 if(req.mode==="navigate"){e.respondWith(fetch(new Request(req,{cache:"no-store"})).then(r=>{const x=r.clone();caches.open(RUNTIME_CACHE).then(c=>c.put("./index.html",x));return r}).catch(()=>caches.match("./index.html")));return;}
 if(url.origin===self.location.origin){e.respondWith(fetch(new Request(req,{cache:"no-store"})).then(r=>{const x=r.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(req,x));return r}).catch(()=>caches.match(req)));return;}
 e.respondWith(fetch(req).catch(()=>caches.match(req)));
});

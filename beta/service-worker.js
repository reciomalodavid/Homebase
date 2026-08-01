const CACHE='homebase-beta-2.0.0';
const SHELL=['./','./index.html?v=200','./manifest.webmanifest?v=200','./beta-icon.svg?v=200'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('homebase-beta-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(!url.pathname.includes('/Homebase/beta/'))return;
 event.respondWith(fetch(new Request(event.request,{cache:'no-store'})).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request)));
});
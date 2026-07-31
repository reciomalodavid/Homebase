const SHELL_CACHE="homebase-1.8.7";
const RUNTIME_CACHE="homebase-1.8.7";
const SHELL=["./","./index.html","./manifest.webmanifest","./apple-touch-icon.png","./icon-192.png","./icon-512.png","./roster-sync-fix.js","./homebase-ui-1.8.3.js","./homebase-ui-1.8.3.css"];

async function injectRosterFix(response){
 const headers=new Headers(response.headers);
 headers.set("content-type","text/html; charset=utf-8");
 const html=await response.text();
 const script='<script src="./roster-sync-fix.js?v=187"></script>';
 const body=html.includes("roster-sync-fix.js")?html:html.replace("</body>",`${script}</body>`);
 return new Response(body,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener("install",event=>event.waitUntil(
 caches.open(SHELL_CACHE)
  .then(cache=>cache.addAll(SHELL.map(url=>new Request(url,{cache:"reload"}))))
  .then(()=>self.skipWaiting())
));
self.addEventListener("activate",event=>event.waitUntil(
 caches.keys()
  .then(keys=>Promise.all(keys.filter(key=>key.startsWith("homebase-")&&![SHELL_CACHE,RUNTIME_CACHE].includes(key)).map(key=>caches.delete(key))))
  .then(()=>self.clients.claim())
));
self.addEventListener("fetch",event=>{
 const request=event.request;
 const url=new URL(request.url);
 if(request.method!=="GET")return;
 if(request.mode==="navigate"){
  event.respondWith(
   fetch(new Request(request,{cache:"no-store"}))
    .then(injectRosterFix)
    .then(response=>{const copy=response.clone();caches.open(RUNTIME_CACHE).then(cache=>cache.put("./index.html",copy));return response})
    .catch(async()=>{const cached=await caches.match("./index.html");return cached?injectRosterFix(cached):Response.error()})
  );
  return;
 }
 if(url.origin===self.location.origin){
  event.respondWith(
   fetch(new Request(request,{cache:"no-store"}))
    .then(response=>{const copy=response.clone();caches.open(RUNTIME_CACHE).then(cache=>cache.put(request,copy));return response})
    .catch(()=>caches.match(request))
  );
  return;
 }
 event.respondWith(fetch(request).catch(()=>caches.match(request)));
});

const SHELL_CACHE="homebase-1.8.3";
const RUNTIME_CACHE="homebase-1.8.3";
const SHELL=["./","./index.html","./manifest.webmanifest","./apple-touch-icon.png","./icon-192.png","./icon-512.png","./roster-sync-fix.js","./homebase-ui-1.8.3.js","./homebase-ui-1.8.3.css"];

async function injectRosterFix(response){
 const headers=new Headers(response.headers);
 headers.set("content-type","text/html; charset=utf-8");
 const html=await response.text();
 const script='<script src="./roster-sync-fix.js?v=183"></script>';
 const body=html.includes("roster-sync-fix.js")?html:html.replace("</body>",`${script}</body>`);
 return new Response(body,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener("install",e=>e.waitUntil(
 caches.open(SHELL_CACHE)
  .then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:"reload"}))))
  .then(()=>self.skipWaiting())
));

self.addEventListener("activate",e=>e.waitUntil(
 caches.keys()
  .then(keys=>Promise.all(keys.filter(k=>k.startsWith("homebase-")&&![SHELL_CACHE,RUNTIME_CACHE].includes(k)).map(k=>caches.delete(k))))
  .then(()=>self.clients.claim())
));

self.addEventListener("fetch",e=>{
 const req=e.request,url=new URL(req.url);
 if(req.method!=="GET")return;

 if(req.mode==="navigate"){
  e.respondWith(
   fetch(new Request(req,{cache:"no-store"}))
    .then(injectRosterFix)
    .then(r=>{const x=r.clone();caches.open(RUNTIME_CACHE).then(c=>c.put("./index.html",x));return r})
    .catch(async()=>{
      const cached=await caches.match("./index.html");
      return cached?injectRosterFix(cached):Response.error();
    })
  );
  return;
 }

 if(url.origin===self.location.origin){
  e.respondWith(
   fetch(new Request(req,{cache:"no-store"}))
    .then(r=>{const x=r.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(req,x));return r})
    .catch(()=>caches.match(req))
  );
  return;
 }

 e.respondWith(fetch(req).catch(()=>caches.match(req)));
});

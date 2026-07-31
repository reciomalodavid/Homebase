const SHELL_CACHE="homebase-1.9.7";
const RUNTIME_CACHE="homebase-1.9.7";
const SHELL=["./","./index.html","./manifest.webmanifest","./apple-touch-icon.png","./icon-192.png","./icon-512.png","./roster-sync-fix.js","./homebase-ui-1.8.3.js","./homebase-ui-1.8.3.css","./homebase-fixes-1.9.2.css","./homebase-quality-1.9.7.js","./homebase-quality-1.9.7.css"];

async function prepareAppHtml(response){
 const headers=new Headers(response.headers);
 headers.set("content-type","text/html; charset=utf-8");
 let html=await response.text();

 const viewport='<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover">';
 html=html.replace(/<meta\s+name=["']viewport["'][^>]*>/i,viewport);

 const critical='<style data-homebase-critical>:root{--glass-bg:rgba(255,255,255,.46);--glass-border:rgba(255,255,255,.78);--glass-shadow:0 18px 48px rgba(49,38,28,.13)}html,body{width:100%;max-width:100%;overflow-x:hidden}body{background:radial-gradient(circle at 10% -3%,rgba(255,186,112,.34),transparent 34%),radial-gradient(circle at 96% 6%,rgba(112,170,255,.27),transparent 31%),linear-gradient(180deg,#f7efe6 0%,#eef4fb 55%,#f7f2eb 100%)!important;background-attachment:fixed!important}.topbar,.bottom-nav,.card,.calendar-shell,dialog,.today-focus,.today-stats{border:1px solid var(--glass-border)!important;background:var(--glass-bg)!important;box-shadow:var(--glass-shadow)!important}.topbar,.bottom-nav,.card,.calendar-shell,dialog{-webkit-backdrop-filter:saturate(175%) blur(24px);backdrop-filter:saturate(175%) blur(24px)}</style>';
 if(!html.includes('data-homebase-critical'))html=html.replace('</head>',`${critical}\n</head>`);

 const mainStyle='<link rel="stylesheet" href="./homebase-ui-1.8.3.css?v=197" data-homebase-ui="1.9.7">';
 const fixesStyle='<link rel="stylesheet" href="./homebase-fixes-1.9.2.css?v=197" data-homebase-fixes="1.9.7">';
 const qualityStyle='<link rel="stylesheet" href="./homebase-quality-1.9.7.css?v=197" data-homebase-quality="1.9.7">';
 if(!html.includes('data-homebase-ui='))html=html.replace('</head>',`${mainStyle}\n</head>`);
 if(!html.includes('homebase-fixes-1.9.2.css'))html=html.replace('</head>',`${fixesStyle}\n</head>`);
 if(!html.includes('homebase-quality-1.9.7.css'))html=html.replace('</head>',`${qualityStyle}\n</head>`);

 const scripts=[];
 if(!html.includes("homebase-ui-1.8.3.js"))scripts.push('<script src="./homebase-ui-1.8.3.js?v=197"></script>');
 if(!html.includes("roster-sync-fix.js"))scripts.push('<script src="./roster-sync-fix.js?v=197"></script>');
 if(!html.includes("homebase-quality-1.9.7.js"))scripts.push('<script src="./homebase-quality-1.9.7.js?v=197"></script>');
 if(scripts.length)html=html.replace("</body>",`${scripts.join("\n")}\n</body>`);

 return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

async function fetchAndStoreNavigation(request){
 const network=await fetch(new Request(request,{cache:"no-store"}));
 const prepared=await prepareAppHtml(network);
 const copy=prepared.clone();
 await caches.open(RUNTIME_CACHE).then(cache=>cache.put("./index.html",copy));
 return prepared;
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
  event.respondWith((async()=>{
    const cached=await caches.match("./index.html");
    if(cached){
      event.waitUntil(fetchAndStoreNavigation(request).catch(()=>{}));
      return prepareAppHtml(cached);
    }
    try{return await fetchAndStoreNavigation(request)}catch{return Response.error()}
  })());
  return;
 }

 if(url.origin===self.location.origin){
  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached){
      event.waitUntil(fetch(new Request(request,{cache:"no-store"})).then(response=>caches.open(RUNTIME_CACHE).then(cache=>cache.put(request,response))).catch(()=>{}));
      return cached;
    }
    try{
      const response=await fetch(new Request(request,{cache:"no-store"}));
      const copy=response.clone();
      caches.open(RUNTIME_CACHE).then(cache=>cache.put(request,copy));
      return response;
    }catch{return Response.error()}
  })());
  return;
 }
 event.respondWith(fetch(request).catch(()=>caches.match(request)));
});

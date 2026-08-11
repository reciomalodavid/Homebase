/* Homebase stable 1.10.37 · Beta-style Firestore bridge */
const SHELL_CACHE="homebase-1.10.37";
const RUNTIME_CACHE="homebase-1.10.37";
const SHELL=["./backup.html","./production-tools.js","./production-cloud-db-bridge.js","./production-security-payload-guard.js","./production-security-auth.js","./homebase-expiries-1.10.21.js","./homebase-quick-add-1.10.27.js","./homebase-birthdays-1.10.27.js","./homebase-mobile-nav-1.10.29.js","./homebase-roster-code-labels-1.10.30.js","./homebase-roster-dedupe-1.10.31.js","./homebase-roster-import-summary-1.10.31.js","./homebase-roster-detail-context-1.10.31.js","./homebase-roster-monthly-summary-1.10.31.js","./homebase-roster-print-1.10.32.js","./homebase-update-checker-1.10.37.js","./homebase-version.json","./","./index.html","./manifest.webmanifest","./apple-touch-icon.png","./icon-192.png","./icon-512.png","./roster-sync-fix.js","./homebase-ui-1.8.3.js","./homebase-ui-1.8.3.css","./homebase-fixes-1.9.2.css","./homebase-quality-1.9.7.js","./homebase-quality-1.9.7.css","./homebase-apple-glass-1.10.2.css","./homebase-shell-1.10.3.css","./homebase-shell-1.10.3.js","./homebase-nozoom-1.10.10.js","./homebase-calendar-jump-1.10.13.js","./homebase-expiry-sync-1.10.14.js","./homebase-profile-enhancements-1.10.16.js","./homebase-expiry-owner-fix-1.10.18.js","./homebase-expiry-owner-hotfix-1.10.19.js"];

async function prepareAppHtml(response){
 const headers=new Headers(response.headers);
 headers.set("content-type","text/html; charset=utf-8");
 let html=await response.text();
 const viewport='<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover">';
 html=html.replace(/<meta\s+name=["']viewport["'][^>]*>/i,viewport);
 const colorScheme='<meta name="color-scheme" content="light">';
 if(/<meta\s+name=["']color-scheme["'][^>]*>/i.test(html)) html=html.replace(/<meta\s+name=["']color-scheme["'][^>]*>/i,colorScheme);
 else html=html.replace('</head>',`${colorScheme}\n</head>`);
 const authScript='<script src="https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js"></script>';
 if(!html.includes('firebase-auth-compat.js')){
   html=html.replace('<script src="https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js"></script>','<script src="https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js"></script>\n'+authScript);
 }
 const authGate='<script>window.HOMEBASE_PRODUCTION_AUTH_REQUIRED=true;</script>';
 if(!html.includes('HOMEBASE_PRODUCTION_AUTH_REQUIRED'))html=html.replace(/<head>/i,'<head>'+authGate);
 html=html.replace('if(state.syncCode){startCloudListener();refreshWhenActive()}','if(state.syncCode&&!window.HOMEBASE_PRODUCTION_AUTH_REQUIRED){startCloudListener();refreshWhenActive()}');
 const critical='<style data-homebase-critical>:root{color-scheme:light!important;--glass-bg:rgba(255,255,255,.58);--glass-border:rgba(255,255,255,.84);--glass-shadow:0 18px 48px rgba(49,38,28,.10)}html,body{color-scheme:light!important;width:100%;max-width:100%;overflow-x:hidden;color:#1d1d1f!important}body{background:radial-gradient(circle at 4% 1%,rgba(255,179,92,.24),transparent 31%),radial-gradient(circle at 98% 7%,rgba(117,171,255,.20),transparent 32%),linear-gradient(180deg,#f8f3ed 0%,#f1f5fa 53%,#f7f2ec 100%)!important;background-attachment:fixed!important}.topbar,.bottom-nav,.card,.calendar-shell,dialog,.today-focus,.today-stats{border:1px solid var(--glass-border)!important;background:var(--glass-bg)!important;box-shadow:var(--glass-shadow)!important}.topbar,.bottom-nav,.card,.calendar-shell,dialog{-webkit-backdrop-filter:saturate(175%) blur(26px);backdrop-filter:saturate(175%) blur(26px)}</style>';
 if(!html.includes('data-homebase-critical'))html=html.replace('</head>',`${critical}\n</head>`);
 const mainStyle='<link rel="stylesheet" href="./homebase-ui-1.8.3.css?v=11037" data-homebase-ui="1.10.37">';
 const fixesStyle='<link rel="stylesheet" href="./homebase-fixes-1.9.2.css?v=11037" data-homebase-fixes="1.10.37">';
 const qualityStyle='<link rel="stylesheet" href="./homebase-quality-1.9.7.css?v=11037" data-homebase-quality="1.10.37">';
 const appleGlassStyle='<link rel="stylesheet" href="./homebase-apple-glass-1.10.2.css?v=11037" data-homebase-apple-glass="1.10.37">';
 const shellStyle='<link rel="stylesheet" href="./homebase-shell-1.10.3.css?v=11037" data-homebase-shell="1.10.37">';
 if(!html.includes('data-homebase-ui='))html=html.replace('</head>',`${mainStyle}\n</head>`);
 if(!html.includes('homebase-fixes-1.9.2.css'))html=html.replace('</head>',`${fixesStyle}\n</head>`);
 if(!html.includes('homebase-quality-1.9.7.css'))html=html.replace('</head>',`${qualityStyle}\n</head>`);
 if(!html.includes('homebase-apple-glass-1.10.2.css'))html=html.replace('</head>',`${appleGlassStyle}\n</head>`);
 if(!html.includes('homebase-shell-1.10.3.css'))html=html.replace('</head>',`${shellStyle}\n</head>`);
 const scripts=[];
 if(!html.includes("homebase-ui-1.8.3.js"))scripts.push('<script src="./homebase-ui-1.8.3.js?v=11037"></script>');
 if(!html.includes("roster-sync-fix.js"))scripts.push('<script src="./roster-sync-fix.js?v=11037"></script>');
 if(!html.includes("homebase-quality-1.9.7.js"))scripts.push('<script src="./homebase-quality-1.9.7.js?v=11037"></script>');
 if(!html.includes("homebase-shell-1.10.3.js"))scripts.push('<script src="./homebase-shell-1.10.3.js?v=11037"></script>');
 if(!html.includes("homebase-nozoom-1.10.10.js"))scripts.push('<script src="./homebase-nozoom-1.10.10.js?v=11037"></script>');
 if(!html.includes("homebase-calendar-jump-1.10.13.js"))scripts.push('<script src="./homebase-calendar-jump-1.10.13.js?v=11037"></script>');
 if(!html.includes("production-cloud-db-bridge.js"))scripts.push('<script src="./production-cloud-db-bridge.js?v=11037"></script>');
 if(!html.includes("production-security-payload-guard.js"))scripts.push('<script src="./production-security-payload-guard.js?v=11037"></script>');
 if(!html.includes("production-security-auth.js"))scripts.push('<script src="./production-security-auth.js?v=11037"></script>');
 if(!html.includes("homebase-expiry-sync-1.10.14.js"))scripts.push('<script src="./homebase-expiry-sync-1.10.14.js?v=11037"></script>');
 if(!html.includes("homebase-profile-enhancements-1.10.16.js"))scripts.push('<script src="./homebase-profile-enhancements-1.10.16.js?v=11037"></script>');
 if(!html.includes("homebase-expiry-owner-fix-1.10.18.js"))scripts.push('<script src="./homebase-expiry-owner-fix-1.10.18.js?v=11037"></script>');
 if(!html.includes("homebase-expiry-owner-hotfix-1.10.19.js"))scripts.push('<script src="./homebase-expiry-owner-hotfix-1.10.19.js?v=11037"></script>');
 if(!html.includes("production-tools.js"))scripts.push('<script src="./production-tools.js?v=11037"></script>');
 if(!html.includes("homebase-expiries-1.10.21.js"))scripts.push('<script src="./homebase-expiries-1.10.21.js?v=11037"></script>');
 if(!html.includes("homebase-birthdays-1.10.27.js"))scripts.push('<script src="./homebase-birthdays-1.10.27.js?v=11037"></script>');
 if(!html.includes("homebase-quick-add-1.10.27.js"))scripts.push('<script src="./homebase-quick-add-1.10.27.js?v=11037"></script>');
 if(!html.includes("homebase-mobile-nav-1.10.29.js"))scripts.push('<script src="./homebase-mobile-nav-1.10.29.js?v=11037"></script>');
 if(!html.includes("homebase-roster-code-labels-1.10.30.js"))scripts.push('<script src="./homebase-roster-code-labels-1.10.30.js?v=11037"></script>');
 if(!html.includes("homebase-roster-dedupe-1.10.31.js"))scripts.push('<script src="./homebase-roster-dedupe-1.10.31.js?v=11037"></script>');
 if(!html.includes("homebase-roster-import-summary-1.10.31.js"))scripts.push('<script src="./homebase-roster-import-summary-1.10.31.js?v=11037"></script>');
 if(!html.includes("homebase-roster-detail-context-1.10.31.js"))scripts.push('<script src="./homebase-roster-detail-context-1.10.31.js?v=11037"></script>');
 if(!html.includes("homebase-roster-monthly-summary-1.10.31.js"))scripts.push('<script src="./homebase-roster-monthly-summary-1.10.31.js?v=11037"></script>');
 if(!html.includes("homebase-roster-print-1.10.32.js"))scripts.push('<script src="./homebase-roster-print-1.10.32.js?v=11037"></script>');
 if(!html.includes("homebase-update-checker-1.10.37.js"))scripts.push('<script src="./homebase-update-checker-1.10.37.js?v=11037"></script>');
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
 caches.open(SHELL_CACHE).then(cache=>cache.addAll(SHELL.map(url=>new Request(url,{cache:"reload"})))).then(()=>self.skipWaiting())
));
self.addEventListener("activate",event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("homebase-")&&![SHELL_CACHE,RUNTIME_CACHE].includes(key)).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener("fetch",event=>{
 const request=event.request;
 const url=new URL(request.url);
 if(request.method!=="GET")return;
 if(url.origin===self.location.origin && url.pathname.endsWith('/homebase-version.json')){event.respondWith(fetch(new Request(request,{cache:"no-store"})));return}
 if(url.origin===self.location.origin && url.pathname.includes('/beta/')){event.respondWith(fetch(new Request(request,{cache:"no-store"})).catch(()=>caches.match(request)));return}
 if(request.mode==="navigate"){
  event.respondWith((async()=>{
    if(url.searchParams.has('update')){try{return await fetchAndStoreNavigation(request)}catch{const cached=await caches.match("./index.html");return cached?prepareAppHtml(cached):Response.error()}}
    const cached=await caches.match("./index.html");
    if(cached){event.waitUntil(fetchAndStoreNavigation(request).catch(()=>{}));return prepareAppHtml(cached)}
    try{return await fetchAndStoreNavigation(request)}catch{return Response.error()}
  })());return;
 }
 if(url.origin===self.location.origin){
  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached){event.waitUntil(fetch(new Request(request,{cache:"no-store"})).then(response=>caches.open(RUNTIME_CACHE).then(cache=>cache.put(request,response))).catch(()=>{}));return cached}
    try{const response=await fetch(new Request(request,{cache:"no-store"}));const copy=response.clone();caches.open(RUNTIME_CACHE).then(cache=>cache.put(request,copy));return response}catch{return Response.error()}
  })());return;
 }
 event.respondWith(fetch(request).catch(()=>caches.match(request)));
});

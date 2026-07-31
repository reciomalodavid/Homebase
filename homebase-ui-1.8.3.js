(() => {
  "use strict";

  const UI_VERSION = "1.9.2";
  const MONTH_NAMES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  function ensureStylesheet(){
    let link=document.querySelector('link[data-homebase-ui]');
    if(!link){link=document.createElement("link");link.rel="stylesheet";document.head.appendChild(link)}
    link.dataset.homebaseUi=UI_VERSION;
    link.href=`./homebase-ui-1.8.3.css?v=${UI_VERSION}`;

    let fixes=document.querySelector('link[data-homebase-fixes]');
    if(!fixes){fixes=document.createElement("link");fixes.rel="stylesheet";document.head.appendChild(fixes)}
    fixes.dataset.homebaseFixes=UI_VERSION;
    fixes.href=`./homebase-fixes-1.9.2.css?v=${UI_VERSION}`;
  }

  function cleanContinuousCalendar(){
    document.getElementById("continuousMonths")?.remove();
    document.getElementById("calendarTodayFloat")?.remove();
    document.querySelector(".calendar-shell")?.classList.remove("continuous-active");
  }

  function formatCalendarTitle(){
    const title=document.getElementById("periodTitle");
    if(!title||!(state?.month instanceof Date))return;
    title.textContent=`${MONTH_NAMES[state.month.getMonth()]} ${state.month.getFullYear()}`;
  }

  function installCalendarSwipe(){
    const target=document.getElementById("monthView")||document.querySelector(".calendar-shell");
    if(!target||target.dataset.swipeV192==="1")return;
    target.dataset.swipeV192="1";
    let startX=0,startY=0,lastX=0,lastY=0,startTime=0,axis="",tracking=false;
    target.addEventListener("touchstart",event=>{
      if(event.touches.length!==1)return;
      const touch=event.touches[0];startX=lastX=touch.clientX;startY=lastY=touch.clientY;startTime=performance.now();axis="";tracking=true;
    },{passive:true});
    target.addEventListener("touchmove",event=>{
      if(!tracking||event.touches.length!==1)return;
      const touch=event.touches[0];lastX=touch.clientX;lastY=touch.clientY;
      const dx=lastX-startX,dy=lastY-startY;
      if(!axis&&Math.hypot(dx,dy)>=9)axis=Math.abs(dx)>Math.abs(dy)*1.12?"horizontal":"vertical";
      if(axis==="horizontal")event.preventDefault();
    },{passive:false});
    const finish=()=>{
      if(!tracking)return;tracking=false;
      const dx=lastX-startX,dy=lastY-startY,elapsed=performance.now()-startTime;
      const threshold=Math.max(42,Math.min(78,target.clientWidth*.13));
      const valid=axis==="horizontal"&&Math.abs(dx)>=threshold&&Math.abs(dx)>Math.abs(dy)*1.15&&elapsed<950;axis="";
      if(!valid)return;
      const controls=[...document.querySelectorAll(".calendar-top > button")].filter(button=>!button.disabled);
      (dx<0?controls.at(-1):controls[0])?.click();
    };
    target.addEventListener("touchend",finish,{passive:true});
    target.addEventListener("touchcancel",()=>{tracking=false;axis=""},{passive:true});
  }

  function blockAppZoom(){
    ["gesturestart","gesturechange","gestureend"].forEach(type=>document.addEventListener(type,event=>event.preventDefault(),{passive:false}));
  }

  function removeRedundantTopFilter(){
    const actions=[...document.querySelectorAll(".top-actions .icon-btn")];
    if(actions.length<2)return;
    const trash=document.getElementById("trashBadge")?.closest("button");
    const redundant=actions.find(button=>button!==trash);
    if(redundant){redundant.hidden=true;redundant.setAttribute("aria-hidden","true");redundant.tabIndex=-1}
  }

  function normaliseOpenDialog(){
    const open=document.querySelector("dialog[open]");
    if(!open)return;
    open.scrollLeft=0;
    const modal=open.querySelector(".modal");
    if(modal)modal.scrollLeft=0;
  }

  ensureStylesheet();cleanContinuousCalendar();blockAppZoom();removeRedundantTopFilter();

  if(typeof renderMonth==="function"){
    const originalRenderMonth=renderMonth;
    renderMonth=function renderMonthStable(){cleanContinuousCalendar();originalRenderMonth();formatCalendarTitle();installCalendarSwipe()};
  }

  document.addEventListener("click",event=>{
    const nav=event.target.closest?.("[data-page]");
    if(nav?.dataset.page==="calendarPage")requestAnimationFrame(()=>{cleanContinuousCalendar();formatCalendarTitle();installCalendarSwipe()});
    if(event.target.closest?.("#goToday"))requestAnimationFrame(formatCalendarTitle);
    if(event.target.closest?.(".new-btn,#eventFab,[data-open-form]"))setTimeout(normaliseOpenDialog,30);
  },true);

  new MutationObserver(()=>{removeRedundantTopFilter();normaliseOpenDialog()}).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:["open"],childList:true});

  window.HOMEBASE_VERSION=UI_VERSION;
  setTimeout(()=>{cleanContinuousCalendar();formatCalendarTitle();installCalendarSwipe();removeRedundantTopFilter();normaliseOpenDialog()},60);
})();

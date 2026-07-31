(() => {
  "use strict";

  const UI_VERSION = "1.9.0";
  const MONTH_NAMES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  function ensureStylesheet(){
    let link=document.querySelector('link[data-homebase-ui]');
    if(!link){
      link=document.createElement("link");
      link.rel="stylesheet";
      link.dataset.homebaseUi=UI_VERSION;
      link.href=`./homebase-ui-1.8.3.css?v=${UI_VERSION}`;
      document.head.appendChild(link);
    }
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
    if(!target||target.dataset.swipeV190==="1")return;
    target.dataset.swipeV190="1";

    let startX=0,startY=0,lastX=0,lastY=0,startTime=0,axis="",tracking=false;

    target.addEventListener("touchstart",event=>{
      if(event.touches.length!==1)return;
      const touch=event.touches[0];
      startX=lastX=touch.clientX;
      startY=lastY=touch.clientY;
      startTime=performance.now();
      axis="";
      tracking=true;
    },{passive:true});

    target.addEventListener("touchmove",event=>{
      if(!tracking||event.touches.length!==1)return;
      const touch=event.touches[0];
      lastX=touch.clientX;
      lastY=touch.clientY;
      const dx=lastX-startX;
      const dy=lastY-startY;

      if(!axis&&Math.hypot(dx,dy)>=9){
        axis=Math.abs(dx)>Math.abs(dy)*1.12?"horizontal":"vertical";
      }
      if(axis==="horizontal")event.preventDefault();
    },{passive:false});

    const finish=()=>{
      if(!tracking)return;
      tracking=false;
      const dx=lastX-startX;
      const dy=lastY-startY;
      const elapsed=performance.now()-startTime;
      const threshold=Math.max(42,Math.min(78,target.clientWidth*.13));
      const valid=axis==="horizontal"&&Math.abs(dx)>=threshold&&Math.abs(dx)>Math.abs(dy)*1.15&&elapsed<950;
      axis="";
      if(!valid)return;

      const controls=[...document.querySelectorAll(".calendar-top > button")].filter(button=>!button.disabled);
      const previous=controls[0];
      const next=controls[controls.length-1];
      (dx<0?next:previous)?.click();
    };

    target.addEventListener("touchend",finish,{passive:true});
    target.addEventListener("touchcancel",()=>{tracking=false;axis=""},{passive:true});
  }

  function blockAppZoom(){
    document.addEventListener("gesturestart",event=>event.preventDefault(),{passive:false});
    document.addEventListener("gesturechange",event=>event.preventDefault(),{passive:false});
    document.addEventListener("gestureend",event=>event.preventDefault(),{passive:false});
  }

  ensureStylesheet();
  cleanContinuousCalendar();
  blockAppZoom();

  if(typeof renderMonth==="function"){
    const originalRenderMonth=renderMonth;
    renderMonth=function renderMonthStable(){
      cleanContinuousCalendar();
      originalRenderMonth();
      formatCalendarTitle();
      installCalendarSwipe();
    };
  }

  document.addEventListener("click",event=>{
    const nav=event.target.closest?.("[data-page]");
    if(nav?.dataset.page==="calendarPage"){
      cleanContinuousCalendar();
      requestAnimationFrame(()=>{
        formatCalendarTitle();
        installCalendarSwipe();
      });
    }
    if(event.target.closest?.("#goToday"))requestAnimationFrame(formatCalendarTitle);
  },true);

  window.HOMEBASE_VERSION=UI_VERSION;
  setTimeout(()=>{
    cleanContinuousCalendar();
    formatCalendarTitle();
    installCalendarSwipe();
  },60);
})();

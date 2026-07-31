(() => {
  "use strict";

  const UI_VERSION = "1.8.9";
  const MONTH_NAMES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  function injectStyles(){
    let link=document.querySelector('link[data-homebase-ui]');
    if(!link){
      link=document.createElement("link");
      link.rel="stylesheet";
      document.head.appendChild(link);
    }
    link.href=`./homebase-ui-1.8.3.css?v=${UI_VERSION}`;
    link.dataset.homebaseUi=UI_VERSION;
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

  injectStyles();
  cleanContinuousCalendar();

  if(typeof renderMonth==="function"){
    const originalRenderMonth=renderMonth;
    renderMonth=function renderMonthStable(){
      cleanContinuousCalendar();
      originalRenderMonth();
      formatCalendarTitle();
    };
  }

  document.addEventListener("click",event=>{
    const nav=event.target.closest?.("[data-page]");
    if(nav?.dataset.page==="calendarPage"){
      cleanContinuousCalendar();
      requestAnimationFrame(formatCalendarTitle);
    }
    if(event.target.closest?.("#goToday")){
      requestAnimationFrame(formatCalendarTitle);
    }
  },true);

  window.HOMEBASE_VERSION=UI_VERSION;
  setTimeout(()=>{
    cleanContinuousCalendar();
    formatCalendarTitle();
  },80);
})();

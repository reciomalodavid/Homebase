(() => {
  "use strict";

  const UI_VERSION = "1.8.4";
  const MONTHS_BEFORE = 8;
  const MONTHS_AFTER = 16;
  let rebuilding = false;
  let baseRenderMonth = null;

  const monthKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  const monthLabel = d => {
    const x = new Intl.DateTimeFormat("es-ES",{month:"long",year:"numeric"}).format(d);
    return x.charAt(0).toUpperCase()+x.slice(1);
  };
  const addMonths = (d,n) => new Date(d.getFullYear(),d.getMonth()+n,1);

  function injectStyles(){
    let link=document.querySelector('link[data-homebase-ui]');
    if(!link){link=document.createElement("link");link.rel="stylesheet";document.head.appendChild(link)}
    link.href=`./homebase-ui-1.8.3.css?v=${UI_VERSION}`;
    link.dataset.homebaseUi=UI_VERSION;
  }

  function ensureTodayButton(){
    let btn=document.getElementById("calendarTodayFloat");
    if(btn)return btn;
    btn=document.createElement("button");
    btn.id="calendarTodayFloat";
    btn.className="calendar-today-float";
    btn.type="button";
    btn.textContent="Hoy";
    btn.hidden=true;
    document.body.appendChild(btn);
    btn.addEventListener("click",()=>goToday(true));
    return btn;
  }

  function calendarVisible(){return !!document.getElementById("calendarPage")?.classList.contains("active")}

  function goToday(smooth){
    if(!baseRenderMonth)return;
    const now=new Date();
    state.month=new Date(now.getFullYear(),now.getMonth(),1);
    state.selectedDate=iso(now);
    renderContinuous(true);
    requestAnimationFrame(()=>{
      document.querySelector(`.continuous-month[data-month="${monthKey(now)}"]`)?.scrollIntoView({behavior:smooth?"smooth":"auto",block:"start"});
      if(!smooth)window.scrollBy(0,-150);
    });
  }

  function wireDays(section){
    section.querySelectorAll(".day[data-date]").forEach(btn=>{
      btn.onclick=e=>{
        e.preventDefault();e.stopPropagation();
        const dateIso=btn.dataset.date;if(!dateIso)return;
        const d=parseDate(dateIso);
        state.selectedDate=dateIso;
        state.month=new Date(d.getFullYear(),d.getMonth(),1);
        baseRenderMonth();
        renderSelectedDay?.();
        section.querySelectorAll(".day.selected").forEach(x=>x.classList.remove("selected"));
        btn.classList.add("selected");
      };
    });
  }

  function updateHeader(){
    const sections=[...document.querySelectorAll(".continuous-month")];
    if(!sections.length)return;
    const anchor=155;
    let best=sections[0],dist=Infinity;
    for(const section of sections){
      const r=section.getBoundingClientRect();
      if(r.bottom<anchor)continue;
      const d=Math.abs(r.top-anchor);
      if(d<dist){dist=d;best=section}
    }
    const title=document.getElementById("periodTitle");
    if(title)title.textContent=best.dataset.label||"Calendario";
  }

  function renderContinuous(forceToday=false){
    if(rebuilding||state.mode!=="month"||!baseRenderMonth)return;
    const grid=document.getElementById("monthGrid"),weekdays=document.getElementById("weekdays");
    const shell=grid?.closest(".calendar-shell");
    if(!grid||!weekdays||!shell)return;

    rebuilding=true;
    shell.classList.remove("continuous-active");
    let stack=document.getElementById("continuousMonths");
    if(!stack){stack=document.createElement("div");stack.id="continuousMonths";stack.className="continuous-months";grid.after(stack)}

    const now=new Date();
    const anchorMonth=forceToday?new Date(now.getFullYear(),now.getMonth(),1):new Date(state.month.getFullYear(),state.month.getMonth(),1);
    const savedMonth=new Date(state.month);
    const fragment=document.createDocumentFragment();

    try{
      stack.innerHTML="";
      for(let offset=-MONTHS_BEFORE;offset<=MONTHS_AFTER;offset++){
        const month=addMonths(anchorMonth,offset);
        state.month=month;
        baseRenderMonth();
        const section=document.createElement("section");
        section.className="continuous-month";
        section.dataset.month=monthKey(month);
        section.dataset.label=monthLabel(month);
        if(section.dataset.month===monthKey(now))section.classList.add("is-current");
        section.innerHTML=`<h2 class="continuous-month-title">${section.dataset.label}</h2><div class="weekdays">${weekdays.innerHTML}</div><div class="month-grid">${grid.innerHTML}</div>`;
        wireDays(section);
        fragment.appendChild(section);
      }
      stack.appendChild(fragment);
      shell.classList.add("continuous-active");
    }catch(error){
      console.error("Calendario continuo",error);
      stack.innerHTML="";
      shell.classList.remove("continuous-active");
    }finally{
      state.month=savedMonth;
      baseRenderMonth();
      rebuilding=false;
    }

    updateHeader();
    ensureTodayButton().hidden=!calendarVisible();
  }

  injectStyles();
  ensureTodayButton();
  if(typeof renderMonth!=="function")return;
  baseRenderMonth=renderMonth;
  renderMonth=function(){
    baseRenderMonth();
    if(state.mode==="month")queueMicrotask(()=>renderContinuous(false));
  };

  document.addEventListener("click",e=>{
    const nav=e.target.closest?.("[data-page]");
    if(nav?.dataset.page==="calendarPage"){
      setTimeout(()=>goToday(false),40);
    }else if(nav){
      ensureTodayButton().hidden=true;
    }
    if(e.target.closest?.("#todayJump"))setTimeout(()=>goToday(true),0);
  });

  let ticking=false;
  window.addEventListener("scroll",()=>{
    if(ticking||!calendarVisible())return;
    ticking=true;
    requestAnimationFrame(()=>{updateHeader();ticking=false});
  },{passive:true});

  window.HOMEBASE_VERSION=UI_VERSION;
  setTimeout(()=>{if(state.mode==="month"&&calendarVisible())goToday(false)},120);
})();

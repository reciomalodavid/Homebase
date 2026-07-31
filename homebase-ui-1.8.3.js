(() => {
  "use strict";

  const UI_VERSION = "1.8.5";
  const MONTHS_BEFORE = 8;
  const MONTHS_AFTER = 16;
  let rebuilding = false;
  let baseRenderMonth = null;
  let pendingScrollDate = null;

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

  function calendarVisible(){return !!document.getElementById("calendarPage")?.classList.contains("active")}

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

  function scrollToDate(dateIso,smooth=false){
    const target=document.querySelector(`.continuous-month .day[data-date="${dateIso}"]`);
    if(!target)return;
    target.scrollIntoView({behavior:smooth?"smooth":"auto",block:"center"});
  }

  function goToday(smooth){
    const now=new Date();
    state.month=new Date(now.getFullYear(),now.getMonth(),1);
    state.selectedDate=iso(now);
    pendingScrollDate=state.selectedDate;
    renderContinuous();
    requestAnimationFrame(()=>scrollToDate(state.selectedDate,smooth));
  }

  function wireDays(section){
    section.querySelectorAll(".day[data-date]").forEach(btn=>{
      btn.addEventListener("click",e=>{
        e.preventDefault();
        e.stopPropagation();
        const dateIso=btn.dataset.date;
        if(!dateIso)return;
        const d=parseDate(dateIso);
        state.selectedDate=dateIso;
        state.month=new Date(d.getFullYear(),d.getMonth(),1);
        pendingScrollDate=dateIso;

        // Usa el render normal de Homebase para actualizar el detalle del día,
        // y después reconstruye la tira continua conservando la posición.
        render();
        requestAnimationFrame(()=>scrollToDate(dateIso,false));
      },{passive:false});
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

  function renderContinuous(){
    if(rebuilding||state.mode!=="month"||!baseRenderMonth)return;
    const grid=document.getElementById("monthGrid");
    const weekdays=document.getElementById("weekdays");
    const shell=grid?.closest(".calendar-shell");
    if(!grid||!weekdays||!shell)return;

    rebuilding=true;
    const now=new Date();
    const anchorMonth=new Date(now.getFullYear(),now.getMonth(),1);
    const savedMonth=new Date(state.month);
    const savedTitle=document.getElementById("periodTitle")?.textContent||"";
    let stack=document.getElementById("continuousMonths");
    if(!stack){
      stack=document.createElement("div");
      stack.id="continuousMonths";
      stack.className="continuous-months";
      grid.insertAdjacentElement("afterend",stack);
    }

    const fragment=document.createDocumentFragment();
    try{
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

      stack.replaceChildren(fragment);
      shell.classList.add("continuous-active");
    }catch(error){
      console.error("Calendario continuo",error);
      shell.classList.remove("continuous-active");
    }finally{
      state.month=savedMonth;
      baseRenderMonth();
      const title=document.getElementById("periodTitle");
      if(title&&savedTitle)title.textContent=savedTitle;
      rebuilding=false;
    }

    ensureTodayButton().hidden=!calendarVisible();
    updateHeader();

    const targetDate=pendingScrollDate;
    pendingScrollDate=null;
    if(targetDate)requestAnimationFrame(()=>scrollToDate(targetDate,false));
  }

  injectStyles();
  ensureTodayButton();
  if(typeof renderMonth!=="function")return;
  baseRenderMonth=renderMonth;

  renderMonth=function renderMonthContinuous(){
    baseRenderMonth();
    if(state.mode==="month"&&!rebuilding)queueMicrotask(renderContinuous);
  };

  document.addEventListener("click",e=>{
    const nav=e.target.closest?.("[data-page]");
    if(nav?.dataset.page==="calendarPage"){
      const now=new Date();
      state.month=new Date(now.getFullYear(),now.getMonth(),1);
      pendingScrollDate=iso(now);
      setTimeout(renderContinuous,50);
      ensureTodayButton().hidden=false;
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
  setTimeout(()=>{
    if(state.mode==="month"&&calendarVisible())goToday(false);
  },120);
})();

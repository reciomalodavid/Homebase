(() => {
  "use strict";

  const UI_VERSION = "1.8.6";
  const MONTHS_BEFORE = 18;
  const MONTHS_AFTER = 24;
  const MONTH_NAMES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  let baseRenderMonth = null;
  let building = false;
  let scrollTick = false;
  let requestedScrollKey = null;

  const monthKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  const monthLabel = d => `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  const addMonths = (d,n) => new Date(d.getFullYear(),d.getMonth()+n,1);
  const currentMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(),now.getMonth(),1);
  };

  function calendarVisible(){
    return !!document.getElementById("calendarPage")?.classList.contains("active");
  }

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

  function ensureTodayButton(){
    let button=document.getElementById("calendarTodayFloat");
    if(button)return button;
    button=document.createElement("button");
    button.id="calendarTodayFloat";
    button.className="calendar-today-float";
    button.type="button";
    button.textContent="Hoy";
    button.hidden=true;
    document.body.appendChild(button);
    button.addEventListener("click",()=>goToday(true));
    return button;
  }

  function ensureStack(){
    const grid=document.getElementById("monthGrid");
    if(!grid)return null;
    let stack=document.getElementById("continuousMonths");
    if(!stack){
      stack=document.createElement("div");
      stack.id="continuousMonths";
      stack.className="continuous-months";
      grid.insertAdjacentElement("afterend",stack);
    }
    grid.closest(".calendar-shell")?.classList.add("continuous-active");
    return stack;
  }

  function renderSelectedDayPanel(dateIso){
    const panel=document.getElementById("selectedDayPanel");
    if(!panel)return;
    const date=parseDate(dateIso);
    const events=eventsOn(dateIso);
    panel.innerHTML=`<div class="section-head"><h2>${fmtDate(date)}</h2><span>${events.length}</span></div><div class="card list-card">${events.length?events.map(item=>eventRow(item,dateIso)).join(""):`<div class="empty"><strong>Sin eventos</strong>Pulsa Nuevo para añadir uno.</div>`}</div>`;
    bindDynamic();
  }

  function selectDay(button){
    const dateIso=button?.dataset?.day;
    if(!dateIso)return;
    state.selectedDate=parseDate(dateIso);
    document.querySelectorAll("#continuousMonths .day.selected").forEach(day=>day.classList.remove("selected"));
    document.querySelectorAll(`#continuousMonths .day[data-day="${dateIso}"]`).forEach(day=>day.classList.add("selected"));
    renderSelectedDayPanel(dateIso);
  }

  function bindContinuousInteractions(stack){
    stack.onclick=event=>{
      const day=event.target.closest?.(".day[data-day]");
      if(!day||!stack.contains(day))return;
      event.preventDefault();
      event.stopPropagation();
      selectDay(day);
    };
  }

  function visibleMonthKey(){
    const sections=[...document.querySelectorAll("#continuousMonths .continuous-month")];
    if(!sections.length)return monthKey(currentMonth());
    const anchor=Math.max(145,window.innerHeight*.18);
    let best=sections[0],distance=Infinity;
    for(const section of sections){
      const rect=section.getBoundingClientRect();
      if(rect.bottom<=anchor)continue;
      const next=Math.abs(rect.top-anchor);
      if(next<distance){best=section;distance=next;}
    }
    return best.dataset.month||monthKey(currentMonth());
  }

  function updateHeader(){
    const key=visibleMonthKey();
    const section=document.querySelector(`#continuousMonths .continuous-month[data-month="${key}"]`);
    const title=document.getElementById("periodTitle");
    if(title)title.textContent=section?.dataset.label||monthLabel(currentMonth());
  }

  function scrollToMonth(key,smooth=false){
    const target=document.querySelector(`#continuousMonths .continuous-month[data-month="${key}"]`);
    if(!target)return;
    target.scrollIntoView({behavior:smooth?"smooth":"auto",block:"start"});
    if(!smooth)window.scrollBy(0,-150);
    requestAnimationFrame(updateHeader);
  }

  function buildContinuousMonths({scrollKey=null,preservePosition=false}={}){
    if(building||!baseRenderMonth||state.mode!=="month")return;
    const sourceGrid=document.getElementById("monthGrid");
    const sourceWeekdays=document.getElementById("weekdays");
    const shell=sourceGrid?.closest(".calendar-shell");
    const stack=ensureStack();
    if(!sourceGrid||!sourceWeekdays||!shell||!stack)return;

    building=true;
    const savedMonth=new Date(state.month);
    const savedSelected=state.selectedDate?new Date(state.selectedDate):null;
    const anchor=currentMonth();
    const keepKey=scrollKey||requestedScrollKey||(preservePosition?visibleMonthKey():monthKey(anchor));
    requestedScrollKey=null;
    const fragment=document.createDocumentFragment();

    try{
      for(let offset=-MONTHS_BEFORE;offset<=MONTHS_AFTER;offset++){
        const month=addMonths(anchor,offset);
        state.month=month;
        baseRenderMonth();

        const section=document.createElement("section");
        section.className="continuous-month";
        section.dataset.month=monthKey(month);
        section.dataset.label=monthLabel(month);
        if(section.dataset.month===monthKey(anchor))section.classList.add("is-current");
        section.innerHTML=`<h2 class="continuous-month-title">${section.dataset.label}</h2><div class="weekdays">${sourceWeekdays.innerHTML}</div><div class="month-grid">${sourceGrid.innerHTML}</div>`;
        fragment.appendChild(section);
      }
      stack.replaceChildren(fragment);
      bindContinuousInteractions(stack);
      shell.classList.add("continuous-active");
    }catch(error){
      console.error("Homebase calendario continuo",error);
      stack.replaceChildren();
      shell.classList.remove("continuous-active");
    }finally{
      state.month=savedMonth;
      state.selectedDate=savedSelected;
      baseRenderMonth();
      building=false;
    }

    requestAnimationFrame(()=>scrollToMonth(keepKey,false));
    ensureTodayButton().hidden=!calendarVisible();
  }

  function goToday(smooth){
    const today=currentMonth();
    const todayIso=iso(new Date());
    state.month=today;
    state.selectedDate=parseDate(todayIso);
    requestedScrollKey=monthKey(today);
    if(!document.getElementById("continuousMonths")?.children.length){
      buildContinuousMonths({scrollKey:requestedScrollKey});
    }else{
      document.querySelectorAll("#continuousMonths .day.selected").forEach(day=>day.classList.remove("selected"));
      document.querySelectorAll(`#continuousMonths .day[data-day="${todayIso}"]`).forEach(day=>day.classList.add("selected"));
      renderSelectedDayPanel(todayIso);
      scrollToMonth(monthKey(today),smooth);
    }
  }

  injectStyles();
  ensureTodayButton();
  if(typeof renderMonth!=="function")return;

  baseRenderMonth=renderMonth;
  renderMonth=function renderMonthContinuous(){
    baseRenderMonth();
    if(state.mode==="month"&&!building){
      queueMicrotask(()=>buildContinuousMonths({preservePosition:true}));
    }
  };

  document.addEventListener("click",event=>{
    const nav=event.target.closest?.("[data-page]");
    if(nav?.dataset.page==="calendarPage"){
      requestedScrollKey=monthKey(currentMonth());
      state.month=currentMonth();
      ensureTodayButton().hidden=false;
      setTimeout(()=>buildContinuousMonths({scrollKey:requestedScrollKey}),30);
    }else if(nav){
      ensureTodayButton().hidden=true;
    }
    if(event.target.closest?.("#goToday")){
      event.preventDefault();
      setTimeout(()=>goToday(true),0);
    }
  },true);

  window.addEventListener("scroll",()=>{
    if(scrollTick||!calendarVisible())return;
    scrollTick=true;
    requestAnimationFrame(()=>{
      updateHeader();
      scrollTick=false;
    });
  },{passive:true});

  window.HOMEBASE_VERSION=UI_VERSION;
  setTimeout(()=>{
    if(calendarVisible()&&state.mode==="month"){
      state.month=currentMonth();
      buildContinuousMonths({scrollKey:monthKey(currentMonth())});
    }
  },100);
})();

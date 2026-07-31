(() => {
  "use strict";

  const UI_VERSION = "1.8.7";
  const MONTHS_BEFORE = 12;
  const MONTHS_AFTER = 18;
  const MONTH_NAMES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  let baseRenderMonth = null;
  let building = false;
  let scrollTick = false;
  let initialised = false;

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

  function selectedDateIso(){
    if(!state.selectedDate)return "";
    try{return iso(state.selectedDate)}catch{return ""}
  }

  function renderSectionDetails(section,dateIso){
    const panel=section.querySelector(".continuous-day-detail");
    if(!panel)return;
    const date=parseDate(dateIso);
    const items=eventsOn(dateIso);
    panel.hidden=false;
    panel.innerHTML=`<div class="section-head"><h2>${fmtDate(date)}</h2><span>${items.length}</span></div><div class="card list-card">${items.length?items.map(item=>eventRow(item,dateIso)).join(""):`<div class="empty"><strong>Sin eventos</strong>Pulsa Nuevo para añadir uno.</div>`}</div>`;
  }

  function selectDay(button){
    const dateIso=button?.dataset?.continuousDay;
    if(!dateIso)return;
    const section=button.closest(".continuous-month");
    state.selectedDate=parseDate(dateIso);
    document.querySelectorAll("#continuousMonths .day.selected").forEach(day=>day.classList.remove("selected"));
    button.classList.add("selected");
    document.querySelectorAll("#continuousMonths .continuous-day-detail").forEach(panel=>{panel.hidden=true;panel.innerHTML=""});
    renderSectionDetails(section,dateIso);
    requestAnimationFrame(()=>section.querySelector(".continuous-day-detail")?.scrollIntoView({behavior:"smooth",block:"nearest"}));
  }

  function bindStack(stack){
    stack.onclick=event=>{
      const deleteButton=event.target.closest?.("[data-delete]");
      if(deleteButton){
        event.preventDefault();event.stopPropagation();
        const item=state.items.find(x=>x.id===deleteButton.dataset.delete);
        if(item)confirmDelete(item,deleteButton.dataset.date);
        return;
      }
      const row=event.target.closest?.("[data-id]");
      if(row){
        event.preventDefault();event.stopPropagation();
        openDetail(row.dataset.id,row.dataset.date);
        return;
      }
      const day=event.target.closest?.(".day[data-continuous-day]");
      if(day&&stack.contains(day)){
        event.preventDefault();event.stopPropagation();
        selectDay(day);
      }
    };
  }

  function visibleMonthSection(){
    const sections=[...document.querySelectorAll("#continuousMonths .continuous-month")];
    if(!sections.length)return null;
    const anchor=155;
    let best=null;
    let distance=Infinity;
    for(const section of sections){
      const rect=section.getBoundingClientRect();
      if(rect.bottom<=anchor)continue;
      const next=Math.abs(rect.top-anchor);
      if(next<distance){best=section;distance=next}
    }
    return best||sections[0];
  }

  function updateHeader(){
    const section=visibleMonthSection();
    const title=document.getElementById("periodTitle");
    if(title)title.textContent=section?.dataset.label||monthLabel(currentMonth());
  }

  function absoluteTop(element){
    return element.getBoundingClientRect().top+window.scrollY;
  }

  function scrollToMonth(key,smooth=false){
    const target=document.querySelector(`#continuousMonths .continuous-month[data-month="${key}"]`);
    if(!target)return false;
    const top=Math.max(0,absoluteTop(target)-145);
    window.scrollTo({top,behavior:smooth?"smooth":"auto"});
    requestAnimationFrame(updateHeader);
    return true;
  }

  function forceScrollToMonth(key,smooth=false){
    let attempts=0;
    const run=()=>{
      attempts++;
      const ok=scrollToMonth(key,smooth&&attempts===1);
      if((!ok||attempts<4)&&attempts<5)setTimeout(run,attempts*90);
    };
    requestAnimationFrame(()=>requestAnimationFrame(run));
  }

  function cloneMonthMarkup(sourceGrid){
    return sourceGrid.innerHTML
      .replaceAll("data-day=", "data-continuous-day=")
      .replaceAll("data-day\u003d", "data-continuous-day\u003d");
  }

  function buildContinuousMonths(){
    if(building||!baseRenderMonth||state.mode!=="month")return;
    const sourceGrid=document.getElementById("monthGrid");
    const sourceWeekdays=document.getElementById("weekdays");
    const shell=sourceGrid?.closest(".calendar-shell");
    const stack=ensureStack();
    if(!sourceGrid||!sourceWeekdays||!shell||!stack)return;

    building=true;
    const savedMonth=new Date(state.month);
    const savedSelected=state.selectedDate;
    const anchor=currentMonth();
    const selectedIso=selectedDateIso();
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
        section.innerHTML=`<h2 class="continuous-month-title">${section.dataset.label}</h2><div class="weekdays">${sourceWeekdays.innerHTML}</div><div class="month-grid">${cloneMonthMarkup(sourceGrid)}</div><div class="continuous-day-detail" hidden></div>`;
        fragment.appendChild(section);
      }
      stack.replaceChildren(fragment);
      bindStack(stack);
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

    if(selectedIso){
      const selectedButton=stack.querySelector(`[data-continuous-day="${selectedIso}"]`);
      selectedButton?.classList.add("selected");
    }
    ensureTodayButton().hidden=!calendarVisible();
  }

  function enterCalendar(){
    state.month=currentMonth();
    buildContinuousMonths();
    const key=monthKey(currentMonth());
    forceScrollToMonth(key,false);
    const title=document.getElementById("periodTitle");
    if(title)title.textContent=monthLabel(currentMonth());
    ensureTodayButton().hidden=false;
    initialised=true;
  }

  function goToday(smooth){
    const now=new Date();
    const dateIso=iso(now);
    state.month=currentMonth();
    state.selectedDate=parseDate(dateIso);
    if(!document.getElementById("continuousMonths")?.children.length)buildContinuousMonths();
    document.querySelectorAll("#continuousMonths .day.selected").forEach(day=>day.classList.remove("selected"));
    const button=document.querySelector(`#continuousMonths [data-continuous-day="${dateIso}"]`);
    if(button)button.classList.add("selected");
    forceScrollToMonth(monthKey(currentMonth()),smooth);
    const title=document.getElementById("periodTitle");
    if(title)title.textContent=monthLabel(currentMonth());
  }

  injectStyles();
  ensureTodayButton();
  if(typeof renderMonth!=="function")return;
  baseRenderMonth=renderMonth;

  renderMonth=function renderMonthContinuous(){
    baseRenderMonth();
    if(state.mode==="month"&&!building&&calendarVisible()&&!document.getElementById("continuousMonths")?.children.length){
      queueMicrotask(buildContinuousMonths);
    }
  };

  document.addEventListener("click",event=>{
    const nav=event.target.closest?.("[data-page]");
    if(nav?.dataset.page==="calendarPage"){
      setTimeout(enterCalendar,80);
      setTimeout(()=>forceScrollToMonth(monthKey(currentMonth()),false),350);
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
    requestAnimationFrame(()=>{updateHeader();scrollTick=false});
  },{passive:true});

  window.HOMEBASE_VERSION=UI_VERSION;
  setTimeout(()=>{
    if(calendarVisible()&&state.mode==="month")enterCalendar();
  },180);
})();

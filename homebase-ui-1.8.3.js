(() => {
  "use strict";

  const UI_VERSION = "1.8.8";
  const MONTHS_AFTER = 18;
  const MONTH_NAMES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  let baseRenderMonth = null;
  let building = false;
  let scrollTick = false;

  const monthKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  const monthLabel = d => `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  const addMonths = (d,n) => new Date(d.getFullYear(),d.getMonth()+n,1);
  const currentMonth = () => { const n=new Date(); return new Date(n.getFullYear(),n.getMonth(),1); };

  function calendarVisible(){
    return !!document.getElementById("calendarPage")?.classList.contains("active");
  }

  function injectStyles(){
    let link=document.querySelector('link[data-homebase-ui]');
    if(!link){ link=document.createElement("link"); link.rel="stylesheet"; document.head.appendChild(link); }
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
    button.addEventListener("click",goToday);
    return button;
  }

  function ensureDetailSheet(){
    let sheet=document.getElementById("calendarDaySheet");
    if(sheet)return sheet;
    sheet=document.createElement("div");
    sheet.id="calendarDaySheet";
    sheet.className="calendar-day-sheet";
    sheet.hidden=true;
    sheet.innerHTML='<div class="calendar-day-sheet-handle"></div><button class="calendar-day-sheet-close" type="button" aria-label="Cerrar">×</button><div class="calendar-day-sheet-content"></div>';
    document.body.appendChild(sheet);
    sheet.querySelector(".calendar-day-sheet-close").addEventListener("click",()=>{sheet.hidden=true});
    return sheet;
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

  function cloneMonthMarkup(sourceGrid){
    return sourceGrid.innerHTML.replaceAll("data-day=", "data-continuous-day=");
  }

  function showDay(dateIso,button){
    const sheet=ensureDetailSheet();
    const date=parseDate(dateIso);
    const items=eventsOn(dateIso);
    state.selectedDate=date;
    document.querySelectorAll("#continuousMonths .day.selected").forEach(day=>day.classList.remove("selected"));
    button?.classList.add("selected");
    const content=sheet.querySelector(".calendar-day-sheet-content");
    content.innerHTML=`<div class="section-head"><h2>${fmtDate(date)}</h2><span>${items.length}</span></div><div class="card list-card">${items.length?items.map(item=>eventRow(item,dateIso)).join(""):`<div class="empty"><strong>Sin eventos</strong>Pulsa Nuevo para añadir uno.</div>`}</div>`;
    sheet.hidden=false;
    sheet.querySelectorAll("[data-id]").forEach(row=>row.onclick=()=>openDetail(row.dataset.id,row.dataset.date));
    sheet.querySelectorAll("[data-delete]").forEach(btn=>btn.onclick=e=>{e.stopPropagation();const item=state.items.find(x=>x.id===btn.dataset.delete);if(item)confirmDelete(item,btn.dataset.date)});
  }

  function bindStack(stack){
    stack.onclick=event=>{
      const day=event.target.closest?.(".day[data-continuous-day]");
      if(!day||!stack.contains(day))return;
      event.preventDefault();
      event.stopPropagation();
      showDay(day.dataset.continuousDay,day);
    };
  }

  function visibleMonthSection(){
    const sections=[...document.querySelectorAll("#continuousMonths .continuous-month")];
    if(!sections.length)return null;
    const anchor=160;
    return sections.find(section=>section.getBoundingClientRect().bottom>anchor)||sections[0];
  }

  function updateHeader(){
    const section=visibleMonthSection();
    const title=document.getElementById("periodTitle");
    if(title)title.textContent=section?.dataset.label||monthLabel(currentMonth());
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
    const fragment=document.createDocumentFragment();

    try{
      for(let offset=0;offset<=MONTHS_AFTER;offset++){
        const month=addMonths(anchor,offset);
        state.month=month;
        baseRenderMonth();
        const section=document.createElement("section");
        section.className="continuous-month";
        section.dataset.month=monthKey(month);
        section.dataset.label=monthLabel(month);
        if(offset===0)section.classList.add("is-current");
        section.innerHTML=`<h2 class="continuous-month-title">${section.dataset.label}</h2><div class="weekdays">${sourceWeekdays.innerHTML}</div><div class="month-grid">${cloneMonthMarkup(sourceGrid)}</div>`;
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

    const title=document.getElementById("periodTitle");
    if(title)title.textContent=monthLabel(anchor);
    ensureTodayButton().hidden=!calendarVisible();
  }

  function enterCalendar(){
    state.month=currentMonth();
    buildContinuousMonths();
    ensureTodayButton().hidden=false;
    ensureDetailSheet().hidden=true;
    const title=document.getElementById("periodTitle");
    if(title)title.textContent=monthLabel(currentMonth());
  }

  function goToday(){
    const current=document.querySelector(`#continuousMonths .continuous-month[data-month="${monthKey(currentMonth())}"]`);
    if(current){
      const top=Math.max(0,current.getBoundingClientRect().top+window.scrollY-145);
      window.scrollTo({top,behavior:"smooth"});
    }
    const title=document.getElementById("periodTitle");
    if(title)title.textContent=monthLabel(currentMonth());
  }

  injectStyles();
  ensureTodayButton();
  ensureDetailSheet();
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
    if(nav?.dataset.page==="calendarPage")setTimeout(enterCalendar,40);
    else if(nav){ensureTodayButton().hidden=true;ensureDetailSheet().hidden=true;}
    if(event.target.closest?.("#goToday")){event.preventDefault();goToday();}
  },true);

  window.addEventListener("scroll",()=>{
    if(scrollTick||!calendarVisible())return;
    scrollTick=true;
    requestAnimationFrame(()=>{updateHeader();scrollTick=false});
  },{passive:true});

  window.HOMEBASE_VERSION=UI_VERSION;
  setTimeout(()=>{if(calendarVisible()&&state.mode==="month")enterCalendar()},120);
})();

(()=>{
  'use strict';

  const MONTHS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  let selectedMonth=new Date().getMonth();
  let selectedYear=new Date().getFullYear();

  function ensureStyles(){
    if(document.getElementById('hb-calendar-jump-style'))return;
    const style=document.createElement('style');
    style.id='hb-calendar-jump-style';
    style.textContent=`
      .calendar-title.hb-jump-ready{display:inline-flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;user-select:none;padding:8px 12px;border-radius:14px;transition:.18s ease}
      .calendar-title.hb-jump-ready:active{background:color-mix(in srgb,var(--accent,#d9781f) 10%,transparent);transform:scale(.98)}
      .calendar-title.hb-jump-ready::after{content:'▦';font-size:21px;color:var(--accent,#d9781f);opacity:.95}
      .hb-calendar-jump{border:0;padding:0;width:min(94vw,520px);max-height:88vh;border-radius:28px;background:var(--surface,#fff);color:var(--text,#182230);box-shadow:0 24px 70px rgba(0,0,0,.25)}
      .hb-calendar-jump::backdrop{background:rgba(9,15,24,.55);backdrop-filter:blur(10px)}
      .hb-calendar-jump-card{padding:24px}
      .hb-calendar-jump-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px}
      .hb-calendar-jump-card h3{margin:0 0 5px;font-size:28px;letter-spacing:-.5px}.hb-calendar-jump-card p{margin:0;color:var(--muted,#7e8793);font-size:14px}
      .hb-jump-close{width:44px;height:44px;border:0;border-radius:50%;background:var(--surface-2,#eef1f4);color:var(--text,#182230);font-size:24px}
      .hb-jump-year{display:grid;grid-template-columns:52px 1fr 52px;align-items:center;gap:10px;margin:10px 0 18px}
      .hb-jump-year button{height:48px;border:1px solid var(--line,#ddd);border-radius:14px;background:var(--surface-2,#f5f5f5);color:var(--text,#182230);font-size:25px;font-weight:800}
      .hb-jump-year input{height:52px;width:100%;box-sizing:border-box;text-align:center;padding:8px;border:1px solid var(--line,#ddd);border-radius:15px;background:var(--surface-2,#f5f5f5);color:var(--text,#182230);font-size:24px;font-weight:900}
      .hb-jump-months{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .hb-jump-month{min-height:54px;border:1px solid var(--line,#ddd);border-radius:14px;background:var(--surface-2,#f5f5f5);color:var(--text,#182230);font-size:15px;font-weight:800;text-transform:capitalize}
      .hb-jump-month.selected{background:var(--accent,#d9781f);border-color:var(--accent,#d9781f);color:#fff;box-shadow:0 7px 18px color-mix(in srgb,var(--accent,#d9781f) 28%,transparent)}
      .hb-calendar-jump-actions{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:20px}
      .hb-calendar-jump-actions button{border:0;border-radius:14px;padding:14px;font-size:16px;font-weight:850}.hb-jump-today{background:var(--surface-2,#eef1f4);color:var(--text,#182230)}.hb-jump-go{background:var(--accent,#d9781f);color:#fff}
      @media(max-width:420px){.hb-calendar-jump-card{padding:20px}.hb-jump-months{grid-template-columns:repeat(2,1fr)}.hb-jump-month{min-height:50px}.hb-calendar-jump{max-height:92vh;overflow:auto}}
    `;
    document.head.appendChild(style);
  }

  function normalize(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}

  function currentMonth(){
    const text=document.querySelector('.calendar-title')?.textContent?.trim()||'';
    const match=normalize(text).match(/([a-z]+)\s+(\d{4})/i);
    if(!match)return null;
    const month=MONTHS.indexOf(match[1]);
    return month<0?null:{year:Number(match[2]),month};
  }

  function renderSelection(dialog){
    dialog.querySelector('[name="targetYear"]').value=String(selectedYear);
    dialog.querySelectorAll('.hb-jump-month').forEach((button,index)=>button.classList.toggle('selected',index===selectedMonth));
  }

  function ensureDialog(){
    let dialog=document.getElementById('hbCalendarJump');
    if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.id='hbCalendarJump';
    dialog.className='hb-calendar-jump';
    dialog.innerHTML=`<div class="hb-calendar-jump-card">
      <div class="hb-calendar-jump-head"><div><h3>Ir a mes y año</h3><p>Salta directamente, incluso varios años adelante.</p></div><button type="button" class="hb-jump-close" aria-label="Cerrar">×</button></div>
      <div class="hb-jump-year"><button type="button" data-year-step="-1">‹</button><input name="targetYear" type="number" min="1900" max="2200" inputmode="numeric" aria-label="Año"><button type="button" data-year-step="1">›</button></div>
      <div class="hb-jump-months">${MONTHS.map((month,index)=>`<button type="button" class="hb-jump-month" data-month="${index}">${month}</button>`).join('')}</div>
      <div class="hb-calendar-jump-actions"><button type="button" class="hb-jump-today">Hoy</button><button type="button" class="hb-jump-go">Ir a la fecha</button></div>
    </div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('.hb-jump-close').addEventListener('click',()=>dialog.close());
    dialog.querySelectorAll('[data-year-step]').forEach(button=>button.addEventListener('click',()=>{
      selectedYear=Math.max(1900,Math.min(2200,selectedYear+Number(button.dataset.yearStep)));
      renderSelection(dialog);
    }));
    dialog.querySelector('[name="targetYear"]').addEventListener('change',event=>{
      selectedYear=Math.max(1900,Math.min(2200,Number(event.target.value)||new Date().getFullYear()));
      renderSelection(dialog);
    });
    dialog.querySelectorAll('[data-month]').forEach(button=>button.addEventListener('click',()=>{
      selectedMonth=Number(button.dataset.month);
      renderSelection(dialog);
    }));
    dialog.querySelector('.hb-jump-today').addEventListener('click',()=>{
      const now=new Date();selectedMonth=now.getMonth();selectedYear=now.getFullYear();renderSelection(dialog);jumpTo(selectedYear,selectedMonth);dialog.close();
    });
    dialog.querySelector('.hb-jump-go').addEventListener('click',()=>{jumpTo(selectedYear,selectedMonth);dialog.close()});
    return dialog;
  }

  function jumpTo(year,month){
    const current=currentMonth();
    if(!current)return;
    let delta=(year-current.year)*12+(month-current.month);
    if(!delta)return;
    const buttons=document.querySelectorAll('.calendar-top>button');
    const button=delta>0?buttons[buttons.length-1]:buttons[0];
    if(!button)return;
    let remaining=Math.min(Math.abs(delta),2400);
    const step=()=>{
      const amount=Math.min(remaining,12);
      for(let i=0;i<amount;i++)button.click();
      remaining-=amount;
      if(remaining>0)requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function enhance(){
    ensureStyles();
    const title=document.querySelector('.calendar-title');
    if(!title||title.dataset.jumpReady==='1')return;
    title.dataset.jumpReady='1';title.classList.add('hb-jump-ready');title.setAttribute('role','button');title.setAttribute('tabindex','0');title.setAttribute('aria-label','Elegir mes y año');
    const open=()=>{
      const current=currentMonth()||{year:new Date().getFullYear(),month:new Date().getMonth()};
      selectedYear=current.year;selectedMonth=current.month;
      const dialog=ensureDialog();renderSelection(dialog);dialog.showModal();
    };
    title.addEventListener('click',open);
    title.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open()}});
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));
  function init(){enhance();observer.observe(document.documentElement,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
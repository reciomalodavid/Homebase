(()=>{
  'use strict';

  const MONTHS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  function ensureStyles(){
    if(document.getElementById('hb-calendar-jump-style'))return;
    const style=document.createElement('style');
    style.id='hb-calendar-jump-style';
    style.textContent=`
      .calendar-title.hb-jump-ready{display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;user-select:none}
      .calendar-title.hb-jump-ready::after{content:'▦';font-size:17px;color:var(--accent,#d9781f);opacity:.8}
      .hb-calendar-jump{border:0;padding:0;width:min(92vw,380px);border-radius:24px;background:var(--surface,#fff);color:var(--text,#182230)}
      .hb-calendar-jump::backdrop{background:rgba(9,15,24,.48);backdrop-filter:blur(8px)}
      .hb-calendar-jump-card{padding:22px}
      .hb-calendar-jump-card h3{margin:0 0 6px;font-size:23px}.hb-calendar-jump-card p{margin:0 0 18px;color:var(--muted,#7e8793);font-size:13px}
      .hb-calendar-jump-card input{width:100%;box-sizing:border-box;padding:14px;border:1px solid var(--line,#ddd);border-radius:14px;background:var(--surface-2,#f5f5f5);color:var(--text,#182230)}
      .hb-calendar-jump-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
      .hb-calendar-jump-actions button{border:0;border-radius:13px;padding:12px;font-weight:850}.hb-jump-cancel{background:var(--surface-2,#eef1f4);color:var(--text,#182230)}.hb-jump-go{background:var(--accent,#d9781f);color:#fff}
    `;
    document.head.appendChild(style);
  }

  function currentMonth(){
    const text=document.querySelector('.calendar-title')?.textContent?.trim().toLowerCase()||'';
    const match=text.match(/([a-záéíóúñ]+)\s+(\d{4})/i);
    if(!match)return null;
    const month=MONTHS.indexOf(match[1].normalize('NFD').replace(/[\u0300-\u036f]/g,''));
    return month<0?null:{year:Number(match[2]),month};
  }

  function ensureDialog(){
    let dialog=document.getElementById('hbCalendarJump');
    if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.id='hbCalendarJump';
    dialog.className='hb-calendar-jump';
    dialog.innerHTML=`<form method="dialog" class="hb-calendar-jump-card"><h3>Ir a una fecha</h3><p>Elige directamente el mes y el año.</p><input type="month" name="targetMonth" required><div class="hb-calendar-jump-actions"><button value="cancel" class="hb-jump-cancel">Cancelar</button><button value="go" class="hb-jump-go">Ir</button></div></form>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('close',()=>{if(dialog.returnValue==='go')jumpTo(dialog.querySelector('input').value)});
    return dialog;
  }

  function jumpTo(value){
    if(!/^\d{4}-\d{2}$/.test(value))return;
    const current=currentMonth();
    if(!current)return;
    const [year,monthOne]=value.split('-').map(Number);
    let delta=(year-current.year)*12+(monthOne-1-current.month);
    if(!delta)return;
    const buttons=document.querySelectorAll('.calendar-top>button');
    const button=delta>0?buttons[buttons.length-1]:buttons[0];
    if(!button)return;
    let remaining=Math.min(Math.abs(delta),1200);
    const step=()=>{
      let n=Math.min(remaining,8);
      while(n-- > 0)button.click();
      remaining-=Math.min(remaining,8);
      if(remaining>0)requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function enhance(){
    ensureStyles();
    const title=document.querySelector('.calendar-title');
    if(!title||title.dataset.jumpReady==='1')return;
    title.dataset.jumpReady='1';
    title.classList.add('hb-jump-ready');
    title.setAttribute('role','button');
    title.setAttribute('tabindex','0');
    const open=()=>{
      const dialog=ensureDialog();
      const current=currentMonth();
      if(current)dialog.querySelector('input').value=`${current.year}-${String(current.month+1).padStart(2,'0')}`;
      dialog.showModal();
    };
    title.addEventListener('click',open);
    title.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open()}});
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));
  function init(){enhance();observer.observe(document.documentElement,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();